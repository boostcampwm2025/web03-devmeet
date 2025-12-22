import { NotAllowMinValue } from '@error/domain/user/user.error';
import { baseVo } from '@domain/shared';

export type CardStateProps = {
  id: number;
  card_id: string;
  like_count: number;
  view_count: number;
  created_at?: Date;
  updated_at?: Date;
};

export function likeCountVo(like_count: CardStateProps['like_count']): number {
  const name: string = 'like_count';

  if (like_count !== 0) baseVo({ name, value: like_count, type: 'number' });

  const min: number = 0;
  if (like_count < min) throw new NotAllowMinValue({ name, min });

  return like_count;
}

export function viewCountVo(view_count: CardStateProps['view_count']): number {
  const name: string = 'view_count';

  if (view_count !== 0) baseVo({ name, value: view_count, type: 'number' });

  const min: number = 0;
  if (view_count < min) throw new NotAllowMinValue({ name, min });

  return view_count;
}
