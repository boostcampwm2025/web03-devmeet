import { io } from 'socket.io-client';
import * as Y from 'yjs';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const randomInt = (min, max) =>
  Math.floor(Math.random() * (max - min + 1)) + min;
const randomToken = () => {
  const bag = 'abcdefghijklmnopqrstuvwxyz0123456789';
  return bag[randomInt(0, bag.length - 1)];
};

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const FRONTEND_ROOT = path.resolve(__dirname, '..');

function loadDotEnv() {
  const envPath = path.join(FRONTEND_ROOT, '.env');
  if (!fs.existsSync(envPath)) return;
  const raw = fs.readFileSync(envPath, 'utf8');
  for (const line of raw.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIndex = trimmed.indexOf('=');
    if (eqIndex < 0) continue;
    const key = trimmed.slice(0, eqIndex).trim();
    if (!key || process.env[key] !== undefined) continue;
    let value = trimmed.slice(eqIndex + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    process.env[key] = value;
  }
}

function withAck(socket, event, payload, timeoutMs = 8000) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`ack timeout: ${event}`));
    }, timeoutMs);

    if (payload === undefined) {
      socket.emit(event, (res) => {
        clearTimeout(timer);
        resolve(res);
      });
      return;
    }

    socket.emit(event, payload, (res) => {
      clearTimeout(timer);
      resolve(res);
    });
  });
}

function emitAndWaitEvent(socket, event, payload, waitEvent, timeoutMs = 8000) {
  return new Promise((resolve, reject) => {
    const onOk = (data) => {
      clearTimeout(timer);
      socket.off('room:error', onErr);
      resolve(data);
    };
    const onErr = (err) => {
      clearTimeout(timer);
      socket.off(waitEvent, onOk);
      reject(
        new Error(
          typeof err?.message === 'string' ? err.message : `${event} failed`,
        ),
      );
    };
    const timer = setTimeout(() => {
      socket.off(waitEvent, onOk);
      socket.off('room:error', onErr);
      reject(new Error(`event timeout: ${event} -> ${waitEvent}`));
    }, timeoutMs);

    socket.once(waitEvent, onOk);
    socket.once('room:error', onErr);
    socket.emit(event, payload);
  });
}

async function issueCodeeditorTickets({
  signalingUrl,
  signalingNamespace,
  signalingPath,
  roomCode,
  roomPassword,
  userCount,
}) {
  const tickets = [];

  for (let i = 0; i < userCount; i++) {
    const socket = io(`${signalingUrl}${signalingNamespace}`, {
      path: signalingPath,
      transports: ['websocket'],
      reconnection: false,
    });

    await new Promise((resolve, reject) => {
      const timer = setTimeout(
        () => reject(new Error(`signaling connect timeout: user=${i}`)),
        8000,
      );
      socket.once('connect', () => {
        clearTimeout(timer);
        resolve();
      });
      socket.once('connect_error', (err) => {
        clearTimeout(timer);
        reject(err);
      });
    });

    await emitAndWaitEvent(
      socket,
      'signaling:ws:join_room',
      {
        code: roomCode,
        ...(roomPassword ? { password: roomPassword } : {}),
        nickname: `load-bot-${String(i).padStart(2, '0')}`,
      },
      'room:joined',
    );

    let res;
    if (i === 0) {
      // 이전 비정상 종료 등으로 tool producer 상태가 남아 있을 수 있어 선제 정리 시도
      try {
        await withAck(
          socket,
          'signaling:ws:disconnect_tool',
          { tool: 'codeeditor' },
          3000,
        );
      } catch {
        // no-op
      }

      try {
        res = await withAck(socket, 'signaling:ws:open_codeeditor');
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        if (
          message.includes('main producer') ||
          message.includes('main_producer') ||
          message.includes('이미 다른 main producer')
        ) {
          console.warn(
            '[load-test] open_codeeditor blocked by existing main producer. fallback -> connect_tool',
          );
          res = await withAck(socket, 'signaling:ws:connect_tool', {
            tool: 'codeeditor',
          });
        } else {
          throw err;
        }
      }
    } else {
      res = await withAck(socket, 'signaling:ws:connect_tool', {
        tool: 'codeeditor',
      });
    }

    if (!res || typeof res.ticket !== 'string') {
      socket.disconnect();
      throw new Error(
        `ticket issue failed: user=${i} response=${JSON.stringify(res)}`,
      );
    }

    tickets.push(res.ticket);
    socket.disconnect();
  }

  return tickets;
}

class VirtualClient {
  constructor({ id, ticket, type, namespaceUrl, wsPath, roomCode }) {
    this.id = id;
    this.ticket = ticket;
    this.type = type;
    this.namespaceUrl = namespaceUrl;
    this.wsPath = wsPath;
    this.roomCode = roomCode;

    this.doc = new Y.Doc();
    this.text = this.doc.getText('monaco');
    this.socket = null;
    this.suppressSend = false;
    this.connected = false;

    this.syncReqCount = 0;
    this.diffBytesReceived = 0;
    this.remoteUpdatesReceived = 0;
  }

