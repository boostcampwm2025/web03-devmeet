import type Konva from 'konva';
import type { WhiteboardItem } from '@/types/whiteboard';

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

// 보이는 영역 계산
export function getViewportRect(stage: Konva.Stage): Rect {
  const scale = stage.scaleX();
  const pos = stage.position();

  const width = stage.width() / scale;
  const height = stage.height() / scale;

  return {
    x: -pos.x / scale,
    y: -pos.y / scale,
    width,
    height,
  };
}

// 교차하는지
export function isIntersecting(a: Rect, b: Rect): boolean {
  return !(
    a.x + a.width < b.x ||
    a.x > b.x + b.width ||
    a.y + a.height < b.y ||
    a.y > b.y + b.height
  );
}

//아이템 박스 계산
export function getItemBoundingBox(item: WhiteboardItem): Rect {
  switch (item.type) {
    case 'shape':
    case 'image':
    case 'video':
    case 'youtube':
      return {
        x: item.x,
        y: item.y,
        width: item.width,
        height: item.height,
      };

    case 'text': {
      const estimatedHeight = item.fontSize * 1.5; // 정확한 높이는 아님
      return {
        x: item.x,
        y: item.y,
        width: item.width,
        height: estimatedHeight,
      };
    }

    case 'arrow':
    case 'line':
    case 'drawing': {
      const points = item.points;
      if (!points || points.length < 2) {
        return { x: 0, y: 0, width: 0, height: 0 };
      }

      let minX = Infinity;
      let minY = Infinity;
      let maxX = -Infinity;
      let maxY = -Infinity;

      for (let i = 0; i < points.length; i += 2) {
        const x = points[i];
        const y = points[i + 1];
        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
        maxX = Math.max(maxX, x);
        maxY = Math.max(maxY, y);
      }

      const padding = (item.strokeWidth || 2) * 2;

      return {
        x: minX - padding,
        y: minY - padding,
        width: maxX - minX + padding * 2,
        height: maxY - minY + padding * 2,
      };
    }

    default:
      return { x: 0, y: 0, width: 0, height: 0 };
  }
}

export function filterVisibleItems(
  items: WhiteboardItem[],
  viewport: Rect,
): WhiteboardItem[] {
  return items.filter((item) => {
    const bbox = getItemBoundingBox(item);
    return isIntersecting(bbox, viewport);
  });
}
