'use client';

import Section from '@/components/whiteboard/sidebar/ui/Section';
import NavButton from '@/components/whiteboard/common/NavButton';

import {
  layerBringToFrontIcon,
  layerSendToBackIcon,
} from '@/assets/icons/whiteboard/common';

interface LayerSectionProps {
  onChangeLayer: (direction: 'front' | 'back') => void;
}

export default function LayerSection({ onChangeLayer }: LayerSectionProps) {
  return (
    <Section title="Layer">
      <div className="flex items-center gap-2">
        {/* 맨 앞으로 가져오기 */}
        <div className="rounded border border-neutral-200 bg-white p-1">
          <NavButton
            icon={layerBringToFrontIcon}
            label="맨 앞으로"
            onClick={() => onChangeLayer('front')}
          />
        </div>

        {/* 맨 뒤로 보내기 */}
        <div className="rounded border border-neutral-200 bg-white p-1">
          <NavButton
            icon={layerSendToBackIcon}
            label="맨 뒤로"
            onClick={() => onChangeLayer('back')}
          />
        </div>
      </div>
    </Section>
  );
}
