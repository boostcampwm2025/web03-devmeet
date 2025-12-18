import { motion, MotionValue, useTransform } from 'framer-motion';
import Image from 'next/image';
import tarotBackImg from '@/assets/TarotBack.png';
import sampleImg from '@/assets/sample.jpg';
import { useEffect, useState } from 'react';

interface CardItemProps {
  index: number;
  total: number;
  rotation: MotionValue<number>;
  isDragging: boolean;
  isHovered: boolean;
  onHoverStart: () => void;
  onHoverEnd: () => void;
  isSelected: boolean;
  onSelect: () => void;
}

const RADIUS = 1200;
const ANGLE_GAP = 4;

export default function CardItem({
  index,
  total,
  rotation,
  isDragging,
  isHovered,
  onHoverStart,
  onHoverEnd,
  isSelected,
  onSelect,
}: CardItemProps) {
  const centerIndex = (total - 1) / 2;
  const offset = index - centerIndex;

  // 카드 고유 회전: 회전각도 -> 오프셋 기준으로 좌우대칭
  const baseRotate = offset * ANGLE_GAP;

  // 전역 회전 + 카드 회전 합성 (선택됐으면 적용 X)
  const rotate = useTransform(rotation, (r) =>
    isSelected ? 0 : r + baseRotate,
  );

  const activeHover = isHovered && !isDragging && !isSelected;

  const [centerY, setCenterY] = useState(-RADIUS - 480);

  useEffect(() => {
    const calculateCenter = () => {
      const vh = window.innerHeight;
      // 부모 위치와 RADIUS를 고려하여 화면 중앙에 오도록 수치 조정
      setCenterY(-(RADIUS + vh * 0.3));
    };

    calculateCenter();

    window.addEventListener('resize', calculateCenter);
    return () => window.removeEventListener('resize', calculateCenter);
  }, []);

  return (
    <motion.div
      className="absolute top-0 left-1/2 will-change-transform"
      onClick={(e) => {
        if (isDragging || isSelected) return;
        e.stopPropagation();
        onSelect();
      }}
      onHoverStart={onHoverStart}
      onHoverEnd={onHoverEnd}
      animate={
        isSelected
          ? {
              // y: [-RADIUS, -RADIUS - 240, -RADIUS - 200],
              y: [-RADIUS, -RADIUS - 240, centerY],
              x: '-50%',
              scale: [1, 2, 1, 1, 3],
              rotate: [0, 0, -90, -90, -90],
              rotateY: [0, 0, 0, 0, 180],
            }
          : {
              y: activeHover ? -RADIUS - 30 : -RADIUS,
              x: '-50%',
              scale: activeHover ? 1.06 : 1,
            }
      }
      transition={
        isSelected
          ? {
              // times: [0, 0.3, 0.5, 0.8, 1],
              times: [0, 0.2, 0.4, 0.6, 1], // 시점 최적화 (타임 고려중..)
              duration: 3.5,
              ease: 'easeInOut',
            }
          : { type: 'spring', stiffness: 260, damping: 26 }
      }
      style={{
        rotate: isSelected ? -90 : rotate,
        transformOrigin: isSelected ? 'center center' : `10% ${RADIUS}px`,
        zIndex: isSelected ? 50 : 1,
        cursor: isSelected ? 'default' : isDragging ? 'grabbing' : 'grab',
        transformStyle: 'preserve-3d',
      }}
    >
      {/* 카드 */}
      <div
        className="relative h-60 w-35 select-none"
        style={{ transformStyle: 'preserve-3d' }}
      >
        {/* 카드 뒷면 (클로비 백카드 부분) */}
        <div
          className="absolute inset-0"
          style={{ backfaceVisibility: 'hidden' }}
        >
          <Image
            src={tarotBackImg}
            alt="카드 뒷면"
            className="object-cover"
            draggable={false}
            priority
          />
        </div>

        {/* 카드 앞면 */}
        <div
          className="absolute inset-0"
          style={{
            backfaceVisibility: 'hidden',
            transform: 'rotateY(180deg)', // 미리 뒤집어두기
          }}
        >
          <div className="flex h-full w-full items-center justify-center overflow-hidden rounded-lg border-4 border-white bg-gray-100">
            <Image
              src={sampleImg}
              alt="sample"
              className="rounded-md object-cover"
              draggable={false}
              priority
              style={{
                transform: 'rotate(90deg)',
                scale: 1.5, // 추후 스케일로 지정하지 않게 고려필요
              }}
            />
          </div>
        </div>
      </div>
    </motion.div>
  );
}
