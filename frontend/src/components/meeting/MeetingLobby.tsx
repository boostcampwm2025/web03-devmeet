import Button from '../common/button';
import Header from '@/components/layout/Header';
import MediaSettingSection from '@/components/meeting/media/MediaSettingSection';
import TempMeetingLobby from '@/components/meeting/TempMeetingLobby';
import { useSocketStore } from '@/store/useSocketStore';

export default function MeetingLobby({
  meetingId,
  onJoin,
}: {
  meetingId: string;
  onJoin: () => void;
}) {
  const meetingLeader = 'Tony';
  const meetingMemberCnt = 9;

  const { socket } = useSocketStore();

  return (
    // <TempMeetingLobby />
    <main className="box-border flex min-h-screen items-center justify-center gap-20 px-6 py-4">
      <Header />

      {/* 영상, 마이크 설정 부분 */}
      <MediaSettingSection />

      {/* 회의 참여 부분 */}
      <section className="flex w-full max-w-60 flex-col items-center justify-center">
        <h1 className="mb-2 text-2xl text-neutral-900">
          <b>{meetingLeader}</b> 님의 회의실
        </h1>
        <span className="text-base text-neutral-600">
          현재 참여자: {meetingMemberCnt}명
        </span>

        <Button className="mt-6" onClick={onJoin} disabled={!socket}>
          {socket ? '회의 참여하기' : '연결 준비 중...'}
        </Button>
      </section>
    </main>
  );
}
