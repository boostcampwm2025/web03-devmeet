import { Rect } from 'react-konva';

interface BackgroundLayerProps {
  canvasWidth: number;
  canvasHeight: number;
}

export default function BackgroundLayer({
  canvasWidth,
  canvasHeight,
}: BackgroundLayerProps) {
  return (
    <Rect
      name="bg-rect"
      x={0}
      y={0}
      width={canvasWidth}
      height={canvasHeight}
      fill="white"
      stroke="gray"
      strokeWidth={2}
      listening={true}
    />
  );
}
