// utils/noiseSuppressor.ts
type RnnoiseWorkletNodeType =
  import('@sapphi-red/web-noise-suppressor').RnnoiseWorkletNode;

let audioContext: AudioContext | null = null;
let rnnoiseNode: RnnoiseWorkletNodeType | null = null;
let wasmBinary: ArrayBuffer | null = null;
let isWorkletLoaded = false;

// WASM 바이너리 로드
const loadWasmBinary = async () => {
  if (wasmBinary) return wasmBinary;

  const { loadRnnoise } = await import('@sapphi-red/web-noise-suppressor');

  wasmBinary = await loadRnnoise({
    url: '/wasm/rnnoise.wasm',
    simdUrl: '/wasm/rnnoise_simd.wasm',
  });

  return wasmBinary;
};

// AudioWorklet 모듈 로드
const loadWorkletModule = async (context: AudioContext) => {
  if (isWorkletLoaded) return;

  await context.audioWorklet.addModule('/wasm/workletProcessor.js');

  isWorkletLoaded = true;
};

export const processAudioTrack = async (track: MediaStreamTrack) => {
  // 브라우저 환경 체크
  if (typeof window === 'undefined') return track;

  try {
    // AudioContext 생성
    if (!audioContext) {
      audioContext = new AudioContext({ sampleRate: 48000 });
    }

    // 브라우저 정책 대응: Context 재개
    if (audioContext.state === 'suspended') {
      await audioContext.resume();
    }

    // Worklet 모듈, WASM 로드
    const [binary] = await Promise.all([
      loadWasmBinary(),
      loadWorkletModule(audioContext),
    ]);

    // Dynamic import로 RnnoiseWorkletNode 가져오기
    const { RnnoiseWorkletNode } =
      await import('@sapphi-red/web-noise-suppressor');

    // RNNoise 노드 생성
    const source = audioContext.createMediaStreamSource(
      new MediaStream([track]),
    );

    rnnoiseNode = new RnnoiseWorkletNode(audioContext, {
      maxChannels: 1,
      wasmBinary: binary,
    });

    const destination = audioContext.createMediaStreamDestination();

    // 오디오 그래프 연결
    source.connect(rnnoiseNode);
    rnnoiseNode.connect(destination);

    return destination.stream.getAudioTracks()[0];
  } catch (error) {
    console.error('노이즈 제거 적용 실패, 원본 트랙을 반환합니다:', error);
    return track;
  }
};

export const stopNoiseSuppressor = () => {
  if (rnnoiseNode) {
    rnnoiseNode.destroy();
    rnnoiseNode = null;
  }

  if (audioContext && audioContext.state !== 'closed') {
    audioContext.close();
    audioContext = null;
  }

  isWorkletLoaded = false;
};
