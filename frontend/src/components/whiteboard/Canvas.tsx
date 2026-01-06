'use client';

import { Stage, Layer, Rect, Circle, Text } from 'react-konva';
import { useCanvasStore } from '@/store/useCanvasStore';
import { useWindowSize } from '@/hooks/useWindowSize';
import { useCanvasInteraction } from '@/hooks/useCanvasInteraction';

export default function Canvas() {
  const stageScale = useCanvasStore((state) => state.stageScale);
  const stagePos = useCanvasStore((state) => state.stagePos);
  const canvasWidth = useCanvasStore((state) => state.canvasWidth);
  const canvasHeight = useCanvasStore((state) => state.canvasHeight);

  const size = useWindowSize();
  const { handleWheel, handleDragMove, handleDragEnd } = useCanvasInteraction(
    size.width,
    size.height,
  );

  if (size.width === 0 || size.height === 0) return null;

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-neutral-100">
      <Stage
        width={size.width}
        height={size.height}
        draggable
        x={stagePos.x}
        y={stagePos.y}
        scaleX={stageScale}
        scaleY={stageScale}
        onWheel={handleWheel}
        onDragMove={handleDragMove}
        onDragEnd={handleDragEnd}
      >
        <Layer
          clipX={0}
          clipY={0}
          clipWidth={canvasWidth}
          clipHeight={canvasHeight}
        >
          {/* Canvas 경계 */}
          <Rect
            x={0}
            y={0}
            width={canvasWidth}
            height={canvasHeight}
            fill="white"
            stroke="gray"
            strokeWidth={2}
          />

          {/* 테스트용 도형 */}
          <Circle
            x={canvasWidth / 2}
            y={canvasHeight / 2}
            radius={10}
            fill="red"
            draggable
          />

          <Text
            text="중앙"
            x={canvasWidth / 2 + 15}
            y={canvasHeight / 2 - 5}
            fontSize={15}
          />

          <Rect
            x={500}
            y={300}
            width={100}
            height={100}
            fill="skyblue"
            stroke="black"
            draggable
          />

          <Rect
            x={3000}
            y={3000}
            width={100}
            height={100}
            fill="lightgreen"
            stroke="black"
            draggable
          />
        </Layer>
      </Stage>
    </div>
  );
}
