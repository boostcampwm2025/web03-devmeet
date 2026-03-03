import React from 'react';
import Konva from 'konva';

import type { WhiteboardItem, ShapeItem, ArrowItem } from '@/types/whiteboard';
import { getDraggingArrowPoints } from '@/utils/arrowBinding';
import { useItemActions } from '@/hooks/useItemActions';
import RenderItem from '@/components/whiteboard/items/RenderItem';

interface ItemRenderingLayerProps {
  items: WhiteboardItem[];
  visibleItems: WhiteboardItem[];
  selectedIds: string[];
  isDraggingArrow: boolean;
  localDraggingId: string | null;
  localDraggingPos: {
    x: number;
    y: number;
    width?: number;
    height?: number;
    rotation?: number;
  } | null;
  getMultiDragPosition: (id: string) => { x: number; y: number } | null;
  handleSelectItem: (
    id: string,
    e: Konva.KonvaEventObject<MouseEvent | TouchEvent>,
  ) => void;
  handleItemChange: (
    id: string,
    newAttributes: Partial<WhiteboardItem>,
  ) => void;
  handleShapeDblClick: (id: string) => void;
  setIsDraggingArrow: (isDragging: boolean) => void;
  startMultiDrag: (id: string) => void;
  handleDragMoveItem: (id: string, x: number, y: number) => void;
  handleTransformMoveItem: (
    id: string,
    x: number,
    y: number,
    w: number,
    h: number,
    rotation: number,
  ) => void;
  handleDragEndItem: () => void;
}

export default function ItemRenderingLayer({
  items,
  visibleItems,
  localDraggingId,
  localDraggingPos,
  getMultiDragPosition,
  selectedIds,
  handleSelectItem,
  handleItemChange,
  handleShapeDblClick,
  setIsDraggingArrow,
  startMultiDrag,
  handleDragMoveItem,
  handleTransformMoveItem,
  handleDragEndItem,
}: ItemRenderingLayerProps) {
  const { insertArrowControlPoint } = useItemActions();
  return (
    <>
      {visibleItems.map((item) => {
        let displayItem = item;

        const multiDragPos = getMultiDragPosition(item.id);
        if (multiDragPos && 'x' in item && 'y' in item) {
          displayItem = {
            ...item,
            x: multiDragPos.x,
            y: multiDragPos.y,
          } as WhiteboardItem;
        }

        if (
          !multiDragPos &&
          item.type === 'arrow' &&
          localDraggingId &&
          localDraggingPos &&
          (item.startBinding?.elementId === localDraggingId ||
            item.endBinding?.elementId === localDraggingId)
        ) {
          const targetShape = items.find(
            (it) => it.id === localDraggingId,
          ) as ShapeItem;
          if (targetShape) {
            const tempPoints = getDraggingArrowPoints(
              item as ArrowItem,
              localDraggingId,
              localDraggingPos.x,
              localDraggingPos.y,
              targetShape,
              localDraggingPos.width,
              localDraggingPos.height,
              localDraggingPos.rotation,
            );
            if (tempPoints) {
              displayItem = {
                ...displayItem,
                points: tempPoints,
              } as WhiteboardItem;
            }
          }
        }

        return (
          <RenderItem
            key={item.id}
            item={displayItem}
            isSelected={selectedIds.includes(item.id)}
            onSelect={handleSelectItem}
            onChange={(newAttributes) =>
              handleItemChange(item.id, newAttributes)
            }
            onArrowDblClick={insertArrowControlPoint}
            onShapeDblClick={handleShapeDblClick}
            onDragStart={() => {
              if (item.type === 'arrow' || item.type === 'line') {
                setIsDraggingArrow(true);
              }
              startMultiDrag(item.id);
            }}
            onDragMove={handleDragMoveItem}
            onTransformMove={handleTransformMoveItem}
            onDragEnd={handleDragEndItem}
          />
        );
      })}
    </>
  );
}
