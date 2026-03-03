import React from 'react';
import Konva from 'konva';
import { Rect } from 'react-konva';

import type { WhiteboardItem, ArrowItem, LineItem } from '@/types/whiteboard';

import { useArrowHandles } from '@/hooks/useArrowHandles';
import { useItemActions } from '@/hooks/useItemActions';

import ItemTransformer from '@/components/whiteboard/controls/ItemTransformer';
import ArrowHandles from '@/components/whiteboard/items/arrow/ArrowHandles';
import SelectionBox from '@/components/whiteboard/SelectionBox';
import RenderItem from '@/components/whiteboard/items/RenderItem';

interface InteractionLayerProps {
  isArrowOrLineSelected: boolean;
  selectedItem: WhiteboardItem | null;
  selectedIds: string[];
  items: WhiteboardItem[];
  stageRef: React.RefObject<Konva.Stage | null>;
  isDraggingArrow: boolean;
  isDraggingHandle: boolean;
  setIsDraggingHandle: (isDragging: boolean) => void;
}

export default function InteractionLayer({
  isArrowOrLineSelected,
  selectedItem,
  selectedIds,
  items,
  stageRef,
  isDraggingArrow,
  setIsDraggingHandle,
}: InteractionLayerProps) {
  const { updateItem } = useItemActions();
  const {
    selectedHandleIndex,
    handleHandleClick,
    handleHandleDragStart,
    handleArrowStartDrag,
    handleArrowControlPointDrag,
    handleArrowEndDrag,
    handleHandleDragEnd,
    draggingPoints,
    snapIndicator,
  } = useArrowHandles({
    arrow: isArrowOrLineSelected
      ? (selectedItem as ArrowItem | LineItem)
      : null,
    items,
    updateItem,
    setIsDraggingArrow: setIsDraggingHandle,
  });

  return (
    <>
      {/* 화살표 드래그 중 임시 렌더링 */}
      {draggingPoints && selectedItem && (
        <RenderItem
          item={
            {
              ...selectedItem,
              points: draggingPoints,
            } as ArrowItem | LineItem
          }
          isSelected={true}
          onSelect={() => {}}
          onChange={() => {}}
          onArrowDblClick={() => {}}
          onShapeDblClick={() => {}}
          onDragStart={() => {}}
          onDragMove={() => {}}
          onTransformMove={() => {}}
          onDragEnd={() => {}}
        />
      )}

      {/* 화살표 핸들 */}
      {isArrowOrLineSelected && selectedItem && !isDraggingArrow && (
        <ArrowHandles
          arrow={selectedItem as ArrowItem | LineItem}
          selectedHandleIndex={selectedHandleIndex}
          onHandleClick={handleHandleClick}
          onDragStart={handleHandleDragStart}
          onStartDrag={handleArrowStartDrag}
          onControlPointDrag={handleArrowControlPointDrag}
          onEndDrag={handleArrowEndDrag}
          onDragEnd={handleHandleDragEnd}
          draggingPoints={draggingPoints}
        />
      )}

      {/* 부착 표시 */}
      {snapIndicator && (
        <Rect
          x={snapIndicator.x}
          y={snapIndicator.y}
          width={snapIndicator.width}
          height={snapIndicator.height}
          rotation={snapIndicator.rotation}
          stroke="#0096FF"
          strokeWidth={3}
          cornerRadius={3}
        />
      )}

      {/* 선택 박스 */}
      <SelectionBox />

      {/* 내 Transformer */}
      <ItemTransformer
        selectedIds={selectedIds}
        items={items}
        stageRef={stageRef}
      />
    </>
  );
}
