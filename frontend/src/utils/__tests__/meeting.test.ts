import { Consumer } from 'mediasoup-client/types';
import { MeetingMemberInfo, MemberProviderInfo } from '@/types/meeting';
import {
  getAudioConsumerIds,
  getMembersPerPage,
  getVideoConsumerIds,
  MemberProducers,
  reorderMembers,
} from '@/utils/meeting';

describe('getMembersPerPage', () => {
  it('width 경계값 기준으로 올바른 값을 반환한다', () => {
    expect(getMembersPerPage(479)).toBe(1);
    expect(getMembersPerPage(480)).toBe(2);

    expect(getMembersPerPage(639)).toBe(2);
    expect(getMembersPerPage(640)).toBe(3);

    expect(getMembersPerPage(799)).toBe(3);
    expect(getMembersPerPage(800)).toBe(4);

    expect(getMembersPerPage(1023)).toBe(4);
    expect(getMembersPerPage(1024)).toBe(5);

    expect(getMembersPerPage(1279)).toBe(5);
    expect(getMembersPerPage(1280)).toBe(6);
  });
});

describe('reorderMembers', () => {
  it('발언자가 없으면 순서를 유지한다', () => {
    const result = reorderMembers({
      orderedIds: ['a', 'b', 'c'],
      pinnedIds: [],
      speakingUserId: null,
      visibleCount: 2,
    });

    expect(result).toEqual(['a', 'b', 'c']);
  });

  it('pinned 멤버는 항상 앞에 유지된다', () => {
    const result = reorderMembers({
      orderedIds: ['a', 'b', 'c', 'd'],
      pinnedIds: ['b'],
      speakingUserId: 'd',
      visibleCount: 2,
    });

    expect(result[0]).toBe('b');
  });

  it('발언자가 visible 밖에 있으면 앞으로 이동한다', () => {
    const result = reorderMembers({
      orderedIds: ['a', 'b', 'c', 'd', 'e'],
      pinnedIds: [],
      speakingUserId: 'e',
      visibleCount: 3,
    });

    expect(result[0]).toBe('e');
  });

  it('발언자가 이미 visible이면 순서를 유지한다', () => {
    const result = reorderMembers({
      orderedIds: ['a', 'b', 'c'],
      pinnedIds: [],
      speakingUserId: 'b',
      visibleCount: 3,
    });

    expect(result).toEqual(['a', 'b', 'c']);
  });
});

describe('getVideoConsumerIds', () => {
  const visible = (id: string): MeetingMemberInfo =>
    ({ user_id: id }) as MeetingMemberInfo;
  const producersFor = (
    id: string,
    camId?: string,
  ): Record<string, MemberProducers> => {
    const entry: Record<string, MemberProviderInfo> = {};
    if (camId) {
      entry.cam = {
        provider_id: camId,
        kind: 'video',
        type: 'cam',
        is_paused: false,
      };
    }
    return { [id]: entry };
  };

  const consumer = (id: string): Consumer =>
    ({
      id,
      track: {} as MediaStreamTrack,
    }) as Consumer;

  it('visible 멤버 중 consumer가 없으면 newVideoConsumers에 포함된다', () => {
    const result = getVideoConsumerIds(
      producersFor('a', 'cam-a'),
      [visible('a')],
      {},
    );

    expect(result.newVideoConsumers).toEqual(['cam-a']);
  });

  it('visible 멤버의 consumer는 resume 대상이 된다', () => {
    const result = getVideoConsumerIds(
      producersFor('a', 'cam-a'),
      [visible('a')],
      {
        'cam-a': consumer('consumer-a'),
      },
    );

    expect(result.resumeConsumerIds).toEqual(['consumer-a']);
    expect(result.visibleStreamTracks.length).toBe(1);
  });

  it('hidden 멤버의 consumer는 pause 대상이 된다', () => {
    const result = getVideoConsumerIds(producersFor('a', 'cam-a'), [], {
      'cam-a': consumer('consumer-a'),
    });

    expect(result.pauseConsumerIds).toEqual(['consumer-a']);
    expect(result.hiddenUserIds).toEqual(['a']);
  });
});

describe('getAudioConsumerIds', () => {
  const producersFor = (
    id: string,
    micId?: string,
  ): Record<string, MemberProducers> => {
    const entry: Record<string, MemberProviderInfo> = {};
    if (micId) {
      entry.mic = {
        provider_id: micId,
        kind: 'audio',
        type: 'mic',
        is_paused: false,
      };
    }
    return { [id]: entry };
  };

  it('consumer가 없는 mic만 newAudioConsumers에 포함된다', () => {
    const result = getAudioConsumerIds(
      {
        ...producersFor('a', 'mic-a'),
        ...producersFor('b', 'mic-b'),
      },
      {
        'mic-b': {} as Consumer,
      },
    );

    expect(result.newAudioConsumers).toEqual(['mic-a']);
  });
});
