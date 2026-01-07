'use client';

import { useRef, useEffect, useState, useMemo } from 'react';
import Konva from 'konva';
import { Stage, Layer, Rect } from 'react-konva';
import { useCanvasStore } from '@/store/useCanvasStore';
import type { WhiteboardItem, TextItem, ArrowItem } from '@/types/whiteboard';
import { useWindowSize } from '@/hooks/useWindowSize';
import { useCanvasInteraction } from '@/hooks/useCanvasInteraction';
import { useArrowHandles } from '@/hooks/useArrowHandles';
import RenderItem from '@/components/whiteboard/items/RenderItem';
import TextArea from '@/components/whiteboard/items/text/TextArea';
import ItemTransformer from '@/components/whiteboard/controls/ItemTransformer';
import ArrowHandles from '@/components/whiteboard/items/arrow/ArrowHandles';

export default function Canvas() {
  const stageScale = useCanvasStore((state) => state.stageScale);
  const stagePos = useCanvasStore((state) => state.stagePos);
  const canvasWidth = useCanvasStore((state) => state.canvasWidth);
  const canvasHeight = useCanvasStore((state) => state.canvasHeight);
  const items = useCanvasStore((state) => state.items);
  const selectedId = useCanvasStore((state) => state.selectedId);
  const editingTextId = useCanvasStore((state) => state.editingTextId);
  const selectItem = useCanvasStore((state) => state.selectItem);
  const updateItem = useCanvasStore((state) => state.updateItem);
  const deleteItem = useCanvasStore((state) => state.deleteItem);
  const setEditingTextId = useCanvasStore((state) => state.setEditingTextId);

  const stageRef = useRef<Konva.Stage | null>(null);
  const [isDraggingArrow, setIsDraggingArrow] = useState(false);

  const size = useWindowSize();
  const { handleWheel, handleDragMove, handleDragEnd } = useCanvasInteraction(
    size.width,
    size.height,
  );

  const editingItem = useMemo(
    () => items.find((item) => item.id === editingTextId) as TextItem | undefined,
    [items, editingTextId]
  );

  const selectedItem = useMemo(
    () => items.find((item) => item.id === selectedId),
    [items, selectedId]
  );

  const isArrowSelected = selectedItem?.type === 'arrow';

  const {
    selectedHandleIndex,
    setSelectedHandleIndex,
    handleHandleClick,
    handleArrowStartDrag,
    handleArrowControlPointDrag,
    handleArrowEndDrag,
    handleArrowDblClick,
    deleteControlPoint,
  } = useArrowHandles({
    arrow: isArrowSelected ? (selectedItem as ArrowItem) : null,
    stageRef,
    updateItem,
  });

  // 키보드 삭제
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!selectedId || editingTextId) return;

      if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();

        // 화살표 중간점 삭제 시도
        if (isArrowSelected && selectedHandleIndex !== null) {
          const deleted = deleteControlPoint();
          if (deleted) return;
        }

        // 아이템 삭제
        deleteItem(selectedId);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedId, editingTextId, deleteItem, isArrowSelected, selectedHandleIndex, deleteControlPoint]);

  // 선택 해제
  const handleCheckDeselect = (
    e: Konva.KonvaEventObject<MouseEvent | TouchEvent>,
  ) => {
    if (editingTextId) return;

    const clickedOnEmpty =
      e.target === e.target.getStage() || e.target.hasName('bg-rect');

    if (clickedOnEmpty) {
      selectItem(null);
      setSelectedHandleIndex(null);
    }
  };

  // 아이템 업데이트
  const handleItemChange = (
    id: string,
    newAttributes: Partial<WhiteboardItem>,
  ) => {
    updateItem(id, newAttributes);
  };

  if (size.width === 0 || size.height === 0) return null;

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-neutral-100">
      <Stage
        ref={stageRef}
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
        onMouseDown={handleCheckDeselect}
        onTouchStart={handleCheckDeselect}
      >
        <Layer
          clipX={0}
          clipY={0}
          clipWidth={canvasWidth}
          clipHeight={canvasHeight}
        >
          {/* Canvas 경계 */}
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

          {/* 아이템 렌더링 */}
          {items.map((item) => (
            <RenderItem
              key={item.id}
              item={item}
              isSelected={item.id === selectedId}
              onSelect={selectItem}
              onChange={(newAttributes) =>
                handleItemChange(item.id, newAttributes)
              }
              onArrowDblClick={handleArrowDblClick}
              onDragStart={() => {
                if (item.type === 'arrow') {
                  setIsDraggingArrow(true);
                }
              }}
              onDragEnd={() => {
                if (item.type === 'arrow') {
                  setIsDraggingArrow(false);
                }
              }}
            />
          ))}

          {/* 화살표 핸들 (드래그 중이 아닐 때만) */}
          {isArrowSelected && selectedItem && !isDraggingArrow && (
            <ArrowHandles
              arrow={selectedItem as ArrowItem}
              selectedHandleIndex={selectedHandleIndex}
              onHandleClick={handleHandleClick}
              onStartDrag={handleArrowStartDrag}
              onControlPointDrag={handleArrowControlPointDrag}
              onEndDrag={handleArrowEndDrag}
            />
          )}

          {/* Transformer */}
          <ItemTransformer
            selectedId={selectedId}
            items={items}
            stageRef={stageRef}
          />
        </Layer>
      </Stage>

      {/* 텍스트 편집 모드 */}
      {editingTextId && editingItem && (
        <TextArea
          textId={editingTextId}
          textItem={editingItem}
          stageRef={stageRef}
          onChange={(newText) => {
            updateItem(editingTextId, { text: newText });
          }}
          onClose={() => {
            setEditingTextId(null);
            selectItem(null);
          }}
        />
      )}
    </div>
  );
}
