'use client';

import NavButton from '@/components/whiteboard/common/NavButton';

import { useAddWhiteboardItem } from '@/hooks/useAddWhiteboardItem';

import { PanelProps, ToolType } from '@/types/whiteboard/whiteboardUI';
import { ShapeType } from '@/types/whiteboard';

import {
  CircleIcon,
  TriangleIcon,
  SquareIcon,
  DiamondIcon,
  PentagonIcon,
} from '@/assets/icons/whiteboard';

export default function ShapePanel({ selectedTool, onSelect }: PanelProps) {
  // shape add hook
  const { handleAddShape } = useAddWhiteboardItem();

  const commonProps = {
    bgColor: 'bg-white',
    activeBgColor: 'bg-sky-100 text-sky-600',
  };

  // 해당하는 도형 추가 로직
  const handleClick = (shapeType: ShapeType, toolId: ToolType) => {
    onSelect(toolId);
    handleAddShape(shapeType);
  };

  return (
    <div className="flex gap-1 rounded-lg border border-neutral-200 bg-white p-1.5 shadow-lg">
      <NavButton
        icon={CircleIcon}
        label="원"
        isActive={selectedTool === 'circle'}
        onClick={() => handleClick('circle', 'circle')}
        {...commonProps}
      />
      <NavButton
        icon={TriangleIcon}
        label="삼각형"
        isActive={selectedTool === 'triangle'}
        onClick={() => handleClick('triangle', 'triangle')}
        {...commonProps}
      />
      <NavButton
        icon={SquareIcon}
        label="사각형"
        isActive={selectedTool === 'rectangle'}
        onClick={() => handleClick('rect', 'rectangle')}
        {...commonProps}
      />
      <NavButton
        icon={DiamondIcon}
        label="다이아몬드"
        isActive={selectedTool === 'diamond'}
        onClick={() => handleClick('diamond', 'diamond')}
        {...commonProps}
      />
      <NavButton
        icon={PentagonIcon}
        label="오각형"
        isActive={selectedTool === 'pentagon'}
        onClick={() => handleClick('pentagon', 'pentagon')}
        {...commonProps}
      />
    </div>
  );
}
