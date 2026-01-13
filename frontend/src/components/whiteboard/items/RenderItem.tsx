'use client';

import { Text, Arrow, Line } from 'react-konva';
import { useCanvasStore } from '@/store/useCanvasStore';
import type {
  TextItem,
  ArrowItem,
  WhiteboardItem,
  DrawingItem,
} from '@/types/whiteboard';

interface RenderItemProps {
  item: WhiteboardItem;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onChange: (newAttributes: Partial<WhiteboardItem>) => void;
  onDragStart?: () => void;
  onDragEnd?: () => void;
  onArrowDblClick?: (id: string) => void;
}

export default function RenderItem({
  item,
  onSelect,
  onChange,
  onDragStart,
  onDragEnd,
  onArrowDblClick,
}: RenderItemProps) {
  const setEditingTextId = useCanvasStore((state) => state.setEditingTextId);

  // 텍스트 렌더링
  if (item.type === 'text') {
    const textItem = item as TextItem;
    return (
      <Text
        {...textItem}
        id={item.id}
        draggable
        onMouseDown={() => onSelect(item.id)}
        onTouchStart={() => onSelect(item.id)}
        onMouseEnter={(e) => {
          const container = e.target.getStage()?.container();
          if (container) {
            container.style.cursor = 'move';
          }
        }}
        onMouseLeave={(e) => {
          const container = e.target.getStage()?.container();
          if (container) {
            container.style.cursor = 'default';
          }
        }}
        onDblClick={() => {
          setEditingTextId(item.id);
          onSelect(item.id);
        }}
        onDragEnd={(e) => {
          onChange({
            x: e.target.x(),
            y: e.target.y(),
          });
        }}
        onTransformEnd={(e) => {
          const node = e.target;
          const scaleX = node.scaleX();

          node.scaleX(1);
          node.scaleY(1);

          onChange({
            x: node.x(),
            y: node.y(),
            width: Math.max(5, node.width() * scaleX),
            rotation: node.rotation(),
          });
        }}
      />
    );
  }

  // 화살표 렌더링
  if (item.type === 'arrow') {
    const arrowItem = item as ArrowItem;
    return (
      <Arrow
        {...arrowItem}
        id={item.id}
        draggable
        hitStrokeWidth={30}
        onMouseDown={() => onSelect(item.id)}
        onMouseEnter={(e) => {
          const container = e.target.getStage()?.container();
          if (container) {
            container.style.cursor = 'move';
          }
        }}
        onMouseLeave={(e) => {
          const container = e.target.getStage()?.container();
          if (container) {
            container.style.cursor = 'default';
          }
        }}
        onDblClick={() => {
          onArrowDblClick?.(item.id);
        }}
        onDragStart={() => {
          onDragStart?.();
        }}
        onDragEnd={(e) => {
          const pos = e.target.position();
          const newPoints = arrowItem.points.map((p, i) =>
            i % 2 === 0 ? p + pos.x : p + pos.y,
          );

          e.target.position({ x: 0, y: 0 });

          onChange({
            points: newPoints,
          });

          onDragEnd?.();
        }}
      />
    );
  }

  // 그리기 렌더링
  if (item.type === 'drawing') {
    const drawingItem = item as DrawingItem;
    return (
      <Line
        {...drawingItem}
        id={item.id}
        draggable
        hitStrokeWidth={30}
        tension={0.4}
        lineCap="round"
        lineJoin="round"
        listening={true}
        onMouseDown={() => onSelect(item.id)}
        onMouseEnter={(e) => {
          const container = e.target.getStage()?.container();
          if (container) {
            container.style.cursor = 'move';
          }
        }}
        onMouseLeave={(e) => {
          const container = e.target.getStage()?.container();
          if (container) {
            container.style.cursor = 'default';
          }
        }}
        onDragEnd={(e) => {
          const pos = e.target.position();
          const newPoints = drawingItem.points.map((p, i) =>
            i % 2 === 0 ? p + pos.x : p + pos.y,
          );

          e.target.position({ x: 0, y: 0 });

          onChange({
            points: newPoints,
          });
        }}
      />
    );
  }

  return null;
}
