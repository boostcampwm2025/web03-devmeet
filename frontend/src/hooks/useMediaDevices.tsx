'use client';

import { useEffect, useState } from 'react';

export type DeviceKind = 'audioinput' | 'audiooutput' | 'videoinput';

export const useMediaDevices = () => {
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);

  const [speakerId, setSpeakerId] = useState<string>('');
  const [micId, setMicId] = useState<string>('');
  const [cameraId, setCameraId] = useState<string>('');

  useEffect(() => {
    const init = async () => {
      const list = await navigator.mediaDevices.enumerateDevices();

      // 버튼 disabled를 위해 빈 라벨 필터링
      const validDevices = list.filter((d) => d.label !== '');
      setDevices(validDevices);

      const mic = list.find((d) => d.kind === 'audioinput');
      const cam = list.find((d) => d.kind === 'videoinput');
      const speaker = list.find((d) => d.kind === 'audiooutput');

      if (mic) setMicId(mic.deviceId);
      if (cam) setCameraId(cam.deviceId);
      if (speaker) setSpeakerId(speaker.deviceId);
    };

    init();
  }, []);

  const byKind = (kind: DeviceKind) => devices.filter((d) => d.kind === kind);

  return {
    microphones: byKind('audioinput'),
    cameras: byKind('videoinput'),
    speakers: byKind('audiooutput'),

    micId,
    cameraId,
    speakerId,

    setMicId,
    setCameraId,
    setSpeakerId,
  };
};
