'use client';

interface CustomColorInputProps {
  color: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export default function CustomColorInput({
  color,
  onChange,
}: CustomColorInputProps) {
  return (
    <div className="relative h-6 w-6 cursor-pointer overflow-hidden rounded-md border border-neutral-200 shadow-sm hover:opacity-80">
      <input
        type="color"
        value={color === 'transparent' ? '#ffffff' : color}
        onChange={onChange}
        className="absolute -top-1/2 -left-1/2 h-[200%] w-[200%] cursor-pointer border-0 p-0 opacity-0"
      />
      <div className="h-full w-full bg-[linear-gradient(to_bottom_right,#fca5a5,#fdba74,#fde047,#86efac,#93c5fd,#a5b4fc,#d8b4fe)]" />
    </div>
  );
}
