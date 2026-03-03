import { useCallback } from 'react';
import Konva from 'konva';

import { useWhiteboardLocalStore } from '@/store/useWhiteboardLocalStore';
import { useWhiteboardSharedStore } from '@/store/useWhiteboardSharedStore';
import { useSelectionBox } from '@/hooks/useSelectionBox';
import { useCanvasMouseEvents } from '@/hooks/useCanvasMouseEvents';
import { usePinchZoom } from '@/hooks/usePinchZoom';

interface UseCanvasGlobalEventsProps {
  stageRef: React.RefObject<Konva.Stage | null>;
  handleWheel: (e: Konva.KonvaEventObject<WheelEvent>) => void;
}

export function useCanvasGlobalEvents({
  stageRef,
  handleWheel,
}: UseCanvasGlobalEventsProps) {
  const editingTextId = useWhiteboardLocalStore((state) => state.editingTextId);
  const cursorMode = useWhiteboardLocalStore((state) => state.cursorMode);
  const setStageScale = useWhiteboardLocalStore((state) => state.setStageScale);
  const setStagePos = useWhiteboardLocalStore((state) => state.setStagePos);
  const clearSelection = useWhiteboardLocalStore(
    (state) => state.clearSelection,
  );

  // 선택 해제 핸들러
  const handleCheckDeselect = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => {
      if (editingTextId) return;

      const clickedOnEmpty =
        e.target === e.target.getStage() || e.target.hasName('bg-rect');

      if (clickedOnEmpty) {
        clearSelection();
        useWhiteboardLocalStore.getState().setSelectedHandleIndex(null);
      }
    },
    [editingTextId, clearSelection],
  );

  const { startSelection, cancelSelection } = useSelectionBox({
    stageRef,
    enabled: cursorMode === 'select',
  });

  // 마우스 이벤트 통합 훅
  const { handlePointerDown, handlePointerMove, cancelDrawing, cancelErasing } =
    useCanvasMouseEvents({
      onDeselect: handleCheckDeselect,
      onSelectionBoxStart: startSelection,
    });

  // 핀치 줌 훅
  const {
    isActive: isPinching,
    handleTouchStart: handlePinchStart,
    handleTouchMove: handlePinchMove,
    handleTouchEnd: handlePinchEnd,
  } = usePinchZoom({
    stageRef,
    onScaleChange: setStageScale,
    onPositionChange: setStagePos,
    onPinchStart: () => {
      // 핀치 시작 시 그리기/지우개/선택박스 취소
      cancelDrawing();
      cancelErasing();
      cancelSelection();
      // 아이템 선택 해제
      clearSelection();
    },
  });

  // 캔버스 드래그 가능 여부 (핀치 줌 중에는 비활성화함)
  const isDraggable = cursorMode === 'move' && !isPinching;

  const handleTouchStart = useCallback(
    (e: Konva.KonvaEventObject<TouchEvent>) => {
      if (e.evt.touches.length === 2) {
        handlePinchStart(e.evt);
      } else {
        handlePointerDown(e);
      }
    },
    [handlePinchStart, handlePointerDown],
  );

  const handleTouchMove = useCallback(
    (e: Konva.KonvaEventObject<TouchEvent>) => {
      if (e.evt.touches.length === 2) {
        handlePinchMove(e.evt);
      } else {
        handlePointerMove(e);
      }
    },
    [handlePinchMove, handlePointerMove],
  );

  const handleTouchEnd = useCallback(
    (e: Konva.KonvaEventObject<TouchEvent>) => {
      handlePinchEnd(e.evt);
    },
    [handlePinchEnd],
  );

  const handleWheelWithEvent = useCallback(
    (e: Konva.KonvaEventObject<WheelEvent>) => {
      handleWheel(e);

      const stage = stageRef.current;
      if (!stage) return;

      // wheel 후 커서 위치 업데이트
      const pointerPos = stage.getPointerPosition();
      if (pointerPos) {
        const transform = stage.getAbsoluteTransform().copy().invert();
        const canvasPos = transform.point(pointerPos);

        const awareness = useWhiteboardSharedStore.getState().awareness;
        if (awareness) {
          const currentState = awareness.getLocalState();
          if (currentState) {
            awareness.setLocalState({
              ...currentState,
              cursor: { x: canvasPos.x, y: canvasPos.y },
            });
          }
        }
      }

      stage.fire('stageTransformChange');
    },
    [handleWheel, stageRef],
  );

  return {
    isDraggable,
    handlePointerDown,
    handlePointerMove,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    handleWheelWithEvent,
  };
}
