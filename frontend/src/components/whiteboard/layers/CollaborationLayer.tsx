import React from 'react';
import Konva from 'konva';

import type { WhiteboardItem } from '@/types/whiteboard';

import RemoteSelectionLayer from '@/components/whiteboard/remote/RemoteSelectionLayer';
import RemoteSelectionIndicator from '@/components/whiteboard/remote/RemoteSelectionIndicator';

interface CollaborationLayerProps {
  myUserId: string | null;
  items: WhiteboardItem[];
  selectedIds: string[];
  singleSelectedId: string | null;
  stageRef: React.RefObject<Konva.Stage | null>;
}

export default function CollaborationLayer({
  myUserId,
  items,
  selectedIds,
  singleSelectedId,
  stageRef,
}: CollaborationLayerProps) {
  return (
    <>
      {/* 본인 선택 박스 */}
      {selectedIds.length > 1 &&
        selectedIds.map((itemId) => (
          <RemoteSelectionIndicator
            key={`my-selection-${itemId}`}
            selectedId={itemId}
            userColor="#0369A1"
            items={items}
            stageRef={stageRef}
          />
        ))}

      {/* 다른 사용자의 선택 표시 */}
      <RemoteSelectionLayer
        myUserId={myUserId ?? ''}
        selectedId={singleSelectedId}
        items={items}
        stageRef={stageRef}
      />
    </>
  );
}
