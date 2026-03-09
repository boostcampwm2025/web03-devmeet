/* eslint-disable no-console */
import { io, Socket } from 'socket.io-client';
import * as Y from 'yjs';

type SyncMsg =
  | {
      type: 'diff';
      ok: true;
      update: ArrayBuffer | Uint8Array;
      server_state_vector?: ArrayBuffer | Uint8Array;
      origin: 'SYNC_REQ' | 'INIT';
    }
  | {
      type: 'error';
      ok: false;
      code: 'BAD_PAYLOAD' | 'ROOM_NOT_FOUND' | 'INTERNAL';
      message?: string;
      origin?: 'SYNC_REQ' | 'INIT';
    };

type ReadyReason = 'INIT' | 'MANUAL' | 'UNKNOWN' | 'REMOTE_APPLY_FAILED' | 'SERVER_HINT';

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const randomInt = (min: number, max: number) =>
  Math.floor(Math.random() * (max - min + 1)) + min;

const randomToken = () => {
  const bag = 'abcdefghijklmnopqrstuvwxyz0123456789';
  return bag[randomInt(0, bag.length - 1)];
};

class VirtualClient {
  readonly id: number;
  readonly doc: Y.Doc;
  readonly text: Y.Text;
  private readonly ticket: string;
  private readonly type: 'main' | 'sub';
  private readonly namespaceUrl: string;
  private readonly wsPath: string;
  private readonly roomCode: string;
  private suppressSend = false;
  private socket: Socket | null = null;

  syncReqCount = 0;
  diffBytesReceived = 0;
  remoteUpdatesReceived = 0;
  connected = false;

  constructor(params: {
    id: number;
    ticket: string;
    type: 'main' | 'sub';
    namespaceUrl: string;
    wsPath: string;
    roomCode: string;
  }) {
    this.id = params.id;
    this.ticket = params.ticket;
    this.type = params.type;
    this.namespaceUrl = params.namespaceUrl;
    this.wsPath = params.wsPath;
    this.roomCode = params.roomCode;

    this.doc = new Y.Doc();
    this.text = this.doc.getText('monaco');
  }

  private emitReady(reason: ReadyReason) {
    if (!this.socket) return;
    this.socket.emit('yjs-ready', {
      state_vector: Y.encodeStateVector(this.doc),
      reason,
    });
  }

  private emitSyncReq(reason: ReadyReason) {
    if (!this.socket) return;
    this.syncReqCount += 1;
    this.socket.emit('yjs-sync-req', {
      state_vector: Y.encodeStateVector(this.doc),
      reason,
    });
  }

  manualSync(reason: ReadyReason = 'MANUAL') {
    this.emitSyncReq(reason);
  }

  private applyRemote(update: ArrayBuffer | Uint8Array) {
    this.suppressSend = true;
    try {
      Y.applyUpdate(this.doc, update instanceof Uint8Array ? update : new Uint8Array(update));
    } catch {
      this.emitSyncReq('REMOTE_APPLY_FAILED');
    } finally {
      this.suppressSend = false;
    }
  }

  async connect() {
    if (this.socket?.connected) return;

    const socket = io(this.namespaceUrl, {
      path: this.wsPath,
      transports: ['websocket'],
      auth: { token: this.ticket, type: this.type },
      query: { room_code: this.roomCode },
      reconnection: false,
    });
    this.socket = socket;

    this.doc.on('update', (update) => {
      if (!this.socket || !this.connected) return;
      if (this.suppressSend) return;
      this.socket.emit('yjs-update', { update });
    });

    socket.on('connect', () => {
      this.connected = true;
      this.emitReady('INIT');
    });

    socket.on('disconnect', () => {
      this.connected = false;
    });

    socket.on('yjs-init', (payload: { update: ArrayBuffer | Uint8Array }) => {
      this.applyRemote(payload.update);
    });

    socket.on('yjs-sync', (msg: SyncMsg) => {
      if (!msg.ok) return;
      if (msg.type !== 'diff') return;
      const bytes =
        msg.update instanceof Uint8Array ? msg.update.byteLength : msg.update.byteLength;
      this.diffBytesReceived += bytes;
      if (bytes > 0) {
        this.applyRemote(msg.update);
      }
    });

    socket.on('yjs-update', (msg: { update?: ArrayBuffer | Uint8Array; updates?: unknown[] }) => {
      const updates = msg.updates ?? (msg.update ? [msg.update] : []);
      for (const update of updates) {
        this.remoteUpdatesReceived += 1;
        this.applyRemote(update as ArrayBuffer | Uint8Array);
      }
    });

    await new Promise<void>((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error(`client-${this.id} connect timeout`)), 8000);
      socket.once('connect', () => {
        clearTimeout(timer);
        resolve();
      });
      socket.once('connect_error', (err) => {
        clearTimeout(timer);
        reject(err);
      });
    });
  }

  async disconnect() {
    if (!this.socket) return;
    this.socket.disconnect();
    this.connected = false;
    await sleep(100);
  }

  async reconnect() {
    await this.disconnect();
    await this.connect();
  }

  typeText(chars = 1) {
    if (!this.connected) return;
    const token = Array.from({ length: chars }, () => randomToken()).join('');
    this.text.insert(this.text.length, token);
  }

  get value() {
    return this.text.toString();
  }
}

