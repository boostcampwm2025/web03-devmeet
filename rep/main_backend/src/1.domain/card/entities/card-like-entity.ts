import { idVo } from '@domain/shared';
import { cardIdVo, CardLikeProps } from '../vo';
import { userIdVo } from '@domain/user/user.vo';

export class CardLike {
  private readonly id: CardLikeProps['id'];
  private readonly card_id: CardLikeProps['card_id'];
  private readonly user_id: CardLikeProps['user_id'];
  private readonly created_at: Exclude<CardLikeProps['created_at'], undefined>;

  constructor({
    id,
    card_id,
    user_id,
    created_at = new Date(),
  }: CardLikeProps) {
    this.id = idVo(id);
    this.card_id = cardIdVo(card_id);
    this.user_id = userIdVo(user_id);
    this.created_at =
      created_at && created_at instanceof Date ? created_at : new Date();
  }

  getId(): CardLikeProps['id'] {
    return this.id;
  }
  getCardId(): CardLikeProps['card_id'] {
    return this.card_id;
  }
  getUserId(): CardLikeProps['user_id'] {
    return this.user_id;
  }
  getCreatedAt(): Exclude<CardLikeProps['created_at'], undefined> {
    return this.created_at;
  }

  getData(): Required<CardLikeProps> {
    return {
      id: this.id,
      card_id: this.card_id,
      user_id: this.user_id,
      created_at: this.created_at,
    };
  }
}
