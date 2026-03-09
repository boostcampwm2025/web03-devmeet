import { AuthType, ToolBackendPayload } from '@/guards/guard.type';
import { Inject, Logger, UseInterceptors, UsePipes, ValidationPipe } from '@nestjs/common';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  WsException,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { CODEEDITOR_CLIENT_EVENT_NAME, CODEEDITOR_EVENT_NAME } from './codeeditor.constants';
import { CodeeditorService } from './codeeditor.service';
import { KafkaService } from '@/infra/event-stream/kafka/event-stream.service';
import { EVENT_STREAM_NAME } from '@/infra/event-stream/event-stream.constants';
import { CODEEDITOR_WEBSOCKET } from '@/infra/websocket/websocket.constants';
import { CodeeditorWebsocket } from '@/infra/websocket/codeeditor/codeeditor.service';
import * as Y from 'yjs';
import {
  CodeeditorRepository,
  YjsSyncReqPayload,
  YjsSyncServerPayload,
  YjsUpdateClientPayload,
} from '@/infra/memory/tool';
import { PrometheusService } from '@/infra/metric/prometheus/prometheus.service';
import { WsMetricsInterceptor } from '@/infra/metric/prometheus/prometheus.intercepter';

const ROOM_EVICT_DELAY_MS = 30_000;

@UseInterceptors(WsMetricsInterceptor)
@WebSocketGateway({
  namespace: process.env.NODE_BACKEND_WEBSOCKET_CODEEDITOR,
  path: process.env.NODE_BACKEND_WEBSOCKET_PREFIX,
  cors: {
    origin: process.env.NODE_ALLOWED_ORIGIN?.split(',').map((origin) => origin.trim()),
    credentials: process.env.NODE_ALLOWED_CREDENTIALS === 'true',
  },
  transports: ['websocket'],
  pingTimeout: 20 * 1000, // ping pong 허용 시간 ( 20초 )
})
export class CodeeditorWebsocketGateway implements OnGatewayInit, OnGatewayConnection {
  @WebSocketServer()
  private readonly server: Server;

  private readonly logger = new Logger(CodeeditorWebsocketGateway.name);
  private readonly roomEvictionTimers = new Map<string, NodeJS.Timeout>();

  constructor(
    private readonly codeeditorService: CodeeditorService,
    private readonly kafkaService: KafkaService,
    private readonly codeeditorRepo: CodeeditorRepository,
    @Inject(CODEEDITOR_WEBSOCKET) private readonly codeeditorSocket: CodeeditorWebsocket,
    private readonly prom: PrometheusService,
  ) {}

  // 연결을 했을때
  afterInit(server: Server): void {
    this.codeeditorSocket.bindServer(server);

    server.use(async (socket, next) => {
      try {
        const { token, type } = socket.handshake.auth as AuthType;

        if (!token) return next(new Error('TOKEN_REQUIRED'));
        if (type !== 'main' && type !== 'sub') return next(new Error('INVALID_TYPE'));

        const payload = await this.codeeditorService.guardService(token, type);

        // data 추가
        socket.data.payload = payload;
        return next();
      } catch (err) {
        this.logger.error(err);
        next(new Error('인증 에러'));
      }
    });
  }

  // 연결 완료 후
  async handleConnection(client: Socket) {
    const ns: string = client.nsp.name; // 여기서는 /signal이 될 예정이다.
    this.prom.wsConnectionsCurrent.labels(ns).inc();
    this.prom.wsConnectionsTotal.labels(ns).inc();

    const payload: ToolBackendPayload = client.data.payload;
    if (!payload) {
      client.disconnect(true);
      return;
    }

    const roomName = this.codeeditorService.makeNamespace(payload.room_id);
    await client.join(roomName);
    client.data.roomName = roomName;

    const existingTimer = this.roomEvictionTimers.get(roomName);
    if (existingTimer) {
      clearTimeout(existingTimer);
      this.roomEvictionTimers.delete(roomName);
    }

    if (payload.clientType === 'main') {
      // main이 불러오면 ydoc에 있는 캐시도 자동으로 불러오게 한다.

      this.kafkaService.emit(EVENT_STREAM_NAME.CODEEDITOR_ENTER, {
        room_id: payload.room_id,
        user_id: payload.user_id,
        tool: payload.tool,
        socket_id: payload.socket_id,
        ticket: payload.ticket,
        at: Date.now(), // 현재 보낸 시간
      });
    }

    client.emit(CODEEDITOR_CLIENT_EVENT_NAME.PERMISSION, { ok: true });
  }

  async handleDisconnect(client: Socket) {
    // 연결과 관련된 네임스페이스
    const ns = client.nsp.name;
    this.prom.wsConnectionsCurrent.labels(ns).dec();
    const reason =
      (client as any).disconnectReason ?? (client as any).conn?.closeReason ?? 'unknown';
    this.prom.wsDisconnectsTotal.labels(ns, reason).inc();

    const roomName: string | undefined = client.data.roomName;
    const payload: ToolBackendPayload | undefined = client.data.payload;
    if (!roomName || !payload?.room_id) return;

    const existingTimer = this.roomEvictionTimers.get(roomName);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }

