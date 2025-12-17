import Image from 'next/image';

type IconButtonProps = {
  icon: string;
  active?: boolean;
  onClick?: () => void;
  title?: string;
  variant?: 'default' | 'ghost';
  color?: 'default' | 'lime';
};

export default function IconButton({
  icon,
  active,
  onClick,
  title,
  color = 'default',
}: IconButtonProps) {
  const base =
    'w-8 h-8 flex items-center justify-center rounded-lg transition-colors';

  const colors = {
    default: active
      ? 'bg-gray-100 border-none text-white'
      : 'bg-white border-none hover:bg-gray-50',
    lime: active
      ? 'bg-lime-100 border-none text-white'
      : 'bg-white border-none hover:bg-lime-50',
  };

  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className={`${base} ${colors[color]}`}
    >
      <Image
        src={icon}
        alt={title ?? ''}
        width={16}
        height={16}
        className="h-5 w-5"
      />
    </button>
  );
}
