import { useCallback, useRef, useState } from 'react';

export const useChatScroll = () => {
  const [isAtBottom, setIsAtBottom] = useState(true);
  const ref = useRef<HTMLDivElement>(null);

  const THRESHOLD = 150;

  const scrollToBottom = useCallback((behavior: ScrollBehavior) => {
    const el = ref.current;
    if (!el) return;

    el.scrollTo({
      top: el.scrollHeight,
      behavior,
    });
  }, []);

  const handleScroll = useCallback(() => {
    const el = ref.current;
    if (!el) return;

    const atBottom =
      el.scrollHeight - el.scrollTop - el.clientHeight < THRESHOLD;

    setIsAtBottom(atBottom);
  }, []);

  return { ref, isAtBottom, scrollToBottom, handleScroll };
};
