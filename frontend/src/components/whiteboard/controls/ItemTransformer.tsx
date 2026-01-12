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
      // 핸들 스타일
      // anchorSize : 핸들크기 / anchorCornerRadius : 모서리 둥글기 / anchorStrokeWidth : 테두리 두께
      anchorSize={10}
      anchorCornerRadius={5}
      anchorStrokeWidth={1.5}
      // anchorStroke : 핸들 테두리 색상 / anchorFill : 핸들 내부 색상
      anchorStroke="#0369A1"
      anchorFill="#ffffff"
      // borderStroke : 테두리 색상 / borderStrokeWidth : 테두리 두께
      borderStroke="#0369A1"
      borderStrokeWidth={1.5}
      // 회전 관련 설정
      // rotationSnaps : 회전 스냅 각도 / rotationSnapTolerance : 스냅 허용 오차
      rotationSnaps={[0, 90, 180, 270]}
      rotationSnapTolerance={10}
      // 비율 유지 설정
      keepRatio={false}
      // 최소 크기 제한
      boundBoxFunc={(_oldBox, newBox) => {
        if (newBox.width < 5 || newBox.height < 5) {
          return _oldBox;
        }
        return newBox;
      }}
      // Text 변형 로직
      onTransform={(e) => {
        const node = e.target;

        if (node.getClassName() === 'Text') {
          const scaleX = node.scaleX();

          // 스케일 변형시 스케일 1로 고정 및 너비 조절
          if (scaleX !== 1) {
            node.scaleX(1);
            node.width(Math.max(30, node.width() * scaleX));
          }
          return;
        }
      }}
    />
  );
}
