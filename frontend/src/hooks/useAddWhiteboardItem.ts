import { useCanvasStore } from '@/store/useCanvasStore';
import { getCenterWorldPos } from '@/utils/coordinate';
import { ShapeType } from '@/types/whiteboard';

export const useAddWhiteboardItem = () => {
  // Canvas Store 액션
  const addText = useCanvasStore((state) => state.addText);
  const addArrow = useCanvasStore((state) => state.addArrow);
  const addLine = useCanvasStore((state) => state.addLine);
  const addShape = useCanvasStore((state) => state.addShape);

  // Canvas Store 상태
  const selectItem = useCanvasStore((state) => state.selectItem);
  const stagePos = useCanvasStore((state) => state.stagePos);
  const stageScale = useCanvasStore((state) => state.stageScale);

  // Text Item 추가 핸들러
  const handleAddText = () => {
    const worldPos = getCenterWorldPos(stagePos, stageScale);
    const textId = addText({ x: worldPos.x, y: worldPos.y });
    selectItem(textId);
  };

  // Arrow Item 추가 핸들러
  const handleAddArrow = () => {
    const worldPos = getCenterWorldPos(stagePos, stageScale);
    addArrow({
      points: [worldPos.x - 100, worldPos.y, worldPos.x + 100, worldPos.y],
    });
  };

  // Line Item 추가 핸들러
  const handleAddLine = () => {
    const worldPos = getCenterWorldPos(stagePos, stageScale);
    addLine({
      points: [worldPos.x - 100, worldPos.y, worldPos.x + 100, worldPos.y],
    });
  };

  // Shape Item 추가 핸들러
  const handleAddShape = (type: ShapeType) => {
    const worldPos = getCenterWorldPos(stagePos, stageScale);

    const width = 100;
    const height = 100;

    addShape(type, {
      x: worldPos.x - width / 2,
      y: worldPos.y - height / 2,
      width,
      height,
    });
  };

  return {
    handleAddText,
    handleAddArrow,
    handleAddLine,
    handleAddShape,
  };
};
