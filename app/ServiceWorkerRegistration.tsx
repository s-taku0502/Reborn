'use client';

import { useEffect } from 'react';
import { registerServiceWorker, setupOfflineIndicator } from '@/lib/serviceWorker';

export default function ServiceWorkerRegistration() {
    useEffect(() => {
        // Service Worker を登録
        registerServiceWorker();

        // オフライン検出をセットアップ
        const cleanup = setupOfflineIndicator();

        return cleanup;
    }, []);

    return null;
}
