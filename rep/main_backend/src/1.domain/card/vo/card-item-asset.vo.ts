import {
  NotAllowMaxLengthText,
  NotAllowMimeType,
  NotAllowMinValue,
} from '@error/domain/user/user.error';
import { baseVo } from '@domain/shared';
import { NotAllowStatusValue } from '@error/domain/card/card.error';

export const cardItemAssetStatusList = [
  'uploading',
  'ready',
  'failed',
] as const;
export type CardItemAssetStatusProps = (typeof cardItemAssetStatusList)[number];

export type CardItemAssetProps = {
  item_id: string;
  key_name: string;
  mime_type: string;
  size: number;
  status: CardItemAssetStatusProps;
  created_at?: Date;
  updated_at?: Date;
};

// key_name에 대한 검증
export function cardItemAssetKeyNameVo(
  key_name: CardItemAssetProps['key_name'],
): string {
  const name: string = 'key_name';

  baseVo({ name, value: key_name, type: 'string' });
  key_name = key_name.trim();

  const length: number = 2048;
  if (key_name.length > length)
    throw new NotAllowMaxLengthText({ name, length });

  return key_name;
}

// mime_type에 대한 검증
const mimeTypeList: Array<string> = [
  'image/apng',
  'image/avif',
  'image/gif',
  'image/jpeg',
  'image/png',
  'image/svg+xml',
  'image/webp',
  'video/mp4',
  'video/webm',
  'video/ogg',
];
export function cardItemAssetMimeTypeVo(
  mime_type: CardItemAssetProps['mime_type'],
): string {
  const name: string = 'mime_type';

  baseVo({ name, value: mime_type, type: 'string' });
  mime_type = mime_type.trim().toLowerCase();

  if (!mimeTypeList.includes(mime_type))
    throw new NotAllowMimeType(mimeTypeList);

  return mime_type;
}

// size에 대한 검증
export function cardItemAssetSizeVo(size: CardItemAssetProps['size']): number {
  const name: string = 'size';

  if (size !== 0) baseVo({ name, value: size, type: 'number' });

  const min: number = 0;
  if (size < min) throw new NotAllowMinValue({ name, min });

  return size;
}

// status에 대한 검증
const statusList: Array<string> = ['uploading', 'ready', 'failed'];
export function cardItemAssetStatusVo(
  status: CardItemAssetProps['status'],
): CardItemAssetStatusProps {
  const name: string = 'status';

  baseVo({ name, value: status, type: 'string' });
  status = status.trim() as any;

  if (!statusList.includes(status)) throw new NotAllowStatusValue();

  return status;
}
