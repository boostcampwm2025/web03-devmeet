'use client';

import NavButton from '@/components/whiteboard/common/NavButton';
import { useCanvasStore } from '@/store/useCanvasStore';
import { TextBoxIcon } from '@/assets/icons/whiteboard';
import { screenToWorld } from '@/components/whiteboard/utils/coordinate';

export default function TextPanel() {
  const addText = useCanvasStore((state) => state.addText);
  const selectItem = useCanvasStore((state) => state.selectItem);
  const stagePos = useCanvasStore((state) => state.stagePos);
  const stageScale = useCanvasStore((state) => state.stageScale);

  //화면 중앙 계산 후 좌표 변환
  const handleAddText = () => {
    if (typeof window === 'undefined') return;

    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;

    const worldPos = screenToWorld(centerX, centerY, stagePos, stageScale);

    const textId = addText({ x: worldPos.x, y: worldPos.y });
    selectItem(textId);
  };

  return (
    <div className="flex flex-col gap-2">
      <NavButton icon={TextBoxIcon} label="텍스트" onClick={handleAddText} />
    </div>
  );
}
