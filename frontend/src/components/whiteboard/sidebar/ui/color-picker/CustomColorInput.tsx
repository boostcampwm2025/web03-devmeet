'use client';

// 사용자 색상 선택기
// color : 현재 선택된 색상
// onChange : 색상 변경 시 호출 함수
interface CustomColorInputProps {
  color: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export default function CustomColorInput({
  color,
  onChange,
}: CustomColorInputProps) {
  return (
    <div className="relative h-7 w-7 cursor-pointer overflow-hidden rounded-md border border-neutral-200 shadow-sm transition-opacity hover:opacity-80">
      <input
        type="color"
        // 투명 색상 선택 시 흰색으로 표시(오류 방지)
        value={color === 'transparent' ? '#ffffff' : color}
        onChange={onChange}
        className="absolute top-1/2 left-1/2 h-[200%] w-[200%] -translate-x-1/2 -translate-y-1/2 cursor-pointer opacity-0"
      />

      {/* 색상 선택기 버튼 그라데이션 */}
      <div className="h-full w-full bg-[linear-gradient(to_bottom_right,#fca5a5,#fdba74,#fde047,#86efac,#93c5fd,#a5b4fc,#d8b4fe)]" />
    </div>
  );
}
