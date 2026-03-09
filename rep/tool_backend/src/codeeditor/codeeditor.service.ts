import { GuardService } from '@/guards/guard.service';
import { ToolBackendPayload } from '@/guards/guard.type';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { CODEEDITOR_GROUP } from './codeeditor.constants';
import {
  CACHE_CODEEDITOR_NAMESPACE_NAME,
  CACHE_CODEEDITOR_SNAPSHOT_KEY_NAME,
  CACHE_CODEEDITOR_STREAM_KEY_NAME,
  CACHE_NAMESPACE_NAME,
  CODEEDITOR_BATCH_MAX_UPDATES,
  CODEEDITOR_BATCH_WINDOW_MS,
  CODEEDITOR_SNAPSHOT_EVERY_MS,
  decodeB64,
  encodeB64,
  REDIS_SERVER,
  STREAM_MAXLEN,
} from '@/infra/cache/cache.constants';
import type { RedisClientType } from 'redis';
import { CodeeditorRepository, UpdateEntry, YjsUpdateClientPayload } from '@/infra/memory/tool';
import * as Y from 'yjs';

@Injectable()
export class CodeeditorService {
  private logger = new Logger(CodeeditorService.name);
  private pendingStreamWrites = new Map<
    string,
    {
      updates: Uint8Array[];
      user_id: string;
      timer?: NodeJS.Timeout;
      flushing: boolean;
    }
  >();
  private lastSnapshotAt = new Map<string, number>();
  private perSec = {
    queuedUpdates: 0,
    flushes: 0,
    redisWrites: 0,
    mergedUpdatesToRedis: 0,
  };
  private readonly perSecTimer: NodeJS.Timeout;
  private readonly memoryProbeTimer?: NodeJS.Timeout;

  constructor(
    private readonly guard: GuardService,
    @Inject(REDIS_SERVER) private readonly redis: RedisClientType<any, any>, // redis를 사용하기 위한 부분
    private readonly codeeditorRepo: CodeeditorRepository,
  ) {
    this.perSecTimer = setInterval(() => {
      const { queuedUpdates, flushes, redisWrites, mergedUpdatesToRedis } = this.perSec;
      if (queuedUpdates > 0 || flushes > 0 || redisWrites > 0 || mergedUpdatesToRedis > 0) {
        this.logger.log(
          `[codeeditor-throughput/1s] queued_updates=${queuedUpdates} flushes=${flushes} redis_writes=${redisWrites} merged_updates_to_redis=${mergedUpdatesToRedis}`,
        );
      }
      this.perSec.queuedUpdates = 0;
      this.perSec.flushes = 0;
      this.perSec.redisWrites = 0;
      this.perSec.mergedUpdatesToRedis = 0;
    }, 1000);
    this.perSecTimer.unref();

    if (process.env.CODEEDITOR_MEMORY_PROBE === 'true') {
      this.memoryProbeTimer = setInterval(() => {
        const mu = process.memoryUsage();
        this.logger.log(
          `[codeeditor-memory/10s] rooms=${this.codeeditorRepo.getRoomCount()} rss_mb=${(mu.rss / 1048576).toFixed(1)} heap_used_mb=${(mu.heapUsed / 1048576).toFixed(1)} heap_total_mb=${(mu.heapTotal / 1048576).toFixed(1)} external_mb=${(mu.external / 1048576).toFixed(1)}`,
        );

        const samples = this.codeeditorRepo.getAllRoomStats(5);
        for (const s of samples) {
          this.logger.log(
            `[codeeditor-room/10s] room=${s.room_id} seq=${s.seq} struct_buckets=${s.client_struct_buckets} total_structs=${s.total_structs} encode_full_bytes=${s.encode_full_bytes}`,
          );
        }
      }, 10_000);
      this.memoryProbeTimer.unref();
    }
  }

  async guardService(token: string, type: 'main' | 'sub'): Promise<ToolBackendPayload> {
    const verified = await this.guard.verify(token);

    const payload: ToolBackendPayload = {
      room_id: verified.room_id,
      user_id: verified.sub,
      tool: verified.tool,
      socket_id: verified.socket_id,
      ticket: verified.ticket,
      clientType: type,
      nickname: verified.nickname,
    };

    if (payload.tool !== 'codeeditor') throw new Error('codeeditor만 가능한 gateway입니다.');

    return payload;
  }

  // 이 함수로 가입을하고 여기로 브로드캐스팅을 진행합니다.
  makeNamespace(room_id: string): string {
    return `${CODEEDITOR_GROUP.CODEEDITOR}:${room_id}`;
  }

