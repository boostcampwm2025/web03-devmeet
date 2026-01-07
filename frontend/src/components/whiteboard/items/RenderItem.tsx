'use client';

import { Text, Arrow } from 'react-konva';
import type {
  TextItem,
  ArrowItem,
  WhiteboardItem,
} from '@/types/whiteboard';

interface RenderItemProps {
  item: WhiteboardItem;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onChange: (newAttributes: Partial<WhiteboardItem>) => void;
}

export default function RenderItem({
  item,
  onSelect,
  onChange,
}: RenderItemProps) {
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
          const event = new CustomEvent('editText', { detail: { id: item.id } });
          window.dispatchEvent(event);
        }}
        onDblTap={() => {
          const event = new CustomEvent('editText', { detail: { id: item.id } });
          window.dispatchEvent(event);
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
        id={item.id}
        points={arrowItem.points}
        stroke={arrowItem.stroke}
        strokeWidth={arrowItem.strokeWidth}
        pointerLength={arrowItem.pointerLength}
        pointerWidth={arrowItem.pointerWidth}
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
        onDragEnd={(e) => {
          const pos = e.target.position();
          const newPoints = arrowItem.points.map((p, i) =>
            i % 2 === 0 ? p + pos.x : p + pos.y
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