async function run() {
  const TOOL_BACKEND_URL = process.env.TOOL_BACKEND_URL ?? process.env.NEXT_PUBLIC_TOOL_BACKEND_URL;
  const WS_PATH =
    process.env.TOOL_BACKEND_WS_PATH ?? process.env.NEXT_PUBLIC_TOOL_BACKEND_WEBSOCKET_PREFIX;
  const ROOM_CODE = process.env.ROOM_CODE ?? 'load-test-room';
  const TICKET = process.env.CODEEDITOR_TICKET;

  const USER_COUNT = Number(process.env.USER_COUNT ?? 20);
  const TEST_SECONDS = Number(process.env.TEST_SECONDS ?? 25);
  const TYPE_INTERVAL_MS = Number(process.env.TYPE_INTERVAL_MS ?? 70);
  const PARTITION_USER_INDEX = Number(process.env.PARTITION_USER_INDEX ?? 1);

  if (!TOOL_BACKEND_URL || !WS_PATH || !TICKET) {
    throw new Error(
      '필수 환경변수 누락: TOOL_BACKEND_URL(or NEXT_PUBLIC_TOOL_BACKEND_URL), TOOL_BACKEND_WS_PATH(or NEXT_PUBLIC_TOOL_BACKEND_WEBSOCKET_PREFIX), CODEEDITOR_TICKET',
    );
  }

  const namespaceUrl = `${TOOL_BACKEND_URL}/codeeditor`;
  const users = Array.from({ length: USER_COUNT }, (_, idx) => {
    return new VirtualClient({
      id: idx,
      ticket: TICKET,
      type: idx === 0 ? 'main' : 'sub',
      namespaceUrl,
      wsPath: WS_PATH,
      roomCode: ROOM_CODE,
    });
  });

  console.log(`[load-test] connect ${USER_COUNT} users...`);
  await Promise.all(users.map((u) => u.connect()));
  console.log('[load-test] all connected');

  let stop = false;
  const typer = setInterval(() => {
    if (stop) return;
    const randomUser = users[randomInt(0, users.length - 1)];
    randomUser.typeText(1);
  }, TYPE_INTERVAL_MS);

  const target = users[PARTITION_USER_INDEX];
  const disconnectAfterMs = 4000;
  const partitionMs = randomInt(5000, 10000);

  await sleep(disconnectAfterMs);
  console.log(
    `[load-test] partition user=${PARTITION_USER_INDEX} for ${partitionMs}ms (network cut simulation)`,
  );
  await target.disconnect();

  await sleep(partitionMs);
  await target.connect();
  target.typeText(1);
  target.manualSync('MANUAL');
  console.log(`[load-test] user=${PARTITION_USER_INDEX} reconnected`);

  await sleep(Math.max(0, TEST_SECONDS * 1000 - disconnectAfterMs - partitionMs));
  stop = true;
  clearInterval(typer);

  // settle
  await sleep(2000);

  const base = users[0].value;
  const mismatched = users.filter((u) => u.value !== base);
  const totalSyncReq = users.reduce((acc, u) => acc + u.syncReqCount, 0);
  const targetDiff = target.diffBytesReceived;

  console.log('--- result ---');
  console.log(`doc_length=${base.length}`);
  console.log(`sync_req_total=${totalSyncReq}`);
  console.log(`partition_user_sync_req=${target.syncReqCount}`);
  console.log(`partition_user_diff_bytes=${targetDiff}`);
  console.log(`mismatched_users=${mismatched.length}`);

  await Promise.all(users.map((u) => u.disconnect()));

  if (target.syncReqCount < 1) {
    throw new Error('실패: partition 사용자에서 yjs-sync-req가 발생하지 않았습니다.');
  }
  if (targetDiff <= 0) {
    throw new Error('실패: partition 사용자의 diff bytes가 0입니다.');
  }
  if (mismatched.length > 0) {
    throw new Error(`실패: 문서가 수렴하지 않았습니다. mismatched=${mismatched.length}`);
  }

  console.log('PASS: 20명 가상 사용자 시나리오에서 문서 수렴 확인');
}

run()
  .then(() => {
    process.exit(0);
  })
  .catch((err) => {
    console.error('[load-test] failed:', err);
    process.exit(1);
  });