  // buffer가 ydocs가 허용하는 buffer인지 검증
  normalizeToBuffer(value: unknown): Buffer | null {
    if (!value) return null;
    if (Buffer.isBuffer(value)) return value;
    if (value instanceof Uint8Array) return Buffer.from(value);
    if (value instanceof ArrayBuffer) return Buffer.from(new Uint8Array(value));
    return null;
  }

  normalizeToUint8Array(value: unknown): Uint8Array | null {
    const buf = this.normalizeToBuffer(value);
    return buf ? new Uint8Array(buf) : null;
  }

  normalizeToBuffers(payload: YjsUpdateClientPayload): Buffer[] | null {
    // 검증을 위한 buf
    const toBuf = (v: any): Buffer | null => {
      if (!v) return null;
      if (Buffer.isBuffer(v)) return v;
      if (v instanceof Uint8Array) return Buffer.from(v);
      if (v instanceof ArrayBuffer) return Buffer.from(new Uint8Array(v));
      return null;
    };

    // updates 우선
    if (payload.updates !== undefined) {
      if (!Array.isArray(payload.updates)) return null;
      const bufs: Buffer[] = [];
      for (const item of payload.updates as any[]) {
        const b = toBuf(item);
        if (!b) return null;
        bufs.push(b);
      }
      return bufs;
    }

    // 다음은 update
    if (payload.update !== undefined) {
      const b = toBuf(payload.update);
      return b ? [b] : null;
    }

    return null; // 둘 다 없음
  }

  // redis 스트림으로 처리
  // stream 쌓는법
  // key이름 생성법
  private streamKey(room_id: string): string {
    return `${CACHE_NAMESPACE_NAME.CODEEDITOR}:${room_id}:${CACHE_CODEEDITOR_NAMESPACE_NAME.STREAM}`;
  }
  private snapshotKey(room_id: string): string {
    return `${CACHE_NAMESPACE_NAME.CODEEDITOR}:${room_id}:${CACHE_CODEEDITOR_NAMESPACE_NAME.SNAPSHOT}`;
  }
  private snapshotLockKey(room_id: string): string {
    return `${CACHE_NAMESPACE_NAME.CODEEDITOR}:${room_id}:${CACHE_CODEEDITOR_NAMESPACE_NAME.SNAPSHOT_LOCK}`;
  }

  // redis로 부터 docs를 가져오는 로직 ( 메모리에 없을 경우 cache에서 불러와서 저장한다. )
  async ensureDocFromRedis(room_id: string): Promise<UpdateEntry> {
    const existed = this.codeeditorRepo.get(room_id);
    if (existed) return this.codeeditorRepo.encodeFull(room_id);

    // 없으면 생성한다. ( cache에서 채울 예정 )
    this.codeeditorRepo.ensure(room_id);

    const snapKey: string = this.snapshotKey(room_id);
    const snap = await this.redis.hGetAll(snapKey); // 현재 snap shot을 가져온다.

    let snapshotIdx: string = '0-0'; // 초기 스트림 아이디
    const snapStr: string | null = snap[CACHE_CODEEDITOR_SNAPSHOT_KEY_NAME.SNAP];
    const idx: string | null = snap[CACHE_CODEEDITOR_SNAPSHOT_KEY_NAME.IDX];
    if (snap && snapStr && idx) {
      const snapBuf = decodeB64(snapStr);
      // 위에서 새로운 codeeditor을 업데이트 했음으로 데이터를 업데이트 해준다. ( 없을 경우에는 그냥 docs로 가게 된다. )
      this.codeeditorRepo.applySnapshot(room_id, new Uint8Array(snapBuf));
      snapshotIdx = idx; // 가장 마지막으로 업데이트
    }

    // snapshot 이후 stream을 다시 replay 한다.
    const stremkey: string = this.streamKey(room_id);
    const rows = await this.redis.xRange(stremkey, snapshotIdx, '+'); // 그 IDX 이후에 데이터가 있는지 확인

    for (const row of rows) {
      if (snapshotIdx !== '0-0' && row.id === snapshotIdx) continue;
      const uB64 = row.message[CACHE_CODEEDITOR_STREAM_KEY_NAME.UPDATE] as string | undefined;
      if (!uB64) continue;
      const uBuf = decodeB64(uB64);
      this.codeeditorRepo.applyAndAppendUpdate(room_id, new Uint8Array(uBuf));
    }

    // 마지막 stream 까지 업데이트 시킨다.
    return this.codeeditorRepo.encodeFull(room_id);
  }

