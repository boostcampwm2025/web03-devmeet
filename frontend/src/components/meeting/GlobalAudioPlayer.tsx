'use client';

import AudioView from '@/components/meeting/media/AudioView'; // 스트림 기반 컴포넌트로 가정
import { useMeetingSocketStore } from '@/store/useMeetingSocketStore';
import { useMeetingStore } from '@/store/useMeetingStore';
import { ConsumerInfo } from '@/types/meeting';
import { getAudioConsumerIds, getConsumerInstances } from '@/utils/meeting';
import { useEffect, useRef } from 'react';

export const GlobalAudioPlayer = () => {
  const {
    memberProducers,
    memberStreams,
    setMemberStream,
    removeMemberStream,
  } = useMeetingStore();
  const { socket, recvTransport, device, addConsumers } =
    useMeetingSocketStore();

  const isInitialSynced = useRef(false);

  useEffect(() => {
    let isCancelled = false;

    if (!socket || !recvTransport || !device || isInitialSynced.current) return;

    const syncExistingAudio = async () => {
      if (!socket.connected) return;

      const currentConsumers = useMeetingSocketStore.getState().consumers;
      const { newAudioConsumers } = getAudioConsumerIds(
        memberProducers,
        currentConsumers,
      );

      if (newAudioConsumers.length === 0) return;

      try {
        const payload = {
          transport_id: recvTransport.id,
          producer_infos: newAudioConsumers.map((id) => ({
            producer_id: id,
            rtpCapabilities: device.rtpCapabilities,
            status: 'user',
          })),
        };

        const { consumerInfos }: { consumerInfos: ConsumerInfo[] } =
          await socket.emitWithAck('signaling:ws:consumes', payload);

        if (isCancelled) return;

        const newInstances = await getConsumerInstances(
          recvTransport,
          consumerInfos,
        );

        if (isCancelled) {
          newInstances.forEach((i) => i.consumer.close());
          return;
        }

        addConsumers(newInstances);

        newInstances.forEach(({ producerId, consumer }) => {
          const entry = Object.entries(memberProducers).find(
            ([, prod]) => prod.mic?.provider_id === producerId,
          );
          const userId = entry ? entry[0] : undefined;
          if (userId) {
            const isPaused = memberProducers[userId]?.mic?.is_paused;
            if (!isPaused) {
              setMemberStream(userId, 'mic', new MediaStream([consumer.track]));
            } else {
              removeMemberStream(userId, 'mic');
            }
          }
        });

        const newConsumerIds = newInstances.map((i) => i.consumer.id);
        socket.emit('signaling:ws:resumes', { consumer_ids: newConsumerIds });

        isInitialSynced.current = true;
      } catch (error) {
        // 단순 페이지 이탈 시 소켓 연결 해제로 인한 오류 표시 방지
        if (
          !isCancelled &&
          error instanceof Error &&
          error.message !== 'socket has been disconnected'
        ) {
          console.error('초기 오디오 동기화 실패:', error);
        }
      }
    };

    syncExistingAudio();

    return () => {
      isCancelled = true;
    };
  }, [memberProducers, socket, recvTransport, device]);

  return (
    <div id="remote-audio-container" style={{ display: 'none' }}>
      {Object.entries(memberStreams).map(([userId, streams]) => {
        if (!streams.mic) return null;

        return (
          <AudioView
            key={`${userId}-remote-audio`}
            stream={streams.mic}
            userId={userId}
          />
        );
      })}
    </div>
  );
};
