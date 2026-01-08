import { DownloadIcon, FileIcon } from '@/assets/icons/meeting';
import { formatFileSize, formatTimestamp } from '@/utils/formatter';
import Image from 'next/image';

type TextChat = {
  type: 'TEXT';
  text: string;
};

type ImageChat = {
  type: 'IMAGE';
  src: string;
};

type FileChat = {
  type: 'FILE';
  fileName: string;
  size: number;
};

type ChatContent = TextChat | ImageChat | FileChat;

interface ChatListItemProps {
  id: string;
  name: string;
  profileImg: string;
  createdAt: string;
  content: ChatContent;
}

export default function ChatListItem({
  name,
  profileImg,
  createdAt,
  content,
}: ChatListItemProps) {
  return (
    <div className="flex w-full gap-3 p-4">
      <Image
        width={32}
        height={32}
        className="h-8 w-8 rounded-full"
        src={profileImg}
        alt={`${name}님의 프로필 사진`}
      />

      <section className="flex flex-col gap-2">
        {/* 댓글 정보 */}
        <div className="flex items-end gap-2">
          <span className="text-sm font-bold text-neutral-200">{name}</span>
          <span className="text-[10px] font-bold text-neutral-400">
            {formatTimestamp(createdAt)}
          </span>
        </div>

        {/* 댓글 내용 */}
        {content.type === 'TEXT' && (
          <span className="rounded-sm bg-neutral-600 p-2 text-sm text-neutral-50">
            {content.text}
          </span>
        )}
        {content.type === 'IMAGE' && (
          <span className="rounded-sm bg-neutral-600 p-2">
            <Image
              width={200}
              height={200}
              className="max-h-50 w-auto object-cover"
              src={content.src}
              alt="채팅 이미지"
            />
          </span>
        )}
        {content.type === 'FILE' && (
          <button className="group flex items-center gap-4 rounded-sm bg-neutral-600 px-3 py-2">
            <div className="flex items-center gap-3">
              <FileIcon className="h-6 w-6 text-neutral-50" />
              <div className="flex flex-1 flex-col items-start gap-1">
                <span className="text-left text-sm font-bold break-all whitespace-pre-wrap text-neutral-50">
                  {content.fileName}
                </span>
                <span className="text-xs text-neutral-300">
                  {formatFileSize(content.size)}
                </span>
              </div>
            </div>
            <i className="rounded-full p-1 group-hover:bg-neutral-500">
              <DownloadIcon className="h-6 w-6 text-neutral-50" />
            </i>
          </button>
        )}
      </section>
    </div>
  );
}
