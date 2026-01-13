export * from '@/types/whiteboard/base';
export * from '@/types/whiteboard/items';

import { TextItem, ArrowItem, DrawingItem, ShapeItem } from '@/types/whiteboard/items';

export type WhiteboardItem = TextItem | ArrowItem | DrawingItem | ShapeItem;
