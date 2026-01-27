interface Point {
  x: number;
  y: number;
}

interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

// 점과 사각형 사이의 가장 가까운 테두리 좌표 계산
export function getNearestSnapPoint(rect: Rect, point: Point) {
  const { x, y, width, height } = rect;

  // 점을 사각형 내부로 클램핑
  const clampedX = Math.max(x, Math.min(x + width, point.x));
  const clampedY = Math.max(y, Math.min(y + height, point.y));

  // 각 변까지의 거리 계산

  const dt = Math.abs(clampedY - y); // 상
  const db = Math.abs(clampedY - (y + height)); // 하
  const dl = Math.abs(clampedX - x); // 좌
  const dr = Math.abs(clampedX - (x + width)); // 우

  const min = Math.min(dt, db, dl, dr);

  let snapX = clampedX;
  let snapY = clampedY;

  // 가장 가까운 변으로 이동
  if (min === dl) snapX = x;
  else if (min === dr) snapX = x + width;
  else if (min === dt) snapY = y;
  else snapY = y + height;

  // 사각형 기준 정규화 좌표(0~1)
  const position = {
    x: (snapX - x) / width,
    y: (snapY - y) / height,
  };

  return { x: snapX, y: snapY, position };
}

// 정규화 좌표(0~1)를 실제 사각형 좌표로 변환
export const getPointFromNormalized = (
  rect: { x: number; y: number; width: number; height: number },
  position: { x: number; y: number },
) => {
  return {
    x: rect.x + rect.width * position.x,
    y: rect.y + rect.height * position.y,
  };
};

// 사각형 중심에서 targetPoint 방향으로 만나는 테두리 교차점 계산
export const getIntersectingPoint = (
  rect: { x: number; y: number; width: number; height: number },
  targetPoint: { x: number; y: number },
) => {
  // 사각형 중심
  const cx = rect.x + rect.width / 2;
  const cy = rect.y + rect.height / 2;

  const dx = targetPoint.x - cx;
  const dy = targetPoint.y - cy;

  // 중심과 동일한 경우
  if (dx === 0 && dy === 0) return { x: cx, y: cy };

  const hw = rect.width / 2;
  const hh = rect.height / 2;

  const scaleX = Math.abs(dx) / hw;
  const scaleY = Math.abs(dy) / hh;

  const scale = Math.max(scaleX, scaleY);

  // 테두리와 만나는 지점 반환
  return {
    x: cx + dx / scale,
    y: cy + dy / scale,
  };
};
