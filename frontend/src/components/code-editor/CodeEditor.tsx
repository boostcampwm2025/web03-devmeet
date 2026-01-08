'use client';

import Editor from '@monaco-editor/react';
import type * as monaco from 'monaco-editor';
import { useEffect, useRef, useState } from 'react';
import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';

type CodeEditorProps = {
  language?: string;
  readOnly?: boolean;
  autoComplete?: boolean;
  minimap?: boolean;
};

export default function CodeEditor({
  language = 'typescript',
  readOnly = false,
  autoComplete = true,
  minimap = true,
}: CodeEditorProps) {
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
  const cleanupRef = useRef<(() => void) | null>(null);

  // 자동완성 상태
  const [isAutoCompleted, setIsAutoCompleted] = useState(autoComplete);

  // editor onMount
  const handleMount = async (editor: monaco.editor.IStandaloneCodeEditor) => {
    editorRef.current = editor;

    const ydoc = new Y.Doc();

    const { MonacoBinding } = await import('y-monaco');

    const provider = new WebsocketProvider(
      'ws://localhost:1234',
      'room-1',
      ydoc,
    );

    // 사용자 정보 동적 설정
    const name = `User-${Math.floor(Math.random() * 100)}`;
    // TODO: const color = getRandomColor();

    provider.awareness.setLocalStateField('user', {
      name,
      role: 'viewer',
    });

    const yText = ydoc.getText('monaco');

    const model = editor.getModel();
    if (!model) return;

    // 양방향 바인딩 해주기
    const binding = new MonacoBinding(
      yText, // 원본 데이터
      model, // 실제 에디터에 보이는 코드
      new Set([editor]), // 바인딩할 에디터 인스턴스들
      provider.awareness, // 여기서 다른 유저들의 위치 정보를 받아온다.
    );

    cleanupRef.current = () => {
      binding.destroy();
      provider.destroy();
      ydoc.destroy();
    };
  };

  useEffect(() => {
    return () => cleanupRef.current?.();
  }, []);

  // 자동완성 토글
  const toggleAutoComplete = () => {
    setIsAutoCompleted((prev) => !prev);

    if (editorRef.current) {
      const nextValue = !isAutoCompleted;

      editorRef.current.updateOptions({
        quickSuggestions: {
          other: nextValue, // 일반 코드
          comments: nextValue, // 주석 안
          strings: nextValue, // 문자열 안
        },

        suggestOnTriggerCharacters: nextValue, // 특정 문자 입력 시 자동완성 트리거
        parameterHints: { enabled: nextValue }, // 함수 호출 시 파라미터 힌트
        tabCompletion: nextValue ? 'on' : 'off', // 탭키로 자동완성 선택

        // 자동 완성 목록에 어떤 걸 보여줄지
        suggest: {
          showMethods: nextValue,
          showFunctions: nextValue,
          showVariables: nextValue,
          showConstants: nextValue,
        },
      });
    }
  };

  return (
    <div className="flex h-full w-full flex-col">
      {/* 상단 컨트롤 */}
      <div className="flex items-center gap-2 border-b border-neutral-700 p-2">
        <button
          onClick={toggleAutoComplete}
          className={`rounded px-3 py-1 text-sm font-bold text-white transition-colors ${
            isAutoCompleted
              ? 'bg-green-600 hover:bg-green-500'
              : 'bg-red-600 hover:bg-red-500'
          }`}
        >
          자동완성 {isAutoCompleted ? 'ON' : 'OFF'}
        </button>
      </div>

      {/* 코드에디터 */}
      <Editor
        width="100%"
        height="100%"
        theme="vs-dark"
        defaultLanguage={language}
        onMount={handleMount}
        options={{
          readOnly,
          automaticLayout: true,

          // 편집
          tabSize: 2, // 탭 크기 설정
          insertSpaces: true, // 탭 입력 시 공백으로 처리
          fontSize: 14,

          // UX
          lineNumbers: 'on', // 줄번호 표시
          wordWrap: 'off', // 자동 줄바꿈 비활성화
          minimap: { enabled: minimap }, // 미니맵 활성화 여부

          // 자동완성
          quickSuggestions: isAutoCompleted,
          suggestOnTriggerCharacters: isAutoCompleted,
          acceptSuggestionOnEnter: isAutoCompleted ? 'on' : 'off', // 엔터키 자동완성
          tabCompletion: isAutoCompleted ? 'on' : 'off', // 탭키 자동완성

          // 문서 안에 있는 “단어들”을 자동완성 후보로 쓸지에 대한 설정
          wordBasedSuggestions: 'off', // 협업 중엔 끄는 게 깔끔해서 off로 설정

          // 기타
          cursorStyle: 'line',
          scrollBeyondLastLine: false,
          mouseWheelZoom: true, // ctrl + 마우스 휠로 폰트 크기 확대/축소
        }}
      />
    </div>
  );
}
