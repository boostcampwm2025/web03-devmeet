import React from 'react';
import Konva from 'konva';
import { Rect } from 'react-konva';

import type { WhiteboardItem, ArrowItem } from '@/types/whiteboard';

import ItemTransformer from '@/components/whiteboard/controls/ItemTransformer';
import ArrowHandles from '@/components/whiteboard/items/arrow/ArrowHandles';
import SelectionBox from '@/components/whiteboard/SelectionBox';

interface InteractionLayerProps {
  isArrowOrLineSelected: boolean;
  selectedItem: WhiteboardItem | null;
  selectedIds: string[];
  items: WhiteboardItem[];
  stageRef: React.RefObject<Konva.Stage | null>;
  isDraggingArrow: boolean;
  selectedHandleIndex: number | null;
  draggingPoints: number[] | null;
  snapIndicator: {
    x: number;
    y: number;
    width: number;
    height: number;
    rotation?: number;
  } | null;
  handleHandleClick: (
    e: Konva.KonvaEventObject<MouseEvent>,
    index: number,
  ) => void;
  handleArrowStartDrag: (e: Konva.KonvaEventObject<DragEvent>) => void;
  handleArrowControlPointDrag: (
    pointIndex: number,
    e: Konva.KonvaEventObject<DragEvent>,
  ) => void;
  handleArrowEndDrag: (e: Konva.KonvaEventObject<DragEvent>) => void;
  handleHandleDragEnd: (handleType: 'start' | 'end' | 'mid') => void;
}

export default function InteractionLayer({
  isArrowOrLineSelected,
  selectedItem,
  selectedIds,
  items,
  stageRef,
  isDraggingArrow,
  selectedHandleIndex,
  draggingPoints,
  snapIndicator,
  handleHandleClick,
  handleArrowStartDrag,
  handleArrowControlPointDrag,
  handleArrowEndDrag,
  handleHandleDragEnd,
}: InteractionLayerProps) {
  return (
    <>
      {/* 화살표 핸들 */}
      {isArrowOrLineSelected && selectedItem && !isDraggingArrow && (
        <ArrowHandles
          arrow={selectedItem as ArrowItem}
          selectedHandleIndex={selectedHandleIndex}
          onHandleClick={handleHandleClick}
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
