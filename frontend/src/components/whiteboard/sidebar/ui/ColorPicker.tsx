'use client';

import PaletteGrid from '@/components/whiteboard/sidebar/ui/color-picker/PaletteGrid';
import CustomColorArea from '@/components/whiteboard/sidebar/ui/color-picker/CustomColorArea';

// ColorPicker 컴포넌트의 Props 타입 정의
interface ColorPickerProps {
  color: string;
  onChange: (color: string) => void;
  allowTransparent?: boolean;
}

export default function ColorPicker({
  color,
  onChange,
  allowTransparent = false,
}: ColorPickerProps) {
  return (
    <div className="flex flex-col">
      {/* 기본 색상 팔레트 */}
      <PaletteGrid
        currentColor={color}
        onChange={onChange}
        allowTransparent={allowTransparent}
      />

      {/* 사용자 지정 및 최근 색상 */}
      <CustomColorArea currentColor={color} onChange={onChange} />
    </div>
  );
}
