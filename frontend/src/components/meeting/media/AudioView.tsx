import { useVoiceActivity } from '@/hooks/useVoiceActivity';
import { useMeetingStore } from '@/store/useMeetingStore';
import { useEffect, useRef } from 'react';

export default function AudioView({
  stream,
  userId,
}: {
  stream: MediaStream;
  userId: string;
}) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const isSpeaking = useVoiceActivity(stream);
  const { media, setSpeaking } = useMeetingStore();

  useEffect(() => {
    if (audioRef.current && stream) {
      audioRef.current.srcObject = stream;
    }
  }, [stream]);

  useEffect(() => {
    const audioEl = audioRef.current;
    if (!audioEl) return;

    // 스피커 장치 변경
    if ('setSinkId' in HTMLAudioElement.prototype) {
      audioEl.setSinkId(media.speakerId);
    }
  }, [media.speakerId, userId]);

  useEffect(() => {
    setSpeaking(userId, isSpeaking);
    return () => setSpeaking(userId, false);
  }, [isSpeaking, userId, setSpeaking]);

  return <audio ref={audioRef} autoPlay playsInline muted={false} />;
}
