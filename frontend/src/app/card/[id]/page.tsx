import { DUMMY_CARD, DUMMY_USER } from '@/app/card/[id]/dummy';
import FollowBtn from '@/components/card/FollowBtn';
import LikeBtn from '@/components/card/LikeBtn';
import ToggleReactionBtn from '@/components/card/ToggleReactionBtn';
import Image from 'next/image';
import Link from 'next/link';

export default function CardDetailPage() {
  const { user_id, nickname, profile_path } = DUMMY_USER;
  const cardData = DUMMY_CARD;
  const cardId = cardData.id;

  return (
    <main className="flex min-h-screen w-full justify-center bg-white">
      <div className="flex w-full max-w-300 flex-col gap-12 px-6 py-4">
        <section className="flex flex-col gap-4">
          <div className="flex items-center gap-4">
            <Link
              href={`/user/${user_id}`}
              className="group flex items-center gap-2"
            >
              <Image
                src={profile_path}
                width={32}
                height={32}
                alt={`${nickname}의 프로필 사진`}
                className="h-8 w-8 overflow-hidden rounded-full object-cover"
              />
              <span className="text-sm font-semibold text-neutral-900 group-hover:underline">
                {nickname}
              </span>
            </Link>
            <FollowBtn cardId={cardId} hasFollowed={false} />
          </div>

          <article className="aspect-12/7 w-full rounded-2xl bg-neutral-100 p-4"></article>

          <div className="flex w-full items-center justify-between">
            <LikeBtn cardId={cardId} hasLiked={false} likeCount={0} />
            <ToggleReactionBtn />
          </div>
        </section>

        <section></section>
      </div>
    </main>
  );
}
