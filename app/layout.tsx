import type { Metadata, Viewport } from 'next';
import './globals.css';
import ServiceWorkerRegistration from './ServiceWorkerRegistration';

export const metadata: Metadata = {
    title: '散歩神 - Sanposhin Reborn',
    description: '日常の散歩を、神のお告げ（ミッション）によって非日常の冒険に変えるロケーションベースドPWA',
    manifest: '/manifest.json',
    appleWebApp: {
        capable: true,
        statusBarStyle: 'default',
        title: '散歩神',
    },
};

export const viewport: Viewport = {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
    themeColor: '#4CAF50',
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="ja">
            <body>
                <ServiceWorkerRegistration />
                {children}
            </body>
        </html>
    );
}
