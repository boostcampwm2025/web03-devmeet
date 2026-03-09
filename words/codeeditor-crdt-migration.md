# CodeEditor CRDT 동기화 구조 개선 문서

## 0. 개요
이 문서는 코드에디터 동기화 구조를 **서버 중심 seq 모델**에서 **Yjs state-vector 기반 CRDT 모델**로 개선한 내용과,
20명 가상 사용자 부하 테스트 시나리오를 정리한다.

핵심 목표는 다음과 같다.

1. `last_seq` 기반 reject/재전송 루프 제거
2. Yjs의 상태벡터(diff sync) 메커니즘을 표준 방식으로 사용
3. Redis write/snapshot 비용을 줄여 고부하에서도 이벤트 루프를 보호
4. room lifecycle 정리로 메모리 누수 위험 완화

---

## 1. Before -> After 파일별 변경 상세

### 1.1 프론트 타입 프로토콜

### 파일
- `frontend/src/types/code-editor.ts`

### Before
- `YjsInitPayload`에 `seq` 존재
- `YjsRemoteUpdate`가 `seq` 또는 `from_seq/to_seq` 배치 모델
- `YjsSyncServerPayload`가 `ack | patch | full | error`
- `YjsSyncReqPayload`가 `last_seq` 기반
- `YjsUpdateClientPayload`가 `last_seq` 포함

### After
- `YjsInitPayload`는 `update` + `state_vector` 선택값
- `YjsRemoteUpdate`는 `update | updates`만 허용
- `YjsSyncServerPayload`는 `diff | error`로 단순화
- `YjsSyncReqPayload`는 `state_vector + reason`
- `YjsUpdateClientPayload`에서 `last_seq` 제거

### 의미
클라이언트/서버 간 동기화 계약 자체가
`순번 검증`에서 `상태차 계산(diff)`으로 전환되었다.

---

### 1.2 프론트 에디터 동기화 로직

### 파일
- `frontend/src/components/code-editor/CodeEditor.tsx`

### Before
- `syncState`: `lastSeq`, `awaitingAck`, `dirty`, `lastSendAt` 중심
- ACK 대기 중 pending queue 적재
- queue overflow 또는 merge size 초과 시 full-state fallback
- remote update 수신 시 seq gap 검증 (`expected = lastSeq + 1`)
- gap 시 `yjs-sync-req(last_seq)` 요청

### After
- `syncState`: `suppressSend`, `syncReqInFlight`, `readySent`만 유지
- local update는 50ms 윈도우로 `Y.mergeUpdates` 후 즉시 전송
- ACK/dirty/full fallback 로직 제거
- remote update는 순번 검증 없이 적용, 실패 시에만 repair 요청
- `yjs-ready`, `yjs-sync-req` 모두 `state_vector` 전송

### 의미
입력 경로가 단순해졌다.
- 예전: `local -> ack 대기 -> buffer/overflow/full`
- 지금: `local -> merge -> emit`, 필요 시 `state_vector diff repair`

---

### 1.3 백엔드 DTO/메시지 모델

### 파일
- `rep/tool_backend/src/infra/memory/tool/yjs-repo.ts`

### Before
- `YjsUpdateClientPayload.last_seq` 필수
- `YjsSyncReqPayload.last_seq`
- `YjsSyncServerPayload`: `ack/patch/full/error`

### After
- `last_seq` 제거
- `YjsSyncReqPayload`: `state_vector`, `reason`
- `YjsSyncServerPayload`: `diff/error`

### 의미
서버가 클라 순번을 기준으로 합/불합을 판단하는 경로가 사라졌다.

---

### 1.4 백엔드 실시간 게이트웨이

### 파일
- `rep/tool_backend/src/codeeditor/codeeditor.gateway.ts`

### Before
- `yjs-update` 처리 시 `getUpdatesSince(last_seq)`로 mismatch 검사
- mismatch면 `UPDATE_REJECTED`로 full/patch 전송
- 정상 경로에서도 ack 전송
- 브로드캐스트 payload에 `seq` 또는 `from_seq/to_seq` 포함
- disconnect 시 room memory 정리 TODO

### After
- `yjs-update`: 들어온 update를 바로 `Y.applyUpdate`로 반영
- ack/reject/full/patch 분기 제거
- 브로드캐스트는 merge된 update 바이트만 전송
- `yjs-ready`, `yjs-sync-req`는 `encodeStateAsUpdate(doc, clientSV)` diff 전송
- disconnect 시 30초 유예 후 room 비어 있으면 flush/snapshot 후 메모리 제거
- 디버깅 로그 추가
  - `yjs-ready room=... client_sv=... diff=...`
  - `yjs-update room=... updates=... merged=...`
  - `yjs-sync-req room=... reason=... diff=...`

### 의미
서버 역할이 `순서 심판자`에서 `CRDT 상태 중계/적용자`로 바뀌었다.

---

### 1.5 백엔드 서비스 계층 (Redis, Snapshot)

### 파일
- `rep/tool_backend/src/codeeditor/codeeditor.service.ts`
- `rep/tool_backend/src/infra/cache/cache.constants.ts`

### Before
- 소켓 이벤트마다 `await appendUpdatesToStream` (즉시 Redis write)
- snapshot 빈도는 update count 기반(`SNAPSHOT_N`)

### After
- room 단위 pending queue로 stream write batching
  - `CODEEDITOR_BATCH_WINDOW_MS = 1000`
  - `CODEEDITOR_BATCH_MAX_UPDATES = 300`
- flush 시 update들을 merge해서 Redis `XADD` 1회 수행
- snapshot은 시간 기반 최소 주기
  - `CODEEDITOR_SNAPSHOT_EVERY_MS = 60_000`
