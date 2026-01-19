'use client';

import MultipleButtonGroup from '@/components/whiteboard/sidebar/ui/MultipleButtonGroup';
import { BoldIcon, ItalicIcon } from '@/assets/icons/whiteboard/text';

// Text 스타일 설정 section
interface TextStyleSectionProps {
  fontStyle: string;
  onChangeFontStyle: (fontStyle: string) => void;
}

export default function TextStyleSection({
  fontStyle,
  onChangeFontStyle,
}: TextStyleSectionProps) {
  const isBold = fontStyle.includes('bold');
  const isItalic = fontStyle.includes('italic');

  // 현재 선택된 스타일들을 배열로 변환
  const selectedStyles: ('bold' | 'italic')[] = [];
  if (isBold) selectedStyles.push('bold');
  if (isItalic) selectedStyles.push('italic');

  // 배열을 fontStyle 문자열로 변환
  const handleChange = (styles: ('bold' | 'italic')[]) => {
    if (styles.length === 0) {
      onChangeFontStyle('normal');
    } else if (styles.length === 2) {
      onChangeFontStyle('bold italic');
    } else {
      onChangeFontStyle(styles[0]);
    }
  };

  return (
    <MultipleButtonGroup
      label="Style"
      options={[
        { value: 'bold' as const, icon: BoldIcon },
        { value: 'italic' as const, icon: ItalicIcon },
      ]}
      value={selectedStyles}
      onChange={handleChange}
    />
  );
}
