import Konva from 'konva';

// Screen → World 좌표 변환 (Stage 기준)
export function getWorldPointerPosition(stage: Konva.Stage) {
  const transform = stage.getAbsoluteTransform().copy();
  transform.invert();

  const pos = stage.getPointerPosition();
  if (!pos) {
    return { x: 0, y: 0 };
  }

  return transform.point(pos);
}
