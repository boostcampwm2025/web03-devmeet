import { create } from 'zustand';
import { CANVAS_WIDTH, CANVAS_HEIGHT } from '@/constants/canvas';

interface CanvasState {
  stageScale: number;
  stagePos: { x: number; y: number };
  canvasWidth: number;
  canvasHeight: number;

  setStageScale: (scale: number) => void;
  setStagePos: (pos: { x: number; y: number }) => void;
}

export const useCanvasStore = create<CanvasState>((set) => ({
  stageScale: 1,
  // 브라우저에서만 window 접근
  // 캔버스 중앙을 화면 중앙에
  stagePos:
    typeof window !== 'undefined'
      ? {
          x: (window.innerWidth - CANVAS_WIDTH) / 2,
          y: (window.innerHeight - CANVAS_HEIGHT) / 2,
        }
      : { x: 0, y: 0 },
  canvasWidth: CANVAS_WIDTH,
  canvasHeight: CANVAS_HEIGHT,

  setStageScale: (scale) => set({ stageScale: scale }),
  setStagePos: (pos) => set({ stagePos: pos }),
}));