  // stream update
  async appendUpdatesToStream(room_id: string, updates: Uint8Array[], user_id: string) {
    if (!updates.length) return '0-0';

    const streamKey: string = this.streamKey(room_id);
    const merged = updates.length === 1 ? updates[0] : Y.mergeUpdates(updates);
    const lastId = await this.redis.xAdd(streamKey, '*', {
      [CACHE_CODEEDITOR_STREAM_KEY_NAME.UPDATE]: encodeB64(merged),
      [CACHE_CODEEDITOR_STREAM_KEY_NAME.TX]: String(Date.now()),
      [CACHE_CODEEDITOR_STREAM_KEY_NAME.USER_ID]: user_id,
    });
    this.perSec.redisWrites += 1;
    this.perSec.mergedUpdatesToRedis += updates.length;

    return lastId;
  }

  queueUpdatesToStream(room_id: string, updates: Uint8Array[], user_id: string) {
    if (!updates.length) return;
    this.perSec.queuedUpdates += updates.length;
    const pending = this.pendingStreamWrites.get(room_id) ?? {
      updates: [],
      user_id,
      flushing: false,
    };
    pending.updates.push(...updates);
    pending.user_id = user_id;
    this.pendingStreamWrites.set(room_id, pending);
    this.logger.debug(
      `queue-stream room=${room_id} incoming=${updates.length} queued=${pending.updates.length}`,
    );

    if (pending.updates.length >= CODEEDITOR_BATCH_MAX_UPDATES) {
      void this.flushRoomUpdates(room_id);
      return;
    }

    if (!pending.timer) {
      pending.timer = setTimeout(() => {
        void this.flushRoomUpdates(room_id);
      }, CODEEDITOR_BATCH_WINDOW_MS);
    }
  }

  async flushRoomUpdates(room_id: string) {
    const pending = this.pendingStreamWrites.get(room_id);
    if (!pending || pending.flushing || pending.updates.length === 0) return;
    this.perSec.flushes += 1;

    pending.flushing = true;
    if (pending.timer) {
      clearTimeout(pending.timer);
      pending.timer = undefined;
    }

    try {
      const updates = pending.updates;
      pending.updates = [];

      this.logger.debug(`flush-stream room=${room_id} updates=${updates.length}`);
      await this.appendUpdatesToStream(room_id, updates, pending.user_id);
      await this.maybeSnapShot(room_id);
    } catch (err) {
      this.logger.error(`flushRoomUpdates error room=${room_id}`, err as any);
      pending.flushing = false;
      return;
    }

    pending.flushing = false;

    if (pending.updates.length > 0) {
      void this.flushRoomUpdates(room_id);
      return;
    }

    this.pendingStreamWrites.delete(room_id);
  }

  // time-window 기반 snapshot 생성
  async maybeSnapShot(room_id: string, force = false) {
    const now = Date.now();
    const lastAt = this.lastSnapshotAt.get(room_id) ?? 0;
    if (!force && now - lastAt < CODEEDITOR_SNAPSHOT_EVERY_MS) return;

    try {
      const snapU8 = this.codeeditorRepo.encodeSnapshot(room_id);
      const snapB64 = encodeB64(snapU8);

      const streamKey = this.streamKey(room_id);
      const latest = await this.redis.xRevRange(streamKey, '+', '-', { COUNT: 1 });
      const idx = latest.length ? latest[0].id : '0-0';

      const snapKey = this.snapshotKey(room_id);
      const tx = this.redis.multi();

      tx.hSet(snapKey, {
        [CACHE_CODEEDITOR_SNAPSHOT_KEY_NAME.SNAP]: snapB64,
        [CACHE_CODEEDITOR_SNAPSHOT_KEY_NAME.IDX]: idx,
        [CACHE_CODEEDITOR_SNAPSHOT_KEY_NAME.TX]: String(now),
      });

      tx.xTrim(streamKey, 'MAXLEN', STREAM_MAXLEN, { strategyModifier: '~' });

      const res = await tx.exec();
      if (!res) return;

      this.lastSnapshotAt.set(room_id, now);
    } catch (err) {
      this.logger.error(err);
    }
  }

  clearRoomState(room_id: string) {
    const pending = this.pendingStreamWrites.get(room_id);
    if (pending?.timer) {
      clearTimeout(pending.timer);
    }
    this.pendingStreamWrites.delete(room_id);
    this.lastSnapshotAt.delete(room_id);
  }
}
