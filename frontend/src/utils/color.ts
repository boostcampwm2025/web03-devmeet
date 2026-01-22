import { COLOR_NAMES } from '@/constants/colors';

// 색상 이름 반환 유틸 함수
// color 값이 COLOR_NAMES(constants/colors)에 존재하면 해당 이름을 반환
// color 값이 COLOR_NAMES(constants/colors)에 존재하지 않으면 color값(HEX 코드)을 반환
export const getColorName = (color: string): string => {
  if (COLOR_NAMES[color]) return COLOR_NAMES[color];
  return color;
};
