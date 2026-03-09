'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Editor from '@monaco-editor/react';
import * as monaco from 'monaco-editor';
import * as Y from 'yjs';
import * as awarenessProtocol from 'y-protocols/awareness';
import * as Sentry from '@sentry/nextjs';

import { colorFromClientId, injectCursorStyles } from '@/utils/code-editor';
import {
  AwarenessState,
  LanguageState,
  YjsInitPayload,
  YjsRemoteUpdate,
  YjsSyncReqPayload,
  YjsSyncServerPayload,
  YjsUpdateClientPayload,
} from '@/types/code-editor';
import CodeEditorToolbar from './CodeEditorToolbar';
import { EditorLanguage } from '@/constants/code-editor';
import { useToolSocketStore } from '@/store/useToolSocketStore';
import { useUserStore } from '@/store/useUserStore';
import { captureError, syncLog } from '@/utils/logging';
import { ErrorType } from '@/types/error';

type CodeEditorProps = {
  autoComplete?: boolean;
  minimap?: boolean;
};

export default function CodeEditor({
  autoComplete = true,
  minimap = true,
}: CodeEditorProps) {
  // refs
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
  const monacoRef = useRef<typeof import('monaco-editor') | null>(null);
  const providerRef = useRef<{
    ydoc: Y.Doc;
    awareness: awarenessProtocol.Awareness;
  } | null>(null);
  const latencySamplesRef = useRef<number[]>([]);

  const cursorCollectionsRef = useRef<
    Map<number, monaco.editor.IEditorDecorationsCollection>
  >(new Map());
  const onlyMyCursorRef = useRef(false);
  const cleanupRef = useRef<(() => void) | null>(null);

  const pendingUpdatesRef = useRef<Uint8Array[]>([]);
  const mergeTimerRef = useRef<NodeJS.Timeout | null>(null);

  const BUFFER_WINDOW_MS = 50; // 로컬 update를 모아서 한번에 전송하는 time window (50ms)

  // 동기화 관련 refs
  const syncState = useRef({
    suppressSend: false,
    syncReqInFlight: false,
    readySent: false,
  });

  // states
  const [isAutoCompleted, setIsAutoCompleted] = useState<boolean>(autoComplete);
  const [isPresenter, setIsPresenter] = useState<boolean>(false);
  const [hasPresenter, setHasPresenter] = useState<boolean>(false);
  const [codeLanguage, setCodeLanguage] =
    useState<EditorLanguage>('typescript');
  const [onlyMyCursor, setOnlyMyCursor] = useState<boolean>(false);

  // store
  const { codeEditorSocket: socket } = useToolSocketStore();
  const { nickname } = useUserStore();

  // editor 마운트 메인 로직
  const handleMount = async (
    editor: monaco.editor.IStandaloneCodeEditor,
    monaco: typeof import('monaco-editor'),
  ) => {
    editorRef.current = editor;
    monacoRef.current = monaco;

    // Yjs 객체 초기화
    const ydoc = new Y.Doc();
    const yLanguage = ydoc.getMap<LanguageState>('language');
    const yText = ydoc.getText('monaco');
    const awareness = new awarenessProtocol.Awareness(ydoc);
    providerRef.current = { ydoc, awareness };

    const remoteOrigin = Symbol('remote');
    editor.getModel()?.pushStackElement();

    const model = editor.getModel();
    if (!model) return;

    // 모나코 바인딩
    const { MonacoBinding } = await import('y-monaco');
    const binding = new MonacoBinding(
      yText,
      model,
      new Set([editor]),
      awareness,
    );
    const undoManager = new Y.UndoManager(yText, {
      trackedOrigins: new Set([binding]),
      captureTimeout: 500,
    });

    if (!socket) return;

    Sentry.setUser({ username: nickname });
    Sentry.setTags({
      feature: 'code-editor',
      initial_language: codeLanguage,
    });
    Sentry.setContext('editor_config', {
      autoComplete,
      minimap,
      clientId: providerRef.current?.ydoc.clientID,
    });
    syncLog('editor.mounted', {
      language: codeLanguage,
      clientId: ydoc.clientID,
    });

    const applyUpdatesNoSend = (updates: ArrayBuffer[]) => {
      syncState.current.suppressSend = true;

      const before = yText.length;

      try {
        ydoc.transact(() => {
          for (const u of updates) {
            Y.applyUpdate(ydoc, new Uint8Array(u));
          }
        }, remoteOrigin);

        const after = yText.length;

        syncLog('sync.remote.apply.result', {
          before,
          after,
          delta: after - before,
          updates: updates.length,
        });

        // 텍스트가 삭제만 되고 추가되지 않는 '씹힘' 현상 의심 구간
        if (before > 0 && after === 0) {
          syncLog(
            'sync.anomaly.text_wipe',
            {
              before,
              updates: updates.length,
            },
            'error',
          );
        }
      } catch (e) {
        captureError({
          error: e,
          type: ErrorType.SYNC,
          message: 'Yjs 트랜잭션 적용 실패',
          extra: { updateCount: updates.length },
        });
        return false;
      } finally {
        syncState.current.suppressSend = false;
      }

      return true;
    };

    const requestSync = (reason: YjsSyncReqPayload['reason'] = 'UNKNOWN') => {
      if (syncState.current.syncReqInFlight) return;
      if (!providerRef.current) return;

      Sentry.metrics.count('editor.sync.repair_request', 1, {
        attributes: { reason },
      });

      syncState.current.syncReqInFlight = true;
      const stateVector = Y.encodeStateVector(providerRef.current.ydoc);

      socket.emit('yjs-sync-req', {
        state_vector: stateVector,
        reason,
      } satisfies YjsSyncReqPayload);

      // 타임아웃으로 inFlight 해제(서버/네트워크 이슈 대비)
      setTimeout(() => {
        syncState.current.syncReqInFlight = false;
      }, 1500);
    };

    const clearPendingUpdates = () => {
      pendingUpdatesRef.current = [];
      if (mergeTimerRef.current) {
        clearTimeout(mergeTimerRef.current);
        mergeTimerRef.current = null;
      }
    };

    const emitMergedUpdates = () => {
      const updates = pendingUpdatesRef.current;
      if (updates.length === 0) return;

      const merged = Y.mergeUpdates(updates);
      socket.emit('yjs-update', {
        update: merged,
        ts: Date.now(),
      } satisfies YjsUpdateClientPayload);

      syncLog('sync.emit.merged_update', {
        updates: updates.length,
        bytes: merged.byteLength,
      });

      clearPendingUpdates();
    };

    const scheduleMergeEmit = () => {
      if (mergeTimerRef.current) return;

      mergeTimerRef.current = setTimeout(() => {
        emitMergedUpdates();
      }, BUFFER_WINDOW_MS);
    };

    awareness.setLocalState({
      user: {
        name: nickname || '알 수 없음',
        role: 'viewer',
        color: colorFromClientId(ydoc.clientID).cursor,
      },
      cursor: null,
    });

    // Awareness -> Socket
    awareness.on('update', () => {
      const update = awarenessProtocol.encodeAwarenessUpdate(awareness, [
        ydoc.clientID,
      ]);
      socket.emit('awareness-update', update);
    });

    // Socket -> Awareness
    const onAwarenessUpdate = (update: ArrayBuffer) => {
      awarenessProtocol.applyAwarenessUpdate(
        awareness,
        new Uint8Array(update),
        socket,
      );
    };
    socket.on('awareness-update', onAwarenessUpdate);

    // Socket -> Yjs (init)
    const onYjsInit = (data: YjsInitPayload) => {
      syncLog(
        'yjs-init',
        {
          size: data.update?.byteLength,
        },
        'info',
      );

      applyUpdatesNoSend([data.update]);
      syncState.current.syncReqInFlight = false;
    };
    socket.on('yjs-init', onYjsInit);

    // Socket -> Yjs (sync)
    const onYjsSync = (msg: YjsSyncServerPayload) => {
      if (!msg.ok) {
        captureError({
          error: new Error('SYNC_SERVER_ERROR'),
          type: ErrorType.SYNC,
          message: '서버 동기화 응답 거부',
          extra: { payload: msg },
        });

        syncState.current.syncReqInFlight = false;
        return;
      }

      if (msg.type === 'diff') {
        if (msg.update.byteLength > 0) {
          applyUpdatesNoSend([msg.update]);
        }
        syncState.current.syncReqInFlight = false;
        return;
      }
    };
    socket.on('yjs-sync', onYjsSync);

    const onYjsRemoteUpdate = (msg: YjsRemoteUpdate) => {
      const updates = msg.updates ?? (msg.update ? [msg.update] : []);
      if (updates.length === 0) return;

      // latency 측정
      if (msg.ts) {
        const latency = Date.now() - msg.ts;
        latencySamplesRef.current.push(latency);

        // 디버깅용
        console.log('update latency:', latency, 'ms');
      }

      const ok = applyUpdatesNoSend(updates);
      if (!ok) {
        requestSync('REMOTE_APPLY_FAILED');
      }
    };

    socket.on('yjs-update', onYjsRemoteUpdate);

    /**
     * 모든 리스너 등록이 끝난 뒤에 서버에 init 요청
     */
    if (!syncState.current.readySent) {
      syncState.current.readySent = true;
      socket.emit('yjs-ready', {
        state_vector: Y.encodeStateVector(ydoc),
        reason: 'INIT',
      } satisfies YjsSyncReqPayload);
    }

    //---- Yjs -> Socket (local updates) ----
    const onYdocUpdate = (update: Uint8Array, origin: unknown) => {
      syncLog('sync.local.update', {
        bytes: update.length,
      });

      if (origin === remoteOrigin) return;
      if (syncState.current.suppressSend) return;

      pendingUpdatesRef.current.push(update);
      scheduleMergeEmit();
    };
    ydoc.on('update', onYdocUpdate);

    // undo/redo 단축키 관리
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyZ, () =>
      undoManager.undo(),
    );
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyY, () =>
      undoManager.redo(),
    );
    editor.addCommand(
      monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.KeyZ,
      () => undoManager.redo(),
    );

    // 커서 렌더링
    const updateRemoteDecorations = (states: Map<number, AwarenessState>) => {
      if (!editorRef.current) return;

      const onlyMine = onlyMyCursorRef.current;
      const collections = cursorCollectionsRef.current;
      const myId = awareness.clientID;

      states.forEach((state, clientId) => {
        if (clientId === myId) return;

        if (!state.cursor || onlyMine) {
          collections.get(clientId)?.clear();
          return;
        }

        const { lineNumber, column } = state.cursor;

        if (!collections.has(clientId)) {
          collections.set(clientId, editor.createDecorationsCollection());
        }

        const collection = collections.get(clientId)!;

        const { cursor } = colorFromClientId(clientId);
        const displayedUserName = state.user?.name ?? 'User';

        injectCursorStyles(clientId, cursor, displayedUserName);

        collection.set([
          {
            range: new monaco.Range(lineNumber, column, lineNumber, column + 1),
            options: {
              className: `remote-cursor-${clientId}`,
            },
          },
        ]);

        // GC for removed clients
        for (const [cid, col] of collections) {
          if (!states.has(cid)) {
            col.clear();
            collections.delete(cid);
          }
        }
      });
    };

    const updatePresenterState = (states: Map<number, AwarenessState>) => {
      const presenter = [...states.entries()].find(
        ([, state]) => state.user?.role === 'presenter',
      );

      const presenterId = presenter?.[0] ?? null;
      const amIPresenter = presenterId === awareness.clientID;

      setHasPresenter(Boolean(presenterId));
      setIsPresenter(amIPresenter);

      editorRef.current?.updateOptions({
        readOnly: presenterId !== null && !amIPresenter,
      });
    };

    awareness.on('change', () => {
      const states = awareness.getStates();
      updateRemoteDecorations(states);
      updatePresenterState(states);
    });

    // cursor position -> awareness
    let cursorFrame: number | null = null;
    editor.onDidChangeCursorPosition((e) => {
      if (cursorFrame) return;
      cursorFrame = requestAnimationFrame(() => {
        awareness.setLocalStateField('cursor', {
          lineNumber: e.position.lineNumber,
          column: e.position.column,
        });
        cursorFrame = null;
      });
    });

    yLanguage.observe(() => {
      const lang = yLanguage.get('current');
      if (!lang) return;

      if (model.getLanguageId() !== lang.value) {
        monaco.editor.setModelLanguage(model, lang.value);
        setCodeLanguage(lang.value);
      }
    });

    cleanupRef.current = () => {
      syncState.current.readySent = false;

      // socket handler 제거
      socket.off('awareness-update', onAwarenessUpdate);
      socket.off('yjs-init', onYjsInit);
      socket.off('yjs-sync', onYjsSync);
      socket.off('yjs-update', onYjsRemoteUpdate);

      ydoc.off('update', onYdocUpdate);

      undoManager.destroy();
      binding.destroy();
      socket.disconnect();
      ydoc.destroy();

      cursorCollectionsRef.current.forEach((c) => c.clear());
      document
        .querySelectorAll('style[data-client-id]')
        .forEach((el) => el.remove());
    };
  };

  useEffect(() => {
    return () => cleanupRef.current?.();
  }, []);

  useEffect(() => {
    onlyMyCursorRef.current = onlyMyCursor;
    if (editorRef.current) {
      cursorCollectionsRef.current.forEach((c) => c.clear());
    }
  }, [onlyMyCursor]);

  const toggleAutoComplete = useCallback(() => {
    setIsAutoCompleted((prev) => !prev);
  }, []);

  const toggleOnlyMyCursor = useCallback(() => {
    setOnlyMyCursor((prev) => !prev);
  }, []);

  const becomePresenter = () => {
    if (hasPresenter) return;
    if (!providerRef.current) return;

    const prevUser = providerRef.current.awareness.getLocalState()?.user;
    providerRef.current.awareness.setLocalStateField('user', {
      ...prevUser,
      role: 'presenter',
    });
  };

  const cancelPresenter = () => {
    if (!providerRef.current) return;

    const prevUser = providerRef.current.awareness.getLocalState()?.user;
    providerRef.current.awareness.setLocalStateField('user', {
      ...prevUser,
      role: 'viewer',
    });
  };

  const changeLanguage = useCallback((lang: EditorLanguage) => {
    const editor = editorRef.current;
    const monaco = monacoRef.current;
    const model = editor?.getModel();
    const provider = providerRef.current;

    if (!editor || !monaco || !model || !provider) return;
    if (model.getLanguageId() === lang) return;

    monaco.editor.setModelLanguage(model, lang);
    setCodeLanguage(lang);

    const yLanguage = provider.ydoc.getMap<LanguageState>('language');
    yLanguage.set('current', {
      value: lang,
      updatedAt: Date.now(),
      updatedBy: provider.awareness.clientID,
    });
  }, []);

  return (
    <div className="flex h-full w-full flex-col">
      <CodeEditorToolbar
        isAutoCompleted={isAutoCompleted}
        isPresenter={isPresenter}
        hasPresenter={hasPresenter}
        onToggleAutoComplete={toggleAutoComplete}
        onBecomePresenter={becomePresenter}
        onCancelPresenter={cancelPresenter}
        language={codeLanguage}
        onLanguageChange={changeLanguage}
        isOnlyMycursor={onlyMyCursor}
        onToggleOnlyMyCursor={toggleOnlyMyCursor}
      />

      <Editor
        width="100%"
        height="100%"
        theme="vs-dark"
        defaultLanguage={codeLanguage}
        onMount={handleMount}
        options={{
          automaticLayout: true,

          // 편집
          tabSize: 2,
          insertSpaces: true,
          fontSize: 14,

          // UX
          lineNumbers: 'on',
          wordWrap: 'off',
          minimap: { enabled: minimap },

          // 자동완성
          quickSuggestions: isAutoCompleted,
          suggestOnTriggerCharacters: isAutoCompleted,
          acceptSuggestionOnEnter: isAutoCompleted ? 'on' : 'off',
          tabCompletion: isAutoCompleted ? 'on' : 'off',

          // 협업 중엔 끄는 게 깔끔
          wordBasedSuggestions: 'off',

          // 기타
          cursorStyle: 'line',
          scrollBeyondLastLine: false,
          mouseWheelZoom: true,
        }}
      />
    </div>
  );
}
