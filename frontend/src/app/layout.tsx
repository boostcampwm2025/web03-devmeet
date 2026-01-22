import type { Metadata } from 'next';
import localFont from 'next/font/local';
import './globals.css';

const suit = localFont({
  src: '../assets/fonts/SUIT-Variable.woff2',
  display: 'swap',
  variable: '--font-suit',
  weight: '100 900',
});

const roboto = localFont({
  src: '../assets/fonts/Roboto-Medium.ttf',
  display: 'swap',
  variable: '--font-roboto',
  weight: '500',
  style: 'normal',
});

export const metadata: Metadata = {
  title: 'DEVMEET',
  description: '코드 에디터 화상통화',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className={`${suit.variable} ${roboto.variable} antialiased`}>
        {children}

        <div id="modal-root" />
      </body>
    </html>
  );
}
