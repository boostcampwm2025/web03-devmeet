'use client';

import { useState } from 'react';

import { getColorName } from '@/utils/color';

import ColorButton from '@/components/whiteboard/sidebar/ui/color-picker/ColorButton';
import CustomColorInput from '@/components/whiteboard/sidebar/ui/color-picker/CustomColorInput';

// CustomColorArea: 사용자 지정 색상 선택 및 최근 사용 색상 관리 컴포넌트
// currentColor: 현재 선택된 색상
// onChange: 색상 변경 시 호출되는 콜백 함수
interface CustomColorAreaProps {
  currentColor: string;
  onChange: (color: string) => void;
}

export default function CustomColorArea({
  currentColor,
  onChange,
}: CustomColorAreaProps) {
  // 최근 사용된 색상이 저장된 배열
  const [recentColors, setRecentColors] = useState<string[]>([]);

  // 색상 변경 처리 함수
  const handleCustomColorChange = (newColor: string) => {
    onChange(newColor);

    // 최근 색상 목록 변경 로직
    // - 투명 저장 제외
    // - 중복 저장 방지
    if (newColor !== 'transparent' && !recentColors.includes(newColor)) {
      setRecentColors((prev) => {
        return [newColor, ...prev].slice(0, 5);
      });
    }
  };

  return (
    <div className="mt-2 flex items-center gap-1 border-t border-neutral-300 pt-2">
      {/* 사용자 지정 색상 선택기 */}
      <CustomColorInput
        color={currentColor}
        onChange={(e) => handleCustomColorChange(e.target.value)}
      />

      {/* 구분선 (최근 색상 있는 경우만 표시) */}
      {recentColors.length > 0 && (
        <div className="mx-1 h-4 w-px bg-neutral-300" />
      )}

      {/* 최근 사용 색상 리스트 */}
      <div className="flex gap-1.5">
        {recentColors.map((color) => (
          <ColorButton
            key={color}
            color={color}
            label={getColorName(color)}
            isSelected={currentColor === color}
            onClick={() => handleCustomColorChange(color)}
          />
        ))}
      </div>
    </div>
  );
}
