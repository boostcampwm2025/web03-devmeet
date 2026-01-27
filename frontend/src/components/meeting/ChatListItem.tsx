import { DownloadIcon, FileIcon } from '@/assets/icons/meeting';
import { ChatMessage } from '@/types/chat';
import { formatFileSize, formatTimestamp } from '@/utils/formatter';
import Image from 'next/image';
import { memo } from 'react';

export function ChatListItem({
  nickname,
  profileImg,
  createdAt,
  content,
}: ChatMessage) {
  return (
    <div className="flex w-full gap-3 p-4">
      {profileImg ? (
        <Image
          width={32}
          height={32}
          className="h-8 w-8 rounded-full"
          src={profileImg}
          alt={`${nickname}님의 프로필 사진`}
        />
      ) : (
        <div className="flex-center aspect-square h-8 w-8 rounded-full bg-neutral-500 text-sm font-bold text-neutral-50">
          {nickname[0]}
        </div>
      )}

      <section className="flex flex-col gap-2">
        {/* 댓글 정보 */}
        <div className="flex items-end gap-2">
          <span className="text-sm font-bold text-neutral-200">{nickname}</span>
          <span className="text-[10px] font-bold text-neutral-400">
            {formatTimestamp(createdAt)}
          </span>
        </div>

        {/* 댓글 내용 */}
        {content.type === 'text' && (
          <span className="rounded-sm bg-neutral-600 p-2 text-sm break-all whitespace-pre-wrap text-neutral-50">
            {content.text}
          </span>
        )}

        {content.type === 'image' && (
          <span className="rounded-sm bg-neutral-600 p-2">
            <Image
              width={200}
              height={200}
              className="max-h-50 w-auto object-cover"
              src={content.src as string}
              alt="채팅 이미지"
            />
          </span>
        )}

        {content.type === 'file' && (
          <div className="group flex items-center gap-4 rounded-sm bg-neutral-600 px-3 py-2">
            <a
              href={content.fileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex flex-1 items-center gap-3"
              download
            >
              <FileIcon className="h-6 w-6 text-neutral-50" />

              <div className="flex flex-1 flex-col items-start gap-1">
                <span className="text-left text-sm font-bold break-all whitespace-pre-wrap text-neutral-50">
                  {content.filename}
                </span>
                <span className="text-xs text-neutral-300">
                  {formatFileSize(content.size)}
                </span>
              </div>
            </a>

            <button
              type="button"
              aria-label="파일 다운로드"
              className="rounded-full p-1 group-hover:bg-neutral-500"
            >
              <DownloadIcon className="h-6 w-6 text-neutral-50" />
            </button>
          </div>
        )}
      </section>
    </div>
  );
}

export default memo(ChatListItem);
