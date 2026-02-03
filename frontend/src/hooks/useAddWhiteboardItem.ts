import { useWhiteboardLocalStore } from '@/store/useWhiteboardLocalStore';
import { useItemActions } from '@/hooks/useItemActions';
import { getCenterWorldPos } from '@/utils/coordinate';
import { ShapeType } from '@/types/whiteboard';
import { StackIconInfo } from '@/constants/stackList';

export const useAddWhiteboardItem = () => {
  const { addText, addArrow, addLine, addShape, addImage, addStack } =
    useItemActions();

  const getCanvasPointFromEvent = (clientX: number, clientY: number) => {
    const stage = useWhiteboardLocalStore.getState().stageRef?.current;
    if (!stage) return null;

    const transform = stage.getAbsoluteTransform().copy().invert();
    return transform.point({ x: clientX, y: clientY });
  };

  const getViewportCenter = () => {
    const stageRef = useWhiteboardLocalStore.getState().stageRef;
    const stage = stageRef?.current;

    if (!stage) {
      const { stagePos, stageScale, viewportWidth, viewportHeight } =
        useWhiteboardLocalStore.getState();
      return getCenterWorldPos(
        stagePos,
        stageScale,
        viewportWidth,
        viewportHeight,
      );
    }

    const stagePos = stage.position();
    const stageScale = stage.scaleX();
    const { viewportWidth, viewportHeight } =
      useWhiteboardLocalStore.getState();

    return getCenterWorldPos(
      stagePos,
      stageScale,
      viewportWidth,
      viewportHeight,
    );
  };

  // Text Item 추가 핸들러
  const handleAddText = () => {
    const worldPos = getViewportCenter();

    const defaultWidth = 200;
    const defaultFontSize = 32;

    addText({
      x: worldPos.x - defaultWidth / 2,
      y: worldPos.y - defaultFontSize / 2,
    });
  };

  // Arrow Item 추가 핸들러
  const handleAddArrow = () => {
    const worldPos = getViewportCenter();
    addArrow({
      points: [worldPos.x - 100, worldPos.y, worldPos.x + 100, worldPos.y],
    });
  };

  // Line Item 추가 핸들러
  const handleAddLine = () => {
    const worldPos = getViewportCenter();
    addLine({
      points: [worldPos.x - 100, worldPos.y, worldPos.x + 100, worldPos.y],
    });
  };

  // Shape Item 추가 핸들러
  const handleAddShape = (type: ShapeType) => {
    const worldPos = getViewportCenter();

    const width = 100;
    const height = 100;

    addShape(type, {
      x: worldPos.x - width / 2,
      y: worldPos.y - height / 2,
      width,
      height,
    });
  };

  // Image 파일 처리 함수
  const processImageFile = (
    file: File,
    position?: { x: number; y: number },
  ) => {
    // 형식 체크
    if (file.type === 'image/gif') {
      alert('GIF 파일은 업로드할 수 없습니다.');
      // 로직 즉시 종료
      return;
    }

    // 용량 체크 FileReader 시작 전에 차단
    const MAX_FILE_SIZE = 7 * 1024 * 1024; // 7MB
    if (file.size > MAX_FILE_SIZE) {
      alert(
        `이미지 용량이 너무 큽니다. (최대 7MB, 현재: ${(file.size / (1024 * 1024)).toFixed(2)}MB)`,
      );
      return;
    }

    // 검증을 통과한 경우에만 메모리 로드 시작
    const reader = new FileReader();

    reader.onerror = () => {
      alert('파일을 읽는 중 오류가 발생했습니다.');
    };

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

        // 이미지 크기 제한 및 비율 조정
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

        // 좌표가 전달되지 않았다면 중앙 좌표 계산
        const finalPos = position || {
          x: getViewportCenter().x - w / 2,
          y: getViewportCenter().y - h / 2,
        };

        addImage({
          src,
          width: w,
          height: h,
          ...finalPos,
        });
      };

      img.onerror = () => {
        alert('이미지 객체를 생성할 수 없습니다.');
      };
    };

    // 검증 완료 후 읽기 시작
    reader.readAsDataURL(file);
  };

  // Image Item 추가 핸들러
  const handleAddImage = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';

    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) processImageFile(file);
    };

    input.click();
  };

  // Stack Item 추가 핸들러
  const handleAddStack = (icon: StackIconInfo) => {
    const worldPos = getViewportCenter();
    const width = 240;
    const height = 240;

    addStack({
      src: icon.src,
      stackName: icon.name,
      category: icon.category,
      x: worldPos.x - width / 2,
      y: worldPos.y - height / 2,
      width,
      height,
    });
  };

  return {
    handleAddText,
    handleAddArrow,
    handleAddLine,
    handleAddShape,
    handleAddImage,
    handleAddStack,
    processImageFile,
    getCanvasPointFromEvent,
  };
};
