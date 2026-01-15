import { useCanvasStore } from '@/store/useCanvasStore';

export function useItemInteraction() {
  const cursorMode = useCanvasStore((state) => state.cursorMode);

  return {
    // 그리기 모드가 아닐 때만 아이템 조작 가능
    isInteractive: cursorMode !== 'draw',

    // 지우개 모드 여부
    isEraserMode: cursorMode === 'eraser',

    // 드래그 가능 여부 (그리기/지우개 모드에서는 불가)
    isDraggable: cursorMode !== 'draw' && cursorMode !== 'eraser',

    // 이벤트 리스닝 여부 (그리기 모드가 아닐 때 또는 지우개 모드일 때)
    isListening: cursorMode !== 'draw',
  };
}
