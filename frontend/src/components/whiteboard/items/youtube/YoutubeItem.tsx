'use client';

import Konva from 'konva';
import { Image as KonvaImage, Group, Rect } from 'react-konva';
import useImage from 'use-image';

import { YoutubeItem as YoutubeItemType } from '@/types/whiteboard';

import { getYoutubeThumbnailUrl } from '@/utils/youtube';

interface YoutubeItemProps {
  youtubeItem: YoutubeItemType;
  onSelect: () => void;
  onChange: (newAttrs: Partial<YoutubeItemType>) => void;
  onMouseEnter: (e: Konva.KonvaEventObject<MouseEvent>) => void;
  onMouseLeave: (e: Konva.KonvaEventObject<MouseEvent>) => void;
  onDragStart?: () => void;
  onDragEnd?: () => void;
}

export default function YoutubeItem({
  youtubeItem,
  onSelect,
  onChange,
  onMouseEnter,
  onMouseLeave,
  onDragStart,
  onDragEnd,
}: YoutubeItemProps) {
  // 유튜브 썸네일 URL 생성
  const thumbnailUrl = getYoutubeThumbnailUrl(youtubeItem.videoId);
  // 썸네일 이미지 로드
  const [thumbnailBitmap] = useImage(thumbnailUrl, 'anonymous');

  // 재생 아이콘 가져오기
  const [playIconBitmap] = useImage('/icons/youtubeIcon.svg');

  // 링크 이동 핸들러
  // _blank : 새탭에서 열기
  // _self : 현재 탭에서 열기
  // 추후에 모달이나 팝업으로 재생하는 것도 고려 해봐도 괜찮음 -> 추후 논의 필요
  const handleOpenLink = () => {
    if (typeof window !== 'undefined') {
      window.open(youtubeItem.url, '_blank');
    }
  };

  return (
    <Group
      id={youtubeItem.id}
      // 위치
      x={youtubeItem.x}
      y={youtubeItem.y}
      // 크기
      width={youtubeItem.width}
      height={youtubeItem.height}
      // 회전
      rotation={youtubeItem.rotation}
      // 액션
      draggable
      onMouseDown={onSelect}
      onTouchStart={onSelect}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onDragStart={onDragStart}
      onDblClick={handleOpenLink}
      // 이동
      onDragEnd={(e) => {
        onChange({ x: e.target.x(), y: e.target.y() });
        onDragEnd?.();
      }}
      // 변형
      onTransformEnd={(e) => {
        const node = e.target;
        const scaleX = node.scaleX();
        const scaleY = node.scaleY();

        // 크기 보정
        node.scaleX(1);
        node.scaleY(1);

        onChange({
          x: node.x(),
          y: node.y(),
          width: Math.max(5, node.width() * scaleX),
          height: Math.max(5, node.height() * scaleY),
          rotation: node.rotation(),
        });
      }}
    >
      {/* 배경 */}
      <Rect
        width={youtubeItem.width}
        height={youtubeItem.height}
        fill="#2c2c2c"
        cornerRadius={youtubeItem.cornerRadius}
        stroke={youtubeItem.stroke}
        strokeWidth={youtubeItem.strokeWidth}
      />

      {/* 썸네일 이미지 */}
      {thumbnailBitmap && (
        <KonvaImage
          image={thumbnailBitmap}
          width={youtubeItem.width}
          height={youtubeItem.height}
          cornerRadius={youtubeItem.cornerRadius}
          opacity={youtubeItem.opacity}
          stroke={youtubeItem.stroke}
          strokeWidth={youtubeItem.strokeWidth}
        />
      )}

      {/* 중앙 재생 버튼 그룹 */}
      <Group
        x={youtubeItem.width / 2}
        y={youtubeItem.height / 2}
        onClick={(e) => {
          e.cancelBubble = true;
          handleOpenLink();
        }}
        onTap={(e) => {
          e.cancelBubble = true;
          handleOpenLink();
        }}
        onMouseEnter={(e) => {
          const container = e.target.getStage()?.container();
          if (container) container.style.cursor = 'pointer';
        }}
        onMouseLeave={(e) => {
          const container = e.target.getStage()?.container();
          if (container) container.style.cursor = 'default';
        }}
      >
        {/* SVG 아이콘 이미지 렌더링 */}
        {playIconBitmap && (
          <KonvaImage
            image={playIconBitmap}
            width={60}
            height={50}
            x={-30}
            y={-20}
            shadowColor="black"
            shadowBlur={5}
            shadowOpacity={0.4}
          />
        )}
      </Group>
    </Group>
  );
}