- 로그 추가
  - `queue-stream room=... incoming=... queued=...`
  - `flush-stream room=... updates=...`

### 의미
핫패스에서 Redis 동기 write 빈도를 낮춰,
동시 입력이 많을 때 WebSocket 처리 지연을 줄인다.

---

### 1.6 부하 테스트 실행 경로

### 파일
- `frontend/scripts/codeeditor-load-test.mjs`
- `frontend/package.json`
- (보조) `frontend/src/components/__tests__/code-editor/load-test.ts`

### 변경
- `pnpm test:codeeditor:load` 스크립트 추가
- `.env` 자동 로드
- 시그널링을 통해 티켓 자동 발급
  - user0: `open_codeeditor` (main)
  - others: `connect_tool` (sub)
- 20명 가상 클라 연결/타이핑/단절복구/수렴 검증 자동화

---

## 2. Before -> After 개선 구조 요약

## 2.1 구조 비교표

| 구분 | Before | After |
|---|---|---|
| 동기화 기준 | `last_seq` | `state_vector` |
| 서버 응답 타입 | `ack/patch/full` | `diff` |
| gap 처리 | reject + sync 강제 | 상태벡터 diff repair |
| 클라 송신 흐름 | ack 대기/queue/full fallback | 50ms merge 즉시 전송 |
| Redis write | update마다 await | 배치 flush |
| snapshot 트리거 | update count | 시간 기반(최소 1분) |
| 메모리 정리 | TODO | room empty 지연 삭제 구현 |

## 2.2 수렴 전략

개선 후 충돌/누락 복구 전략은 다음 한 줄로 요약된다.

> "업데이트 순서를 맞추는 것"이 아니라 "문서 상태를 수렴시키는 것"

실제 동작:
1. 각 클라는 local update를 Yjs update로 생성
2. 서버는 조건 없이 apply
3. 누락이 생긴 클라는 자신의 state-vector를 서버에 전달
4. 서버는 해당 벡터 기준으로 필요한 diff만 계산해 반환
5. 클라가 diff 적용 후 동일 상태로 수렴

---

## 3. 다중 사용자 테스트 문서화 (20명 가상 사용자)

## 3.1 테스트 목표
다음 시나리오가 자동 검증된다.

1. 20명 동시 접속 후 랜덤 타이핑
2. 특정 사용자(B) 네트워크 단절 5~10초
3. 복구 후 `yjs-sync-req` 발생
4. 서버 diff 수신
5. 최종 텍스트 전원 동일성 확인

## 3.2 테스트 코드 플로우

### 1) 환경 로드
- `.env` 파일 자동 로드
- 기본값
  - `TOOL_BACKEND_URL=http://localhost:8000`
  - `TOOL_BACKEND_WS_PATH=/tool/ws`

### 2) 티켓 자동 발급 (`issueCodeeditorTickets`)
- 시그널링(`/signal`) 연결
- `signaling:ws:join_room` emit 후 `room:joined` 이벤트 대기
- 0번 사용자는 `signaling:ws:open_codeeditor`로 main ticket 발급
- 1~19번은 `signaling:ws:connect_tool`로 sub ticket 발급

### 3) 가상 클라이언트 생성 (`VirtualClient`)
- 각 클라별 `Y.Doc`, `Y.Text('monaco')` 유지
- 로컬 update 발생 시 `yjs-update` emit
- 서버 `yjs-init`, `yjs-update`, `yjs-sync(diff)` 수신 시 apply
- apply 실패 시 `yjs-sync-req(REMOTE_APPLY_FAILED)`

### 4) 부하 생성
- `TYPE_INTERVAL_MS` 간격으로 랜덤 사용자가 1글자 입력
- 기본값 70ms

### 5) 네트워크 단절 시뮬레이션
- 기본 4초 후 target 사용자 disconnect
- 5~10초 랜덤 대기 후 reconnect
- reconnect 직후 `manualSync('MANUAL')` 호출

### 6) 성공/실패 판정
- `partition_user_sync_req >= 1`
- `partition_user_diff_bytes > 0`
- `mismatched_users == 0`

조건 위반 시 테스트 실패 처리.

---

## 3.3 실행 방법

### 1) 필수 준비
- 시그널링/툴 백엔드 서버 실행
- `.env`에 room code 지정

예시:

```env
NEXT_PUBLIC_SERVER_URL="http://localhost:8080"
NEXT_PUBLIC_TOOL_BACKEND_URL="http://localhost:8000"
NEXT_PUBLIC_TOOL_BACKEND_WEBSOCKET_PREFIX="/tool/ws"
ROOM_CODE="실제_32자리_방코드"
# ROOM_PASSWORD="필요한 경우"
```

### 2) 실행

```bash
cd frontend
pnpm test:codeeditor:load
```

### 3) 기대 로그

```text
[load-test] tickets issued: 20
[load-test] all connected
[load-test] partition user=1 for 7xxxms
[load-test] user=1 reconnected
--- result ---
partition_user_sync_req=...
partition_user_diff_bytes=...
mismatched_users=0
PASS: 20명 가상 사용자 시나리오에서 문서 수렴 확인
```

---

## 4. 결론
이번 개선은 다음을 달성했다.

1. seq 기반 reject 루프 제거
2. Yjs state-vector diff 복구 표준화
3. Redis write/snapshot 비용 완화
4. room 정리 자동화
5. 20명 동시/단절복구 시나리오에서 문서 수렴 PASS

즉, 기존 구조에서 빈번하던 "동기화 꼬임 -> full fallback -> 지연/누락 체감" 경로를
CRDT 본연의 수렴 모델 중심으로 재정렬했다.
