import { userIdVo } from '@domain/user/user.vo';
import {
  backgroundColorVo,
  cardIdVo,
  CardProps,
  statusVo,
  thumbnailPathVo,
  titleVo,
  workspaceHeightVo,
  workspaceWidthVo,
} from '@domain/card/vo';
import { idVo } from '@domain/shared';

export class Card {
  private readonly card_id: CardProps['card_id'];
  private readonly user_id: CardProps['user_id'];
  private readonly category_id: CardProps['category_id'];
  private readonly thumbnail_path: CardProps['thumbnail_path'];
  private readonly status: CardProps['status'];
  private readonly title: CardProps['title'];
  private readonly workspace_width: CardProps['workspace_width'];
  private readonly workspace_height: CardProps['workspace_height'];
  private readonly background_color: CardProps['background_color'];
  private readonly created_at: Exclude<CardProps['created_at'], undefined>;
  private readonly updated_at: Exclude<CardProps['updated_at'], undefined>;
  private readonly deleted_at: CardProps['deleted_at'];

  constructor({
    card_id,
    user_id,
    category_id,
    thumbnail_path = undefined,
    status,
    title,
    workspace_width,
    workspace_height,
    background_color,
    created_at = new Date(),
    updated_at = new Date(),
    deleted_at = new Date(),
  }: CardProps) {
    this.card_id = cardIdVo(card_id);
    this.user_id = userIdVo(user_id);
    this.category_id = idVo(category_id);
    this.thumbnail_path = thumbnail_path
      ? thumbnailPathVo(thumbnail_path)
      : undefined;
    this.status = statusVo(status);
    this.title = titleVo(title);
    this.workspace_width = workspaceWidthVo(workspace_width);
    this.workspace_height = workspaceHeightVo(workspace_height);
    this.background_color = backgroundColorVo(background_color);
    this.created_at = created_at instanceof Date ? created_at : new Date();
    this.updated_at = updated_at instanceof Date ? updated_at : new Date();
    this.deleted_at =
      deleted_at && deleted_at instanceof Date ? deleted_at : undefined;
    Object.freeze(this);
  }

  getCardId(): CardProps['card_id'] {
    return this.card_id;
  }
  getUserId(): CardProps['user_id'] {
    return this.user_id;
  }
  getCategoryId(): CardProps['category_id'] {
    return this.category_id;
  }
  getThumbnailPath(): CardProps['thumbnail_path'] {
    return this.thumbnail_path;
  }
  getStatus(): CardProps['status'] {
    return this.status;
  }
  getTitle(): CardProps['title'] {
    return this.title;
  }
  getWorkSpaceWidth(): CardProps['workspace_width'] {
    return this.workspace_width;
  }
  getWorkSpaceHeight(): CardProps['workspace_height'] {
    return this.workspace_height;
  }
  getBackgroundColor(): CardProps['background_color'] {
    return this.background_color;
  }
  getCreatedAt(): Exclude<CardProps['created_at'], undefined> {
    return this.created_at;
  }
  getUpdatedAt(): Exclude<CardProps['updated_at'], undefined> {
    return this.updated_at;
  }
  getDeletedAt(): CardProps['deleted_at'] {
    return this.deleted_at;
  }

  getData():
    | Required<Omit<CardProps, 'deleted_at'>>
    | Record<'deleted_at', CardProps['deleted_at']> {
    return {
      card_id: this.card_id,
      user_id: this.user_id,
      category_id: this.category_id,
      thumbnail_path: this.thumbnail_path,
      status: this.status,
      title: this.title,
      workspace_width: this.workspace_width,
      workspace_height: this.workspace_height,
      background_color: this.background_color,
      created_at: this.created_at,
      updated_at: this.updated_at,
      deleted_at: this.deleted_at,
    };
  }
}
