'use client';

import { useEffect, useRef } from 'react';
import Konva from 'konva';
import { Transformer } from 'react-konva';
import type { WhiteboardItem } from '@/types/whiteboard';

interface ItemTransformerProps {
  selectedId: string | null;
  items: WhiteboardItem[];
  stageRef: React.RefObject<Konva.Stage | null>;
}

export default function ItemTransformer({
  selectedId,
  items,
  stageRef,
}: ItemTransformerProps) {
  const transformerRef = useRef<Konva.Transformer | null>(null);

  const selectedItem = items.find((item) => item.id === selectedId);
  const isTextSelected = selectedItem?.type === 'text';
  const isArrowSelected = selectedItem?.type === 'arrow';
  const isDrawingSelected = selectedItem?.type === 'drawing';

  // Transformer 연결
  useEffect(() => {
    if (transformerRef.current && stageRef.current) {
      const stage = stageRef.current;

      // 선택된 아이디
      // Arrow 아이템 선택 : Transformer 비활성화
      // Arrow 외 아이템 선택 : Transformer 활성화
      if (selectedId && !isArrowSelected) {
        // 해당 ID 노드 확인
        const selectedNode = stage.findOne('#' + selectedId);
        // 노드가 존재하면 Transformer에 연결
        if (selectedNode) {
          transformerRef.current.nodes([selectedNode]);
          transformerRef.current.getLayer()?.batchDraw();
        }
        // 노드 존재하지 않으면 Transformer 해제
        else {
          transformerRef.current.nodes([]);
        }
      } else {
        transformerRef.current.nodes([]);
      }
    }
  }, [selectedId, items, stageRef, isArrowSelected]);

  return (
    <Transformer
      ref={transformerRef}
      enabledAnchors={
        // Text : 좌우 활성화
        // Text제외 나머지 : 모든 방향 활성화
        isTextSelected
          ? ['middle-left', 'middle-right']
          : [
              'top-left',
              'top-right',
              'bottom-left',
              'bottom-right',
              'top-center',
              'bottom-center',
              'middle-left',
              'middle-right',
            ]
      }
      rotateEnabled={!isDrawingSelected}
      anchorSize={10}
      anchorCornerRadius={5}
      anchorStrokeWidth={1.5}
      anchorStroke="#0369A1"
      anchorFill="#ffffff"
      borderStroke="#0369A1"
      borderStrokeWidth={1.5}
      rotationSnaps={[0, 90, 180, 270]}
      rotationSnapTolerance={10}
      keepRatio={false}
      boundBoxFunc={(oldBox, newBox) => {
        // 최소 크기 제한
        const minWidth = 30;
        const minHeight = 30;

        // 너비가 최소값보다 작으면 제한하고 위치 보정
        if (newBox.width < minWidth) {
          if (newBox.x !== oldBox.x) {
            newBox.x = oldBox.x + oldBox.width - minWidth;
          }
          newBox.width = minWidth;
        }

        // 높이가 최소값보다 작으면 제한하고 위치 보정
        if (newBox.height < minHeight) {
          if (newBox.y !== oldBox.y) {
            newBox.y = oldBox.y + oldBox.height - minHeight;
          }
          newBox.height = minHeight;
        }

        return newBox;
      }}
    />
  );
}
