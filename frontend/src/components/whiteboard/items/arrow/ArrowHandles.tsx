'use client';

import { Circle } from 'react-konva';
import { KonvaEventObject } from 'konva/lib/Node';
import { getControlPoints } from '@/components/whiteboard/utils/arrow';
import type { ArrowItem } from '@/types/whiteboard';

interface ArrowHandlesProps {
  arrow: ArrowItem;
  selectedHandleIndex: number | null;
  onHandleClick: (e: KonvaEventObject<MouseEvent>, index: number) => void;
  onStartDrag: (e: KonvaEventObject<DragEvent>) => void;
  onControlPointDrag: (pointIndex: number, e: KonvaEventObject<DragEvent>) => void;
  onEndDrag: (e: KonvaEventObject<DragEvent>) => void;
}

export default function ArrowHandles({
  arrow,
  selectedHandleIndex,
  onHandleClick,
  onStartDrag,
  onControlPointDrag,
  onEndDrag,
}: ArrowHandlesProps) {
  const controlPoints = getControlPoints(arrow.points);
  const startPoint = { x: arrow.points[0], y: arrow.points[1] };
  const endPoint = {
    x: arrow.points[arrow.points.length - 2],
    y: arrow.points[arrow.points.length - 1],
  };

  return (
    <>
      {/* 시작 핸들 */}
      <Circle
        x={startPoint.x}
        y={startPoint.y}
        radius={6}
        fill="#ffffff"
        stroke="#0369A1"
        strokeWidth={2}
        draggable
        onDragMove={onStartDrag}
        onClick={(e) => onHandleClick(e, 0)}
      />

      {/* 중간점 핸들  */}
      {controlPoints.map((point, idx) => {
        const isHandleSelected = selectedHandleIndex === point.index;
        return (
          <Circle
            key={`control-${arrow.id}-${idx}`}
            x={point.x}
            y={point.y}
            radius={6}
            fill={isHandleSelected ? '#B8E6FE' : '#ffffff'}
            stroke="#B8E6FE"
            strokeWidth={isHandleSelected ? 3 : 2}
            draggable
            onDragMove={(e) => onControlPointDrag(point.index, e)}
            onClick={(e) => onHandleClick(e, point.index)}
          />
        );
      })}

      {/* 끝점 핸들 */}
      <Circle
        x={endPoint.x}
        y={endPoint.y}
        radius={6}
        fill="#ffffff"
        stroke="#0369A1"
        strokeWidth={2}
        draggable
        onDragMove={onEndDrag}
        onClick={(e) => onHandleClick(e, arrow.points.length - 2)}
      />
    </>
  );
}
