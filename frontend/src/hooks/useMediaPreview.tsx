'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

export type MediaPermission = 'unknown' | 'granted' | 'denied';

export interface MediaState {
  videoOn: boolean;
  audioOn: boolean;
  cameraPermission: MediaPermission;
  micPermission: MediaPermission;
}

export const useMediaPreview = (micId?: string, cameraId?: string) => {
  const [media, setMedia] = useState<MediaState>({
    videoOn: false,
    audioOn: false,
    cameraPermission: 'unknown',
    micPermission: 'unknown',
  });

  const [stream, setStream] = useState<MediaStream | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // 초기 스트림 생성 로직
  useEffect(() => {
    let cancelled = false;

    (async () => {
      let audioTrack: MediaStreamTrack | null = null;
      let videoTrack: MediaStreamTrack | null = null;

      try {
        const audioStream = await navigator.mediaDevices.getUserMedia({
          audio: micId ? { deviceId: micId } : true,
          video: false,
        });
        audioTrack = audioStream.getAudioTracks()[0];

        if (cancelled) return;
        setMedia((prev) => ({
          ...prev,
          micPermission: 'granted',
          audioOn: true, // 초기화 시 켜짐
        }));
      } catch {
        if (cancelled) return;
        setMedia((prev) => ({
          ...prev,
          micPermission: 'denied',
          audioOn: false,
        }));
      }

      try {
        const videoStream = await navigator.mediaDevices.getUserMedia({
          audio: false,
          video: cameraId ? { deviceId: cameraId } : true,
        });
        videoTrack = videoStream.getVideoTracks()[0];

        if (cancelled) return;
        setMedia((prev) => ({
          ...prev,
          cameraPermission: 'granted',
          videoOn: true, // 초기화 시 켜짐
        }));
      } catch {
        if (cancelled) return;
        setMedia((prev) => ({
          ...prev,
          cameraPermission: 'denied',
          videoOn: false,
        }));
      }

      if (cancelled) return;

      // stream 합치기
      const tracks = [
        ...(audioTrack ? [audioTrack] : []),
        ...(videoTrack ? [videoTrack] : []),
      ];

      const combinedStream = new MediaStream(tracks);
      streamRef.current = combinedStream;
      setStream(combinedStream);
    })();

    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    };
  }, [micId, cameraId]);

  const toggleVideo = useCallback(async () => {
    if (!streamRef.current) return;

    if (media.videoOn) {
      // off시 트랙 중지 및 스트림에서 제거
      const videoTracks = streamRef.current.getVideoTracks();
      videoTracks.forEach((track) => {
        track.stop();
        streamRef.current?.removeTrack(track);
      });
      setMedia((prev) => ({ ...prev, videoOn: false }));
    } else {
      // on시 새로운 장치 스트림 요청
      try {
        const newStream = await navigator.mediaDevices.getUserMedia({
          video: cameraId ? { deviceId: cameraId } : true,
        });
        const newTrack = newStream.getVideoTracks()[0];

        streamRef.current.addTrack(newTrack);
        setMedia((prev) => ({ ...prev, videoOn: true }));
      } catch (error) {
        // TODO: 토스트 메시지로 바꾸기
        alert('카메라 권한을 허용해주세요.');
      }
    }
  }, [media.videoOn, cameraId]);

  const toggleAudio = useCallback(async () => {
    if (!streamRef.current) return;

    if (media.audioOn) {
      const audioTracks = streamRef.current.getAudioTracks();
      audioTracks.forEach((track) => {
        track.stop();
        streamRef.current?.removeTrack(track);
      });
      setMedia((prev) => ({ ...prev, audioOn: false }));
    } else {
      try {
        const newStream = await navigator.mediaDevices.getUserMedia({
          audio: micId ? { deviceId: micId } : true,
        });
        const newTrack = newStream.getAudioTracks()[0];

        streamRef.current.addTrack(newTrack);
        setMedia((prev) => ({ ...prev, audioOn: true }));
      } catch (error) {
        // TODO: 토스트 메시지로 바꾸기
        alert('마이크 권한을 허용해주세요.');
      }
    }
  }, [media.audioOn, micId]);

  const canRenderVideo = useMemo(() => {
    return (
      media.videoOn &&
      media.cameraPermission === 'granted' &&
      stream !== null &&
      stream.getVideoTracks().length > 0
    );
  }, [media.videoOn, media.cameraPermission, stream]);

  return {
    media,
    stream,
    canRenderVideo,
    toggleVideo,
    toggleAudio,
  };
};
