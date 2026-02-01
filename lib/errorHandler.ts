/**
 * エラーハンドリング統一ユーティリティ
 * requirements_definition.md §9 に基づく
 */

/**
 * エラーからユーザー向けメッセージを生成
 * @param error - キャッチしたエラー
 * @returns ユーザー向けエラーメッセージ
 */
export function getErrorMessage(error: unknown): string {
    // オフライン状態チェック
    if (typeof window !== 'undefined' && !navigator.onLine) {
        return 'オフラインです。インターネット接続を確認してください。';
    }

    if (error instanceof Error) {
        // ストレージ容量不足
        if (error.name === 'QuotaExceededError') {
            return 'ストレージ容量が不足しています。古いログを削除してください。';
        }

        // Firebase 認証エラー
        if (error.message.includes('auth') || error.message.includes('permission')) {
            return '認証エラーが発生しました。再ログインしてください。';
        }

        // ネットワークエラー
        if (error.message.includes('network') || error.message.includes('fetch')) {
            return 'ネットワークエラーが発生しました。接続を確認してください。';
        }

        // Firestore エラー
        if (error.message.includes('Firestore') || error.message.includes('Firebase')) {
            return 'サーバーに接続できません。しばらくしてから再度お試しください。';
        }

        // その他の Error インスタンス
        return error.message || '予期しないエラーが発生しました。';
    }

    // 不明なエラー
    return '予期しないエラーが発生しました。しばらくしてから再度お試しください。';
}

/**
 * オフライン検知のセットアップ
 * @param onOffline - オフライン時のコールバック
 * @param onOnline - オンライン復帰時のコールバック
 * @returns クリーンアップ関数
 */
export function setupOfflineDetection(
    onOffline: () => void,
    onOnline: () => void
): () => void {
    if (typeof window === 'undefined') {
        return () => { };
    }

    const handleOffline = () => {
        console.log('オフライン検知');
        onOffline();
    };

    const handleOnline = () => {
        console.log('オンライン復帰');
        onOnline();
    };

    window.addEventListener('offline', handleOffline);
    window.addEventListener('online', handleOnline);

    return () => {
        window.removeEventListener('offline', handleOffline);
        window.removeEventListener('online', handleOnline);
    };
}

/**
 * ストレージ容量チェック
 * @returns 容量が十分な場合true
 */
export async function checkStorageQuota(): Promise<boolean> {
    if (typeof navigator === 'undefined' || !navigator.storage || !navigator.storage.estimate) {
        return true; // API 未対応の場合は true を返す
    }

    try {
        const estimate = await navigator.storage.estimate();
        const usage = estimate.usage || 0;
        const quota = estimate.quota || 0;

        // 使用率が 90% 以上の場合は警告
        if (quota > 0 && usage / quota > 0.9) {
            console.warn(`Storage usage: ${(usage / quota * 100).toFixed(2)}%`);
            return false;
        }

        return true;
    } catch (error) {
        console.error('Storage quota check error:', error);
        return true; // エラー時は true を返す
    }
}

/**
 * 画像サイズチェック
 * @param file - チェックする画像ファイル
 * @param maxSizeMB - 最大サイズ（MB）デフォルト5MB
 * @returns エラーメッセージ、または null（サイズが適切な場合）
 */
export function checkImageSize(file: File, maxSizeMB: number = 5): string | null {
    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    if (file.size > maxSizeBytes) {
        return `画像サイズが大きすぎます。${maxSizeMB}MB以下にしてください。`;
    }
    return null;
}

/**
 * エラー通知表示（アラート）
 * @param message - 表示するメッセージ
 */
export function showErrorNotification(message: string): void {
    if (typeof window !== 'undefined') {
        alert(message);
    }
}

/**
 * 成功通知表示（アラート）
 * @param message - 表示するメッセージ
 */
export function showSuccessNotification(message: string): void {
    if (typeof window !== 'undefined') {
        alert(message);
    }
}
