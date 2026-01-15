import { useCanvasStore } from '@/store/useCanvasStore';
import type { ToolType, PanelType } from '@/types/whiteboard/whiteboardUI';

// 툴바의 도구/패널 선택에 따라 커서 모드 전환
export function useToolbarMode() {
  const setCursorMode = useCanvasStore((state) => state.setCursorMode);

  //선택된 도구에 따라 커서 모드 업데이트
  const updateModeForTool = (tool: ToolType) => {
    if (tool === 'select' || tool === 'move') {
      setCursorMode('select');
    } else if (tool === 'draw') {
      setCursorMode('draw');
    } else if (tool === 'eraser') {
      setCursorMode('eraser');
    } else if (
      tool === 'text' ||
      tool === 'arrow' ||
      tool === 'doubleArrow' ||
      tool === 'chevronArrow'
    ) {
      // 요소 추가 도구는 select 모드에서 작동
      setCursorMode('select');
    }
  };

  //열린 패널에 따라 커서 모드 업데이트
  const updateModeForPanel = (panel: PanelType) => {
    if (
      panel === 'cursor' ||
      panel === 'text' ||
      panel === 'arrow' ||
      panel === 'shape' ||
      panel === 'line' ||
      panel === 'media'
    ) {
      // 요소 추가 관련 패널은 select 모드
      setCursorMode('select');
    }
  };

  return { updateModeForTool, updateModeForPanel };
}
