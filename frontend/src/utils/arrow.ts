// 시작점과 끝점을 제외한 중간점들만 추출
export const getControlPoints = (points: number[]) => {
  const controlPoints = [];
  for (let i = 2; i < points.length - 2; i += 2) {
    controlPoints.push({
      x: points[i],
      y: points[i + 1],
      index: i,
    });
  }
  return controlPoints;
};

// 점-선분 간 거리 계산 (클릭한 위치에서 가장 가까운 선분 찾기용)
export const pointToSegmentDistance = (
  px: number,
  py: number,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
) => {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const lengthSquared = dx * dx + dy * dy;

  if (lengthSquared === 0) {
    return Math.hypot(px - x1, py - y1);
  }

  let t = ((px - x1) * dx + (py - y1) * dy) / lengthSquared;
  t = Math.max(0, Math.min(1, t));

  const closestX = x1 + t * dx;
  const closestY = y1 + t * dy;

  return Math.hypot(px - closestX, py - closestY);
};
