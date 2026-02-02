import { v4 as uuidv4 } from 'uuid';
import * as Y from 'yjs';
import { useState, useCallback } from 'react';

import { useWhiteboardSharedStore } from '@/store/useWhiteboardSharedStore';
import { useWhiteboardLocalStore } from '@/store/useWhiteboardLocalStore';

import { useItemActions } from '@/hooks/useItemActions';

import type { WhiteboardItem } from '@/types/whiteboard';
import type { YMapValue } from '@/types/whiteboard/yjs';

export const useWhiteboardClipboard = () => {
  const [clipboard, setClipboard] = useState<WhiteboardItem | null>(null);

  const selectedId = useWhiteboardLocalStore((state) => state.selectedId);
  const items = useWhiteboardSharedStore((state) => state.items);
  const yItems = useWhiteboardSharedStore((state) => state.yItems);

  const { performTransaction } = useItemActions();

  // 복사 (Copy)
  const copy = useCallback(() => {
    if (!selectedId) return;

    const targetItem = items.find((item) => item.id === selectedId);
    if (targetItem)
      setClipboard(JSON.parse(JSON.stringify(targetItem)) as WhiteboardItem);
  }, [selectedId, items]);

  // 붙여넣기 (Paste)
  const paste = useCallback(() => {
    if (!clipboard || !yItems || !yItems.doc) return;

    performTransaction(() => {
      const offset = 30;
      const newId = uuidv4();

      // 속성 수정을 위해 임시 객체 생성
      const newItem = { ...clipboard } as Record<string, unknown>;
      newItem.id = newId;

      // 타입별 좌표 이동 처리
      if (newItem.type === 'drawing') {
        if (Array.isArray(newItem.points)) {
          newItem.points = newItem.points.map((p: number) => p + offset);
        }
      } else {
        if (typeof newItem.x === 'number') newItem.x += offset;
        if (typeof newItem.y === 'number') newItem.y += offset;

        if (Array.isArray(newItem.points)) {
          newItem.points = newItem.points.map((p: number) => p + offset);
        }
      }

      // unknown 대신 YMapValue 타입을 명시합니다.
      const yMap = new Y.Map<YMapValue>();

      Object.entries(newItem).forEach(([key, value]) => {
        if (value !== undefined) yMap.set(key, value as YMapValue);
      });

      yItems.push([yMap]);
    });
  }, [clipboard, yItems, performTransaction]);

  return { copy, paste };
};