  emitReady(reason) {
    if (!this.socket) return;
    this.socket.emit('yjs-ready', {
      state_vector: Y.encodeStateVector(this.doc),
      reason,
    });
  }

  emitSyncReq(reason) {
    if (!this.socket) return;
    this.syncReqCount += 1;
    this.socket.emit('yjs-sync-req', {
      state_vector: Y.encodeStateVector(this.doc),
      reason,
    });
  }

  manualSync(reason = 'MANUAL') {
    this.emitSyncReq(reason);
  }

  applyRemote(update) {
    this.suppressSend = true;
    try {
      Y.applyUpdate(
        this.doc,
        update instanceof Uint8Array ? update : new Uint8Array(update),
      );
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

    socket.on('yjs-init', (payload) => {
      this.applyRemote(payload.update);
    });

    socket.on('yjs-sync', (msg) => {
      if (!msg?.ok || msg.type !== 'diff') return;
      const bytes = msg.update?.byteLength ?? 0;
      this.diffBytesReceived += bytes;
      if (bytes > 0) {
        this.applyRemote(msg.update);
      }
    });

    socket.on('yjs-update', (msg) => {
      const updates = msg?.updates ?? (msg?.update ? [msg.update] : []);
      for (const update of updates) {
        this.remoteUpdatesReceived += 1;
        this.applyRemote(update);
      }
    });

    await new Promise((resolve, reject) => {
      const timer = setTimeout(
        () => reject(new Error(`client-${this.id} connect timeout`)),
        8000,
      );
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
  loadDotEnv();

  const TOOL_BACKEND_URL =
    process.env.TOOL_BACKEND_URL ??
    process.env.NEXT_PUBLIC_TOOL_BACKEND_URL ??
    'http://localhost:8000';
  const WS_PATH =
    process.env.TOOL_BACKEND_WS_PATH ??
    process.env.NEXT_PUBLIC_TOOL_BACKEND_WEBSOCKET_PREFIX ??
    '/tool/ws';

  const SIGNALING_URL =
    process.env.SIGNALING_URL ?? process.env.NEXT_PUBLIC_SERVER_URL;
  const SIGNALING_NAMESPACE = process.env.SIGNALING_NAMESPACE ?? '/signal';
  const SIGNALING_WS_PATH = process.env.SIGNALING_WS_PATH ?? '/api/ws/';

  const ROOM_CODE =
    process.env.NEXT_PUBLIC_ROOM_CODE ?? process.env.LOAD_TEST_ROOM_CODE;
  const ROOM_PASSWORD =
    process.env.ROOM_PASSWORD ?? process.env.LOAD_TEST_ROOM_PASSWORD;

  const USER_COUNT = Number(process.env.USER_COUNT ?? 20);
  const TEST_SECONDS = Number(process.env.TEST_SECONDS ?? 25);
  const TYPE_INTERVAL_MS = Number(process.env.TYPE_INTERVAL_MS ?? 70);
  const PARTITION_USER_INDEX = Number(process.env.PARTITION_USER_INDEX ?? 1);

  if (!TOOL_BACKEND_URL || !WS_PATH || !SIGNALING_URL || !ROOM_CODE) {
    console.log('', TOOL_BACKEND_URL);
    console.log('', WS_PATH);
    console.log('', SIGNALING_URL);
    console.log('', ROOM_CODE);
    throw new Error(
      '필수 환경변수 누락: ROOM_CODE(or LOAD_TEST_ROOM_CODE), SIGNALING_URL(or NEXT_PUBLIC_SERVER_URL)',
    );
  }

  console.log(`[load-test] issue tickets via signaling... room=${ROOM_CODE}`);
  const tickets = await issueCodeeditorTickets({
    signalingUrl: SIGNALING_URL,
    signalingNamespace: SIGNALING_NAMESPACE,
    signalingPath: SIGNALING_WS_PATH,
    roomCode: ROOM_CODE,
    roomPassword: ROOM_PASSWORD,
    userCount: USER_COUNT,
  });
  console.log(`[load-test] tickets issued: ${tickets.length}`);

  const namespaceUrl = `${TOOL_BACKEND_URL}/codeeditor`;
  const users = Array.from({ length: USER_COUNT }, (_, idx) => {
    return new VirtualClient({
      id: idx,
      ticket: tickets[idx],
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

  await sleep(
    Math.max(0, TEST_SECONDS * 1000 - disconnectAfterMs - partitionMs),
  );
  stop = true;
  clearInterval(typer);
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
    throw new Error(
      '실패: partition 사용자에서 yjs-sync-req가 발생하지 않았습니다.',
    );
  }
  if (targetDiff <= 0) {
    throw new Error('실패: partition 사용자의 diff bytes가 0입니다.');
  }
  if (mismatched.length > 0) {
    throw new Error(
      `실패: 문서가 수렴하지 않았습니다. mismatched=${mismatched.length}`,
    );
  }

  console.log('PASS: 20명 가상 사용자 시나리오에서 문서 수렴 확인');
}

run()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('[load-test] failed:', err);
    process.exit(1);
  });
