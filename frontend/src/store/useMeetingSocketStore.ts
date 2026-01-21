import {
  IsProducing,
  MediasoupTransports,
  MemberConsumer,
  Producers,
} from '@/types/meeting';
import { initSendTransport } from '@/utils/initSendTransport';
import { Device } from 'mediasoup-client';
import {
  Consumer,
  MediaKind,
  Producer,
  Transport,
} from 'mediasoup-client/types';
import { Socket } from 'socket.io-client';
import { create } from 'zustand';

interface MeetingSocketState {
  socket: Socket | null;
  device: Device | null;
  sendTransport: Transport | null;
  recvTransport: Transport | null;
  producers: Producers;
  isProducing: IsProducing;
  consumers: Record<string, MemberConsumer>;
}

interface MeetingSocketAction {
  setSocket: (socket: Socket | null) => void;

  setMediasoupTransports: (
    socket: Socket,
    transports: MediasoupTransports,
  ) => void;

  setProducer: (type: keyof Producers, producer: Producer | null) => void;
  setIsProducing: (type: keyof IsProducing, state: boolean) => void;

  addConsumer: (userId: string, kind: MediaKind, consumer: Consumer) => void;
  removeConsumer: (userId: string) => void;
}

export const useMeetingSocketStore = create<
  MeetingSocketState & MeetingSocketAction
>((set) => ({
  socket: null,
  device: null,
  sendTransport: null,
  recvTransport: null,

  producers: {
    audioProducer: null,
    videoProducer: null,
    screenAudioProducer: null,
    screenVideoProducer: null,
  },

  isProducing: { audio: false, video: false, screen: false },

  consumers: {},

  setSocket: (socket) => set({ socket }),
  setMediasoupTransports: (socket, transports) => {
    initSendTransport(socket, transports.sendTransport);
    set({ ...transports });
  },
  setProducer: (type, producer) =>
    set((prev) => ({ producers: { ...prev.producers, [type]: producer } })),
  setIsProducing: (type, state) =>
    set((prev) => ({ isProducing: { ...prev.isProducing, [type]: state } })),

  addConsumer: (userId, kind, consumer) =>
    set((prev) => ({
      consumers: {
        ...prev.consumers,
        [userId]: {
          ...prev.consumers[userId],
          [kind]: consumer,
        },
      },
    })),
  removeConsumer: (userId) =>
    set((prev) => {
      const targetMember = prev.consumers[userId];

      if (targetMember) {
        targetMember.audio?.close();
        targetMember.video?.close();
      }

      const { [userId]: _, ...remainingConsumers } = prev.consumers;

      return {
        consumers: remainingConsumers,
      };
    }),
}));
