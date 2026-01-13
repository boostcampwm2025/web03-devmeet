import { ArrowDownIcon } from '@/assets/icons/common';
import { EditorLanguage, LANGUAGE_OPTIONS } from '@/constants/code-editor';
import React from 'react';

type CodeEditorToolbarProps = {
  isAutoCompleted: boolean;
  isPresenter: boolean;
  hasPresenter: boolean;
  onToggleAutoComplete: () => void;
  onBecomePresenter: () => void;
  onCancelPresenter: () => void;
  language: EditorLanguage;
  onLanguageChange: (lang: EditorLanguage) => void;
};

function CodeEditorToolbar({
  isAutoCompleted,
  isPresenter,
  hasPresenter,
  onToggleAutoComplete,
  onBecomePresenter,
  onCancelPresenter,
  language,
  onLanguageChange,
}: CodeEditorToolbarProps) {
  const disabledPresenter = hasPresenter && !isPresenter;

  return (
    <div className="flex items-center gap-2 border-b border-neutral-700 p-2">
      <button
        onClick={onToggleAutoComplete}
        className={`rounded px-3 py-1 text-sm font-bold text-white transition-colors ${
          isAutoCompleted
            ? 'bg-green-600 hover:bg-green-500'
            : 'bg-red-600 hover:bg-red-500'
        }`}
      >
        자동완성 {isAutoCompleted ? 'ON' : 'OFF'}
      </button>

      {!isPresenter && (
        <button
          onClick={onBecomePresenter}
          disabled={disabledPresenter}
          className={`rounded px-3 py-1 text-sm ${disabledPresenter ? 'bg-neutral-100 text-neutral-400' : 'bg-blue-600 text-white'}`}
        >
          스포트라이트
        </button>
      )}

      {isPresenter && (
        <button
          onClick={onCancelPresenter}
          className="rounded bg-red-600 px-3 py-1 text-sm text-white"
        >
          스포트라이트 해제
        </button>
      )}

      {hasPresenter && (
        <span className="text-sm text-neutral-400">
          {isPresenter ? '편집 가능 (발표자)' : '읽기 전용 (참가자)'}
        </span>
      )}

      {/* 언어 설정 */}
      <form className="relative inline-block">
        <label htmlFor="lang" className="sr-only">
          Language
        </label>

        <select
          id="lang"
          value={language}
          onChange={(e) => onLanguageChange(e.target.value as EditorLanguage)}
          className="appearance-none rounded-md bg-neutral-800 px-3 py-1 pr-9 text-sm text-white focus:outline-none"
        >
          {LANGUAGE_OPTIONS.map((lang) => (
            <option key={lang.value} value={lang.value}>
              {lang.label}
            </option>
          ))}
        </select>

        <ArrowDownIcon className="pointer-events-none absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 text-neutral-400" />
      </form>
    </div>
  );
}

export default React.memo(CodeEditorToolbar);
