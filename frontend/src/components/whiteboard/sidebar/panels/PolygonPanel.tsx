'use client';

import NavButton from '@/components/whiteboard/common/NavButton';
import { useCanvasStore } from '@/store/useCanvasStore';
import { screenToWorld } from '@/components/whiteboard/utils/coordinate';

import {
  TriangleIcon,
  SquareIcon,
  PentagonIcon,
} from '@/assets/icons/whiteboard';

// 임시로 삼각형 버튼에 화살표 생성 이벤트 연결, ui 변경 후 제거
export default function PolygonPanel() {
  const addArrow = useCanvasStore((state) => state.addArrow);
  const stagePos = useCanvasStore((state) => state.stagePos);
  const stageScale = useCanvasStore((state) => state.stageScale);

  const handleAddArrow = () => {
    if (typeof window === 'undefined') return;

    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;

    const worldPos = screenToWorld(centerX, centerY, stagePos, stageScale);

    addArrow({
      points: [worldPos.x - 100, worldPos.y, worldPos.x + 100, worldPos.y],
    });
  };

  return (
    <div className="flex flex-col gap-2">
      <NavButton icon={TriangleIcon} label="삼각형" onClick={handleAddArrow} />
      <NavButton icon={SquareIcon} label="사각형" />
      <NavButton icon={PentagonIcon} label="오각형" />
    </div>
  );
}
