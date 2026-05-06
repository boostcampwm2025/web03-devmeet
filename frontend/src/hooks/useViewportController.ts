import { useState, useEffect, useMemo, useRef } from 'react';
import Konva from 'konva';
import { useWhiteboardSharedStore } from '@/store/useWhiteboardSharedStore';
import { useWhiteboardLocalStore } from '@/store/useWhiteboardLocalStore';
import { getViewportRect, filterVisibleItems } from '@/utils/viewport';
import type { WhiteboardItem } from '@/types/whiteboard';

interface UseViewportControllerProps {
  stageRef: React.RefObject<Konva.Stage | null>;
  size: { width: number; height: number };
  items: WhiteboardItem[];
}

export function useViewportController({
  stageRef,
  size,
  items,
}: UseViewportControllerProps) {
  const canvasWidth = useWhiteboardSharedStore((state) => state.canvasWidth);
  const canvasHeight = useWhiteboardSharedStore((state) => state.canvasHeight);
  const setViewportSize = useWhiteboardLocalStore(
    (state) => state.setViewportSize,
  );
  const setStageScale = useWhiteboardLocalStore((state) => state.setStageScale);
  const setStagePos = useWhiteboardLocalStore((state) => state.setStagePos);

  const isInitialMount = useRef(true);
  const [pixelRatio, setPixelRatio] = useState(
    typeof window !== 'undefined' ? window.devicePixelRatio : 1,
  );
  const [viewportRect, setViewportRect] = useState<{
    x: number;
    y: number;
    width: number;
    height: number;
  } | null>(null);

  // 초기 Stage 위치 설정
  useEffect(() => {
    const stage = stageRef.current;
    if (
      !stage ||
      !isInitialMount.current ||
      size.width === 0 ||
      size.height === 0
    )
      return;

    // 캔버스를 화면 정가운데 배치
    const centerPos = {
      x: (size.width - canvasWidth) / 2,
      y: (size.height - canvasHeight) / 2,
    };

    stage.scale({ x: 1, y: 1 });
    stage.position(centerPos);
    stage.batchDraw();
    setViewportSize(size.width, size.height);
    setStagePos(centerPos);
    setStageScale(1);

    useWhiteboardLocalStore.getState().setStageRef(stageRef);

    isInitialMount.current = false;
  }, [
    size.width,
    size.height,
    canvasWidth,
    canvasHeight,
    setViewportSize,
    setStagePos,
    setStageScale,
    stageRef,
  ]);

  // viewport 업데이트
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;

    const updateViewport = () => {
      setViewportRect(getViewportRect(stage));
    };

    // 초기 viewport 설정
    updateViewport();

    // Stage 이동/줌 시 viewport 업데이트
    let rafId: number;
    const throttledUpdate = () => {
      if (rafId) return;
      rafId = requestAnimationFrame(() => {
        updateViewport();
        rafId = 0;
      });
    };

    stage.on('dragmove', throttledUpdate);
    stage.on('wheel', throttledUpdate);

    return () => {
      stage.off('dragmove', throttledUpdate);
      stage.off('wheel', throttledUpdate);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [stageRef]);

  // 화면에 보이는 아이템만 필터링
  const visibleItems = useMemo(() => {
    if (!viewportRect) return items;
    return filterVisibleItems(items, viewportRect);
  }, [items, viewportRect]);

  // 줌 레벨에 따른 pixelRatio 조절
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;

    const updatePixelRatio = () => {
      const scale = stage.scaleX();
      let ratio: number;
      if (scale >= 1.5) ratio = window.devicePixelRatio;
      else if (scale >= 1) ratio = 1.5;
      else if (scale >= 0.5) ratio = 1;
      else if (scale >= 0.3) ratio = 0.5;
      else ratio = 0.25;

      setPixelRatio(ratio);
    };

    updatePixelRatio();

    stage.on('wheel', updatePixelRatio);

    return () => {
      stage.off('wheel', updatePixelRatio);
    };
  }, [stageRef]);

  // viewport 크기를 store에 업데이트
  useEffect(() => {
    if (size.width > 0 && size.height > 0) {
      setViewportSize(size.width, size.height);
    }
  }, [size.width, size.height, setViewportSize]);

  return { visibleItems, pixelRatio };
}
