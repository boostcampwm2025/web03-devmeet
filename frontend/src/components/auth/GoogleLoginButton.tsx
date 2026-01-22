import Image from 'next/image';
import Link from 'next/link';
import googleLogo from '@/assets/auth/googleLogo.png';

export default function GoogleLoginButton() {
  return (
    <Link
      href="/google"
      className="flex h-11.25 w-full items-center justify-center gap-3 rounded-md border border-[#747775] px-4"
    >
      <Image
        width={20}
        height={20}
        className="h-5 w-5 shrink-0"
        src={googleLogo}
        alt="구글 로그인 아이콘"
      />
      <span className="google-font">Google 계정으로 로그인</span>
    </Link>
  );
}
