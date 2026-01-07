import Konva from 'konva';

// Screen → World 좌표 변환 (마우스 포인터)
export const getWorldPointerPosition = (stage: Konva.Stage) => {
  const transform = stage.getAbsoluteTransform().copy();
  transform.invert();

  const pos = stage.getPointerPosition();
  if (!pos) {
    return { x: 0, y: 0 };
  }

  return transform.point(pos);
};

// Screen → World 좌표 변환 (일반)
export const screenToWorld = (
  screenX: number,
  screenY: number,
  stagePos: { x: number; y: number },
  stageScale: number,
) => {
  return {
    x: (screenX - stagePos.x) / stageScale,
    y: (screenY - stagePos.y) / stageScale,
  };
};
