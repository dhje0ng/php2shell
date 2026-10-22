import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'PHP2Shell Check — 내 웹사이트의 PHP 보안 점검',
  description: '공개 HTTP 헤더와 PHP 버전을 확인하고 PHP2Shell 취약 가능성과 대응 방법을 안내합니다.',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="ko"><body>{children}</body></html>;
}
