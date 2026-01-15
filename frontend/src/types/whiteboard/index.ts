export * from '@/types/whiteboard/base';
export * from '@/types/whiteboard/items';

import {
  TextItem,
  ArrowItem,
  ShapeItem,
  ImageItem,
  VideoItem,
  YoutubeItem,
} from '@/types/whiteboard/items';

export type WhiteboardItem =
  | TextItem
  | ArrowItem
  | ShapeItem
  | ImageItem
  | VideoItem
  | YoutubeItem;
