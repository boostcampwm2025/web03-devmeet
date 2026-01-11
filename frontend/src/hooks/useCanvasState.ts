import { useCanvasStore } from '@/store/useCanvasStore';

export const useCanvasState = () => {
  // 상태 (State)
  const stageScale = useCanvasStore((state) => state.stageScale);
  const stagePos = useCanvasStore((state) => state.stagePos);
  const canvasWidth = useCanvasStore((state) => state.canvasWidth);
  const canvasHeight = useCanvasStore((state) => state.canvasHeight);
  const items = useCanvasStore((state) => state.items);
  const selectedId = useCanvasStore((state) => state.selectedId);
  const editingTextId = useCanvasStore((state) => state.editingTextId);

  // 액션 (Actions)
  const selectItem = useCanvasStore((state) => state.selectItem);
  const updateItem = useCanvasStore((state) => state.updateItem);
  const setEditingTextId = useCanvasStore((state) => state.setEditingTextId);
  const deleteItem = useCanvasStore((state) => state.deleteItem);

  return {
    stageScale,
    stagePos,
    canvasWidth,
    canvasHeight,
    items,
    selectedId,
    editingTextId,
    selectItem,
    updateItem,
    setEditingTextId,
    deleteItem,
  };
};
