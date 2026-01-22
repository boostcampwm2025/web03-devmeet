'use client';

// 색상 버튼 컴포넌트(색상 하나만 담당)
// 클릭 시 해당 색상으로 변경
// color : 색상
// label : 색상 이름
// isSelected : 현재 선택된 색상 여부
// onClick : 클릭 시 동작 함수
interface ColorButtonProps {
  color: string;
  label?: string;
  isSelected: boolean;
  onClick: () => void;
}

export default function ColorButton({
  color,
  label,
  isSelected,
  onClick,
}: ColorButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`relative h-6 w-6 rounded-md border border-neutral-200 transition-all focus:outline-none ${
        isSelected ? 'z-1 scale-120 ring-2 ring-sky-300' : 'hover:scale-110'
      }`}
      style={{ backgroundColor: color === 'transparent' ? 'white' : color }}
      title={label || color}
    >
      {color === 'transparent' && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="h-full w-0.5 rotate-45 bg-red-400 opacity-50" />
        </div>
      )}
    </button>
  );
}
