import { useState, useRef, useCallback } from 'react';
import Konva from 'konva';
import { useWhiteboardLocalStore } from '@/store/useWhiteboardLocalStore';
import { useItemActions } from '@/hooks/useItemActions';
import { usePointerTracking } from '@/hooks/usePointerTracking';

export function useDrawing() {
  const currentDrawing = useWhiteboardLocalStore(
    (state) => state.currentDrawing,
  );
  const startDrawing = useWhiteboardLocalStore((state) => state.startDrawing);
  const continueDrawing = useWhiteboardLocalStore(
    (state) => state.continueDrawing,
  );
  const finishDrawing = useWhiteboardLocalStore((state) => state.finishDrawing);
  const { addDrawing } = useItemActions();

  const [isDrawing, setIsDrawing] = useState(false);
  const stageRef = useRef<Konva.Stage | null>(null);

  const handleDrawingStart = (
    e: Konva.KonvaEventObject<MouseEvent | TouchEvent>,
    point: { x: number; y: number },
  ) => {
    // 기존 아이템 클릭 시 그리기 시작 안 함
    const clickedOnEmpty =
      e.target === e.target.getStage() || e.target.hasName('bg-rect');
    if (!clickedOnEmpty) return;

    const stage = e.target.getStage();
    if (!stage) return;

    stageRef.current = stage;
    setIsDrawing(true);
    startDrawing(point.x, point.y);
  };

  const handleMove = useCallback(
    (x: number, y: number) => {
      continueDrawing(x, y);
    },
    [continueDrawing],
  );

  const handleEnd = useCallback(() => {
    setIsDrawing(false);

    // 그리기 완료 시 아이템 추가
    const drawing = useWhiteboardLocalStore.getState().currentDrawing;
    if (drawing && drawing.points.length >= 4) {
      addDrawing(drawing);
    }

    finishDrawing();
    stageRef.current = null;
  }, [addDrawing, finishDrawing]);

  usePointerTracking({
    isActive: isDrawing,
    stageRef,
    onMove: handleMove,
    onEnd: handleEnd,
  });

  return {
    handleDrawingStart,
    currentDrawing,
  };
}
