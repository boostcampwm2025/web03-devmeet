'use client';

import { useRef, useState, useMemo, useCallback } from 'react';

import Konva from 'konva';
import { Stage, Layer } from 'react-konva';

import type { WhiteboardItem, ShapeItem } from '@/types/whiteboard';

import { useWhiteboardSharedStore } from '@/store/useWhiteboardSharedStore';
import { useWhiteboardLocalStore } from '@/store/useWhiteboardLocalStore';
import { useWhiteboardAwarenessStore } from '@/store/useWhiteboardAwarenessStore';
import { cn } from '@/utils/cn';
import { updateBoundArrows } from '@/utils/arrowBinding';

import { useItemActions } from '@/hooks/useItemActions';
import { useElementSize } from '@/hooks/useElementSize';
import { useClickOutside } from '@/hooks/useClickOutside';
import { useCanvasInteraction } from '@/hooks/useCanvasInteraction';
import { useCanvasShortcuts } from '@/hooks/useCanvasShortcuts';
import { useAddWhiteboardItem } from '@/hooks/useAddWhiteboardItem';
import { useMultiDrag } from '@/hooks/useMultiDrag';
import { useViewportController } from '@/hooks/useViewportController';
import { useCanvasGlobalEvents } from '@/hooks/useCanvasGlobalEvents';

import BackgroundLayer from '@/components/whiteboard/layers/BackgroundLayer';
import ItemRenderingLayer from '@/components/whiteboard/layers/ItemRenderingLayer';
import CollaborationLayer from '@/components/whiteboard/layers/CollaborationLayer';
import TextEditorLayer from '@/components/whiteboard/layers/TextEditorLayer';
import InteractionLayer from '@/components/whiteboard/layers/InteractionLayer';

const GEOMETRY_KEYS = ['x', 'y', 'width', 'height', 'rotation'] as const;

