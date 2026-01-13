import { useCanvasStore } from '@/store/useCanvasStore';
import { getCenterWorldPos } from '@/utils/coordinate';
import { ShapeType } from '@/types/whiteboard';

export const useAddWhiteboardItem = () => {
  // Canvas Store Actions
  const addText = useCanvasStore((state) => state.addText);
  const addArrow = useCanvasStore((state) => state.addArrow);
  const addShape = useCanvasStore((state) => state.addShape);
  const addImage = useCanvasStore((state) => state.addImage);

  // Canvas Store States
  const selectItem = useCanvasStore((state) => state.selectItem);
  const stagePos = useCanvasStore((state) => state.stagePos);
  const stageScale = useCanvasStore((state) => state.stageScale);

  // Text Item 추가 핸들러
  const handleAddText = () => {
    const worldPos = getCenterWorldPos(stagePos, stageScale);
    const textId = addText({ x: worldPos.x, y: worldPos.y });
    selectItem(textId);
  };

  // Arrow Item 추가 핸들러
  const handleAddArrow = () => {
    const worldPos = getCenterWorldPos(stagePos, stageScale);
    addArrow({
      points: [worldPos.x - 100, worldPos.y, worldPos.x + 100, worldPos.y],
    });
  };

  // Shape Item 추가 핸들러
  const handleAddShape = (type: ShapeType) => {
    const worldPos = getCenterWorldPos(stagePos, stageScale);

    const width = 100;
    const height = 100;

    addShape(type, {
      x: worldPos.x - width / 2,
      y: worldPos.y - height / 2,
      width,
      height,
    });
  };

  // Image Item 추가 핸들러
  const handleAddImage = () => {
    // 파일 선택창 설정
    // input 태그 설정, 타입은 파일 업로드용 , 이미지 파일만 선택되도록 설정
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';

    // 파일 선택 후 처리 로직(파일 읽기)
    input.onchange = (e) => {
      // 선택한 파일 선정
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      // 파일 읽기
      const reader = new FileReader();
      // 파일 읽기 완료 후 실행
      reader.onload = (readerEvent) => {
        const src = readerEvent.target?.result as string;

        // src를 이용한 이미지 객체 생성
        const img = new Image();
        img.src = src;

        // 이미지 로딩 후 크기 확인 후 로직
        img.onload = () => {
          // 원본 이미지 크기 읽기
          let w = img.width;
          let h = img.height;

          // 제한 크기 설정
          const MAX_SIZE = 500;

          // 이미지 제한 로직
          if (w > MAX_SIZE || h > MAX_SIZE) {
            // 가로 세로 비율 유지하며 크기 조정
            const ratio = w / h;
            if (w > h) {
              w = MAX_SIZE;
              h = MAX_SIZE / ratio;
            } else {
              h = MAX_SIZE;
              w = MAX_SIZE * ratio;
            }
          }

          // store 저장
          addImage({
            src,
            width: w,
            height: h,
          });
        };
      };
      // Base64 형식으로 파일 읽기
      // Base 64 : 별도 서버 업로드 과정 없이 src로 바로 사용
      reader.readAsDataURL(file);
    };

    // 파일 탐색기 열기
    input.click();
  };

  return {
    handleAddText,
    handleAddArrow,
    handleAddShape,
    handleAddImage,
  };
};
