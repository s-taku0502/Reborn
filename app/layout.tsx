import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Sanposhin Reborn',
  description: 'Welcome to Sanposhin Reborn',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
