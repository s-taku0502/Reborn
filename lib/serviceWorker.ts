// Service Worker 登録ユーティリティ
// app/layout.tsx や各ページから呼び出す

export function registerServiceWorker() {
    if (typeof window === 'undefined') return;
    if (!('serviceWorker' in navigator)) {
        console.warn('Service Worker is not supported in this browser.');
        return;
    }

    window.addEventListener('load', async () => {
        try {
            const registration = await navigator.serviceWorker.register('/sw.js', {
                scope: '/',
            });

            console.log('Service Worker registered successfully:', registration.scope);

            // 更新チェック
            registration.addEventListener('updatefound', () => {
                const newWorker = registration.installing;
                if (newWorker) {
                    newWorker.addEventListener('statechange', () => {
                        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                            // 新しい Service Worker が利用可能
                            console.log('New Service Worker available. Please refresh the page.');
                        }
                    });
                }
            });
        } catch (error) {
            console.error('Service Worker registration failed:', error);
        }
    });
}

// Background Sync の登録（オフライン時のログ同期）
export async function registerBackgroundSync() {
    if (!('serviceWorker' in navigator)) {
        console.warn('Background Sync is not supported.');
        return;
    }

    try {
        const registration = await navigator.serviceWorker.ready;
        // @ts-ignore - Background Sync API は実験的機能
        if ('sync' in registration) {
            // @ts-ignore
            await registration.sync.register('sync-logs');
            console.log('Background sync registered for logs');
        }
    } catch (error) {
        console.error('Background sync registration failed:', error);
    }
}

// オフライン状態の検出とUI更新
export function setupOfflineIndicator() {
    if (typeof window === 'undefined') return;

    const updateOnlineStatus = () => {
        if (navigator.onLine) {
            console.log('App is online');
            // オンライン復帰時に自動同期をトリガー
            registerBackgroundSync();
        } else {
            console.log('App is offline');
        }
    };

    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);

    // 初期状態をチェック
    updateOnlineStatus();

    // クリーンアップ関数を返す
    return () => {
        window.removeEventListener('online', updateOnlineStatus);
        window.removeEventListener('offline', updateOnlineStatus);
    };
}
