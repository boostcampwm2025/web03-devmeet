import Portal from '@/components/common/Portal';

interface ToastMessageProps {
  message: string;
}

export default function ToastMessage({ message }: ToastMessageProps) {
  return (
    <Portal>
      <span className="absolute bottom-6 left-1/2 z-99 -translate-x-1/2 rounded-full bg-neutral-500 px-4 py-2 text-sm font-bold whitespace-nowrap text-neutral-50">
        {message}
      </span>
    </Portal>
  );
}