export default function Canvas() {
  const myUserId = useWhiteboardAwarenessStore((state) => state.myUserId);
  const canvasWidth = useWhiteboardSharedStore((state) => state.canvasWidth);
  const canvasHeight = useWhiteboardSharedStore((state) => state.canvasHeight);
  const items = useWhiteboardSharedStore((state) => state.items);
  const selectedIds = useWhiteboardLocalStore((state) => state.selectedIds);
  const editingTextId = useWhiteboardLocalStore((state) => state.editingTextId);
  const selectOnly = useWhiteboardLocalStore((state) => state.selectOnly);
  const toggleSelection = useWhiteboardLocalStore(
    (state) => state.toggleSelection,
  );
  const addToSelection = useWhiteboardLocalStore(
    (state) => state.addToSelection,
  );
  const clearSelection = useWhiteboardLocalStore(
    (state) => state.clearSelection,
  );
  const { updateItem, performTransaction } = useItemActions();
  const setEditingTextId = useWhiteboardLocalStore(
    (state) => state.setEditingTextId,
  );
  const cursorMode = useWhiteboardLocalStore((state) => state.cursorMode);

  const { processImageFile, getCanvasPointFromEvent } = useAddWhiteboardItem();

  const stageRef = useRef<Konva.Stage | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDraggingArrow, setIsDraggingArrow] = useState(false);
  const [isDraggingHandle, setIsDraggingHandle] = useState(false);
  const [isDraggingCanvas, setIsDraggingCanvas] = useState(false);
  const [localDraggingId, setLocalDraggingId] = useState<string | null>(null);
  const [localDraggingPos, setLocalDraggingPos] = useState<{
    x: number;
    y: number;
    width?: number;
    height?: number;
    rotation?: number;
  } | null>(null);

  // 멀티 드래그 훅
  const {
    startMultiDrag,
    updateMultiDrag,
    finishMultiDrag,
    isMultiDragging,
    getMultiDragPosition,
  } = useMultiDrag({ selectedIds, items });

  const size = useElementSize(containerRef);

  // Viewport 관련 로직 (스케일, 줌, 패닝 뷰포트 컬링)
  const { visibleItems, pixelRatio } = useViewportController({
    stageRef,
    size,
    items,
  });

  const { handleWheel, handleDragMove, handleDragEnd } = useCanvasInteraction(
    size.width,
    size.height,
  );

  const {
    isDraggable,
    handlePointerDown,
    handlePointerMove,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    handleWheelWithEvent,
  } = useCanvasGlobalEvents({
    stageRef,
    handleWheel,
  });

  const singleSelectedId = selectedIds.length === 1 ? selectedIds[0] : null;
  const selectedItem = useMemo(
    () =>
      singleSelectedId
        ? items.find((item) => item.id === singleSelectedId) || null
        : null,
    [items, singleSelectedId],
  );

  const isArrowOrLineSelected =
    !!singleSelectedId &&
    (selectedItem?.type === 'arrow' || selectedItem?.type === 'line');

  // 키보드 단축키 훅
  useCanvasShortcuts({
    isArrowOrLineSelected,
  });

  // 도형 더블클릭 핸들러 (텍스트 편집 모드)
  const handleShapeDblClick = (id: string) => {
    setEditingTextId(id);
  };

  // 드래그 앤 드롭
  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();

      // 드롭된 데이터에서 파일 리스트를 가져옴
      const files = e.dataTransfer.files;
      if (files && files.length > 0) {
        const file = files[0];
        // 이미지 파일인 경우 processImageFile 실행
        if (file.type.startsWith('image/')) {
          const point = getCanvasPointFromEvent(e.clientX, e.clientY);
          processImageFile(file, point || undefined);
        }
      }
    },
    [processImageFile, getCanvasPointFromEvent],
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  // 외부 클릭 시 선택 해제
  useClickOutside(
    containerRef,
    (e) => {
      const target = e.target as HTMLElement;
      // 사이드바 클릭은 무시
      if (target.closest('aside') || target.closest('.sidebar-toggle')) {
        return;
      }

      if (selectedIds.length > 0) {
        clearSelection();
        useWhiteboardLocalStore.getState().setSelectedHandleIndex(null);
      }
    },
    !editingTextId && selectedIds.length > 0,
  );

  const handleSelectItem = useCallback(
    (id: string, e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => {
      const nativeEvent = e?.evt as MouseEvent | TouchEvent | undefined;
      const shiftKey =
        !!nativeEvent && 'shiftKey' in nativeEvent && nativeEvent.shiftKey;
      const ctrlKey =
        !!nativeEvent && 'ctrlKey' in nativeEvent && nativeEvent.ctrlKey;
      const metaKey =
        !!nativeEvent && 'metaKey' in nativeEvent && nativeEvent.metaKey;

      if (ctrlKey || metaKey) {
        toggleSelection(id);
        return;
      }

      if (shiftKey) {
        addToSelection(id);
        return;
      }

      if (selectedIds.includes(id)) {
        return;
      }

      selectOnly(id);
    },
    [addToSelection, selectOnly, toggleSelection, selectedIds],
  );

  const handleItemChange = useCallback(
    (id: string, newAttributes: Partial<WhiteboardItem>) => {
      if (isMultiDragging(id)) {
        return;
      }

      performTransaction(() => {
        updateItem(id, newAttributes);

        const isGeometryChanged = GEOMETRY_KEYS.some(
          (key) => key in newAttributes,
        );
        if (!isGeometryChanged) return;

        const changedItem = items.find((item) => item.id === id);
        if (!changedItem || changedItem.type !== 'shape') return;

        if (selectedIds.length > 1 && selectedIds.includes(id)) {
          return;
        }

        const updatedShape = { ...changedItem, ...newAttributes } as ShapeItem;
        updateBoundArrows(id, updatedShape, items, updateItem);
      });
    },
    [items, updateItem, performTransaction, isMultiDragging, selectedIds],
  );

  const handleTransformMoveItem = useCallback(
    (
      id: string,
      x: number,
      y: number,
      w: number,
      h: number,
      rotation: number,
    ) => {
      setLocalDraggingId((prev) => (prev === id ? prev : id));
      setLocalDraggingPos((prev) => {
        if (
          prev &&
          prev.x === x &&
          prev.y === y &&
          prev.width === w &&
          prev.height === h &&
          prev.rotation === rotation
        ) {
          return prev;
        }
        return { x, y, width: w, height: h, rotation };
      });
    },
    [],
  );

  const handleDragMoveItem = useCallback(
    (id: string, x: number, y: number) => {
      const isMulti = updateMultiDrag(id, x, y);

      if (isMulti) return;

      const hasArrowBinding = items.some(
        (item) =>
          item.type === 'arrow' &&
          (item.startBinding?.elementId === id ||
            item.endBinding?.elementId === id),
      );

      if (hasArrowBinding) {
        setLocalDraggingId((prev) => (prev === id ? prev : id));
        setLocalDraggingPos((prev) => {
          if (prev && prev.x === x && prev.y === y) return prev;
          return { x, y };
        });
      }
    },
    [updateMultiDrag, items],
  );

  const handleDragEndItem = useCallback(() => {
    setIsDraggingArrow(false);
    setLocalDraggingId(null);
    setLocalDraggingPos(null);
    finishMultiDrag();
  }, [finishMultiDrag]);

  // width={0} height={0}으로 canvas 렌더링 방지
  if (size.width === 0 || size.height === 0) {
    return (
      <div
        ref={containerRef}
        className="flex h-full w-full items-center justify-center"
      ></div>
    );
  }

  return (
    <div
      ref={containerRef}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      className={cn(
        'h-full w-full flex-none overflow-hidden bg-neutral-100',
        cursorMode === 'select' && 'cursor-default',
        cursorMode === 'move' && !isDraggingCanvas && 'cursor-grab',
        cursorMode === 'move' && isDraggingCanvas && 'cursor-grabbing',
        cursorMode === 'draw' && 'cursor-crosshair',
        cursorMode === 'eraser' && 'cursor-cell',
      )}
    >
      <Stage
        ref={stageRef}
        width={size.width}
        height={size.height}
        draggable={isDraggable}
        pixelRatio={pixelRatio}
        onWheel={handleWheelWithEvent}
        onDragStart={() => setIsDraggingCanvas(true)}
        onDragMove={handleDragMove}
        onDragEnd={(e) => {
          handleDragEnd(e);
          setIsDraggingCanvas(false);
        }}
        onMouseDown={handlePointerDown}
        onMouseMove={handlePointerMove}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <Layer
          name="main-layer"
          className="main-layer"
          clipX={0}
          clipY={0}
          clipWidth={canvasWidth}
          clipHeight={canvasHeight}
        >
          <BackgroundLayer
            canvasWidth={canvasWidth}
            canvasHeight={canvasHeight}
          />

          {/* 아이템 렌더링 */}
          <ItemRenderingLayer
            items={items}
            visibleItems={visibleItems}
            selectedIds={selectedIds}
            singleSelectedId={singleSelectedId}
            isDraggingArrow={isDraggingArrow}
            isDraggingHandle={isDraggingHandle}
            localDraggingId={localDraggingId}
            localDraggingPos={localDraggingPos}
            getMultiDragPosition={getMultiDragPosition}
            handleSelectItem={handleSelectItem}
            handleItemChange={handleItemChange}
            handleShapeDblClick={handleShapeDblClick}
            setIsDraggingArrow={setIsDraggingArrow}
            setIsDraggingHandle={setIsDraggingHandle}
            startMultiDrag={startMultiDrag}
            handleDragMoveItem={handleDragMoveItem}
            handleTransformMoveItem={handleTransformMoveItem}
            handleDragEndItem={handleDragEndItem}
          />
          <CollaborationLayer
            myUserId={myUserId}
            items={items}
            selectedIds={selectedIds}
            singleSelectedId={singleSelectedId}
            stageRef={stageRef}
          />
          <InteractionLayer
            isArrowOrLineSelected={isArrowOrLineSelected}
            selectedItem={selectedItem}
            selectedIds={selectedIds}
            items={items}
            stageRef={stageRef}
            isDraggingArrow={isDraggingArrow}
            isDraggingHandle={isDraggingHandle}
            setIsDraggingHandle={setIsDraggingHandle}
          />
        </Layer>
      </Stage>

      <TextEditorLayer
        editingTextId={editingTextId}
        items={items}
        stageRef={stageRef}
        updateItem={updateItem}
        setEditingTextId={setEditingTextId}
        clearSelection={clearSelection}
      />
    </div>
  );
}
