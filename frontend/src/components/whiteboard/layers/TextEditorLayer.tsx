import React from 'react';
import Konva from 'konva';

import type { WhiteboardItem, ShapeItem, TextItem } from '@/types/whiteboard';

import Portal from '@/components/common/Portal';
import TextArea from '@/components/whiteboard/items/text/TextArea';
import ShapeTextArea from '@/components/whiteboard/items/shape/ShapeTextArea';

interface TextEditorLayerProps {
  editingTextId: string | null;
  items: WhiteboardItem[];
  stageRef: React.RefObject<Konva.Stage | null>;
  updateItem: (id: string, newAttributes: Partial<WhiteboardItem>) => void;
  setEditingTextId: (id: string | null) => void;
  clearSelection: () => void;
}

export default function TextEditorLayer({
  editingTextId,
  items,
  stageRef,
  updateItem,
  setEditingTextId,
  clearSelection,
}: TextEditorLayerProps) {
  // 현재 타이핑 중인 아이템 객체 가져오기
  const editingItem = editingTextId
    ? items.find((item) => item.id === editingTextId)
    : null;

  return (
    <>
      {editingItem && editingItem.type === 'text' && (
        <Portal>
          <TextArea
            textId={editingTextId!}
            textItem={editingItem as TextItem}
            stageRef={stageRef}
            onChange={(newText) =>
              updateItem(editingItem.id, { text: newText })
            }
            onClose={() => {
              setEditingTextId(null);
              clearSelection();
            }}
          />
        </Portal>
      )}

      {editingItem && editingItem.type === 'shape' && (
        <Portal>
          <ShapeTextArea
            shapeId={editingTextId!}
            shapeItem={editingItem as ShapeItem}
            stageRef={stageRef}
            onChange={(newText) =>
              updateItem(editingItem.id, { text: newText })
            }
            onSizeChange={(width, height, newY, newX, newText) => {
              updateItem(editingItem.id, {
                width,
                height,
                ...(newY !== undefined && { y: newY }),
                ...(newX !== undefined && { x: newX }),
                ...(newText !== undefined && { text: newText }),
              });
            }}
            onClose={() => {
              setEditingTextId(null);
              clearSelection();
            }}
          />
        </Portal>
      )}
    </>
  );
}