    const timer = setTimeout(async () => {
      const sockets = await this.server.in(roomName).allSockets();
      if (sockets.size > 0) return;

      await this.codeeditorService.flushRoomUpdates(payload.room_id);
      await this.codeeditorService.maybeSnapShot(payload.room_id, true);

      this.codeeditorService.clearRoomState(payload.room_id);
      this.codeeditorRepo.delete(payload.room_id);
      this.roomEvictionTimers.delete(roomName);

      this.logger.log(`codeeditor room evicted: ${payload.room_id}`);
    }, ROOM_EVICT_DELAY_MS);
    this.roomEvictionTimers.set(roomName, timer);
  }

  @SubscribeMessage(CODEEDITOR_EVENT_NAME.HEALTH_CHECK)
  healthCheck(@ConnectedSocket() client: Socket) {
    try {
      const payload: ToolBackendPayload = client.data.payload;
      this.logger.log('health체크중: ', payload);

      return { ok: true };
    } catch (err) {
      this.logger.error(err);
      throw new WsException({ message: err.message ?? '에러 발생', status: err.status ?? 500 });
    }
  }

  // 좀더 안전하게 하기 위한 ready
  @SubscribeMessage('yjs-ready')
  async onReady(@ConnectedSocket() client: Socket, @MessageBody() payload?: YjsSyncReqPayload) {
    if (client.data.__yjsReadySent) return;
    client.data.__yjsReadySent = true;

    const dataPayload: ToolBackendPayload = client.data.payload;
    await this.codeeditorService.ensureDocFromRedis(dataPayload.room_id);

    const entry = this.codeeditorRepo.ensure(dataPayload.room_id);
    const clientStateVector =
      this.codeeditorService.normalizeToUint8Array(payload?.state_vector) ?? new Uint8Array();
    const diff = Y.encodeStateAsUpdate(entry.doc, clientStateVector);
    const serverStateVector = Y.encodeStateVector(entry.doc);
    this.logger.debug(
      `yjs-ready room=${dataPayload.room_id} client_sv=${clientStateVector.byteLength} diff=${diff.byteLength}`,
    );

    client.emit('yjs-init', {
      update: Buffer.from(diff),
      state_vector: Buffer.from(serverStateVector),
      origin: 'INIT',
    });
  }

  // 업데이트 하고 싶다고 보내는 메시지
  @SubscribeMessage('yjs-update')
  @UsePipes(new ValidationPipe({ whitelist: true }))
  async handleYjsUpdate(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: YjsUpdateClientPayload,
  ) {
    // 캐싱된 룸 이름 사용
    const roomName = client.data.roomName;
    const dataPayload: ToolBackendPayload = client.data.payload;
    if (!roomName) return;

    try {
      const bufs = this.codeeditorService.normalizeToBuffers(payload);
      if (!bufs || bufs.length === 0) {
        client.emit('yjs-sync', {
          type: 'error',
          ok: false,
          code: 'BAD_PAYLOAD',
        } satisfies YjsSyncServerPayload);
        return;
      }

      const appliedUpdates: Uint8Array[] = [];
      for (const b of bufs) {
        const u = new Uint8Array(b);
        this.codeeditorRepo.applyAndAppendUpdate(dataPayload.room_id, u);
        appliedUpdates.push(u);
      }

      const merged =
        appliedUpdates.length === 1
          ? Buffer.from(appliedUpdates[0])
          : Buffer.from(Y.mergeUpdates(appliedUpdates));
      this.logger.debug(
        `yjs-update room=${dataPayload.room_id} updates=${appliedUpdates.length} merged=${merged.byteLength}`,
      );

      client.to(roomName).emit('yjs-update', { update: merged, ts: payload.ts });
      this.codeeditorService.queueUpdatesToStream(
        dataPayload.room_id,
        appliedUpdates,
        dataPayload.user_id,
      );
    } catch (error) {
      this.logger.error(`Yjs Update Error: ${error?.message ?? error}`);
      const msg: YjsSyncServerPayload = {
        type: 'error',
        ok: false,
        code: 'INTERNAL',
        message: error?.message,
      };
      client.emit('yjs-sync', msg);
    }
  }

  // update를 받았는데 싱크가 안맞을 경우 요청해야 한다.
  @SubscribeMessage('yjs-sync-req')
  @UsePipes(new ValidationPipe({ whitelist: true }))
  handleYjsSyncReq(@ConnectedSocket() client: Socket, @MessageBody() payload: YjsSyncReqPayload) {
    const roomName = client.data.roomName;
    const dataPayload: ToolBackendPayload = client.data.payload;
    if (!roomName) return;

    try {
      const entry = this.codeeditorRepo.ensure(dataPayload.room_id);
      const clientStateVector =
        this.codeeditorService.normalizeToUint8Array(payload?.state_vector) ?? new Uint8Array();
      const diff = Y.encodeStateAsUpdate(entry.doc, clientStateVector);
      const serverStateVector = Y.encodeStateVector(entry.doc);
      this.logger.debug(
        `yjs-sync-req room=${dataPayload.room_id} reason=${payload?.reason ?? 'unknown'} client_sv=${clientStateVector.byteLength} diff=${diff.byteLength}`,
      );

      client.emit('yjs-sync', {
        type: 'diff',
        ok: true,
        update: Buffer.from(diff),
        server_state_vector: Buffer.from(serverStateVector),
        origin: 'SYNC_REQ',
      } satisfies YjsSyncServerPayload);
    } catch (error: any) {
      this.logger.error(`Yjs SyncReq Error: ${error?.message ?? error}`);
      const msg: YjsSyncServerPayload = {
        type: 'error',
        ok: false,
        code: 'INTERNAL',
        message: error?.message,
        origin: 'SYNC_REQ',
      };
      client.emit('yjs-sync', msg);
    }
  }

  @SubscribeMessage('awareness-update')
  handleAwarenessUpdate(@ConnectedSocket() client: Socket, @MessageBody() update: Buffer) {
    try {
      if (!update) return;

      client.to(client.data.roomName).volatile.emit('awareness-update', update);
    } catch (error) {
      this.logger.error(`Awareness Update Error: ${error.message}`);
    }
  }
}
