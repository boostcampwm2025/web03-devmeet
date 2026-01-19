'use client';

import StrokeColorSection from '@/components/whiteboard/sidebar/sections/StrokeColorSection';
import TextSizeSection from '@/components/whiteboard/sidebar/sections/TextSizeSection';
import TextAlignSection from '@/components/whiteboard/sidebar/sections/TextAlignSection';
import type { TextSize } from './textPresets';
import type { TextAlignment } from '@/types/whiteboard/base';

// TextPanel 컴포넌트
interface TextPanelProps {
  fill: string;
  size: TextSize;
  align: TextAlignment;
  onChangeFill: (color: string) => void;
  onChangeSize: (size: TextSize) => void;
  onChangeAlign: (align: TextAlignment) => void;
}

export default function TextPanel({
  fill,
  size,
  align,
  onChangeFill,
  onChangeSize,
  onChangeAlign,
}: TextPanelProps) {
  return (
    <div className="flex flex-col gap-2">
      {/* 텍스트 색상 설정 섹션 */}
      <StrokeColorSection
        color={fill}
        onChange={onChangeFill}
        allowTransparent={false}
      />

      {/* 텍스트 크기 설정 섹션 */}
      <TextSizeSection size={size} onChangeSize={onChangeSize} />

      {/* 텍스트 정렬 설정 섹션 */}
      <TextAlignSection align={align} onChangeAlign={onChangeAlign} />
    </div>
  );
}
