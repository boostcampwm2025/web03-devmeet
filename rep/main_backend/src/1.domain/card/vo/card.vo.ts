import {
  NotAllowMaxLengthText,
  NotAllowMinValue,
  NotTypeUUidV7,
} from '@error/domain/user/user.error';
import { baseVo } from '@domain/shared';
import {
  NotAllowBackgroundColor,
  NotAllowStatusValue,
} from '@error/domain/card/card.error';

export const statusTypes = ['published', 'draft', 'archived'] as const;
export type StatusProps = (typeof statusTypes)[number];

export type CardProps = {
  card_id: string;
  user_id: string;
  category_id: number;
  thumbnail_path: string | undefined;
  status: StatusProps;
  title: string;
  workspace_width: number;
  workspace_height: number;
  background_color: string;
  created_at?: Date;
  updated_at?: Date;
  deleted_at?: Date | undefined;
};

// card_id를 검증하기 위함
export function cardIdVo(card_id: CardProps['card_id']): string {
  const name: string = 'card_id';

  baseVo({ name, value: card_id, type: 'string' }); // null, type 체크
  card_id = card_id.trim();

  // uuid v7 체크
  const uuidV7Regxp: RegExp =
    /^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!uuidV7Regxp.test(card_id)) throw new NotTypeUUidV7(name);

  return card_id;
}

// thumnail을 검증
export function thumbnailPathVo(
  thumbnail_path: Exclude<CardProps['thumbnail_path'], undefined>,
): string {
  const name: string = 'thumbnail_path';

  baseVo({ name, value: thumbnail_path, type: 'string' });
  thumbnail_path = thumbnail_path.trim();

  const length: number = 255;
  if (thumbnail_path.length > 255)
    throw new NotAllowMaxLengthText({ name, length });

  return thumbnail_path;
}

// status를 검증
export function statusVo(status: CardProps['status']): StatusProps {
  const name: string = 'status';

  baseVo({ name, value: status, type: 'string' });
  status = status.trim() as any;

  if (!statusTypes.includes(status)) throw new NotAllowStatusValue();

  return status;
}

// title을 검증
export function titleVo(title: CardProps['title']): string {
  const name: string = 'title';

  baseVo({ name, value: title, type: 'string' });
  title = title.trim();

  const length: number = 255;
  if (title.length > 255) throw new NotAllowMaxLengthText({ name, length });

  return title;
}

// workspace_width을 검증
export function workspaceWidthVo(
  workspace_width: CardProps['workspace_width'],
): number {
  const name: string = 'workspace_width';

  if (workspace_width !== 0)
    baseVo({ name, value: workspace_width, type: 'number' });

  const min: number = 0;
  if (workspace_width < min) throw new NotAllowMinValue({ name, min });

  return workspace_width;
}

// workspace_height을 검증
export function workspaceHeightVo(
  workspace_height: CardProps['workspace_height'],
): number {
  const name: string = 'workspace_height';

  if (workspace_height !== 0)
    baseVo({ name, value: workspace_height, type: 'number' });

  const min: number = 0;
  if (workspace_height < min) throw new NotAllowMinValue({ name, min });

  return workspace_height;
}

// background_color을 검증
const backgroundColorRegxp: Array<RegExp> = [
  /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/,
  /^rgb\(\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}\s*\)$/,
  /^rgba\(\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*(0(\.\d+)?|1(\.0+)?)\s*\)$/,
];
export function backgroundColorVo(
  background_color: CardProps['background_color'],
): string {
  const name: string = 'background_color';

  baseVo({ name, value: background_color, type: 'string' });
  background_color = background_color.trim();

  let colorChecked: boolean = false;
  for (const colorRegxp of backgroundColorRegxp) {
    if (colorRegxp.test(background_color)) {
      colorChecked = true;
      break;
    }
  }

  if (!colorChecked) throw new NotAllowBackgroundColor();

  return background_color;
}
