'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { UserLog } from '@/lib/types';
import { getLogsFromFirestore } from '@/lib/firestore';
import { getErrorMessage, showErrorNotification } from '@/lib/errorHandler';
import { getThumbnailUrl, getMediumUrl } from '@/lib/cloudinary';
import styles from './album.module.css';

export default function AlbumPage() {
    const router = useRouter();
    const [userId, setUserId] = useState<string | null>(null);
    const [logs, setLogs] = useState<UserLog[]>([]);
    const [selectedLog, setSelectedLog] = useState<UserLog | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // ユーザーIDチェック
        const storedUserId = localStorage.getItem('sanposhin_userId');
        if (!storedUserId) {
            router.push('/setup');
            return;
        }
        setUserId(storedUserId);

        // Firestore からログ取得（SSOT）
        const fetchLogs = async () => {
            setIsLoading(true);
            try {
                const firestoreLogs = await getLogsFromFirestore(storedUserId);

                // 新しい順にソート
                const sortedLogs = firestoreLogs.sort((a, b) => {
                    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
                });

                setLogs(sortedLogs);

                // localStorage にもキャッシュ（オフライン対応）
                try {
                    localStorage.setItem('sanposhin_logs', JSON.stringify(sortedLogs));
                } catch (storageError) {
                    console.warn('localStorage へのキャッシュに失敗しました:', storageError);
                }
            } catch (error) {
                console.error('ログの取得に失敗しました:', error);
                const message = getErrorMessage(error);
                showErrorNotification(`ログの読み込みに失敗しました: ${message}`);

                // オフライン時は localStorage からフォールバック
                try {
                    const logsString = localStorage.getItem('sanposhin_logs') || '[]';
                    const cachedLogs: UserLog[] = JSON.parse(logsString);
                    const sortedLogs = cachedLogs.sort((a, b) => {
                        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
                    });
                    setLogs(sortedLogs);
                } catch (cacheError) {
                    console.error('キャッシュからの読み込みにも失敗しました:', cacheError);
                }
            } finally {
                setIsLoading(false);
            }
        };

        fetchLogs();
    }, [router]);

    const formatDate = (dateString: string | Date) => {
        const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
        return `${date.getFullYear()}/${String(date.getMonth() + 1).padStart(2, '0')}/${String(date.getDate()).padStart(2, '0')}`;
    };

    const formatTime = (dateString: string | Date) => {
        const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
        return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
    };

    if (!userId || isLoading) {
        return (
            <div className={styles.container}>
                <div className={styles.loading}>読み込み中...</div>
            </div>
        );
    }

    if (logs.length === 0) {
        return (
            <div className={styles.container}>
                <main className={styles.main}>
                    <h1 className={styles.header}>冒険の書</h1>
                    <div className={styles.emptyState}>
                        <p className={styles.emptyMessage}>まだ冒険の記録がありません</p>
                        <button
                            onClick={() => router.push('/')}
                            className={styles.primaryButton}
                        >
                            お告げを受ける
                        </button>
                    </div>
                </main>
            </div>
        );
    }

    if (selectedLog) {
        return (
            <div className={styles.container}>
                <main className={styles.main}>
                    <button
                        onClick={() => setSelectedLog(null)}
                        className={styles.backButton}
                    >
                        ← 一覧に戻る
                    </button>

                    <div className={styles.detailCard}>
                        <div className={styles.detailDate}>
                            {formatDate(selectedLog.createdAt)} {formatTime(selectedLog.createdAt)}
                        </div>

                        {(selectedLog.imageUrl || selectedLog.imageData) && (
                            <div className={styles.detailImageContainer}>
                                <img
                                    src={
                                        selectedLog.imageUrl
                                            ? getMediumUrl(selectedLog.imageUrl)
                                            : selectedLog.imageData || ''
                                    }
                                    alt="冒険の写真"
                                    className={styles.detailImage}
                                />
                            </div>
                        )}

                        <div className={styles.detailMission}>
                            <span className={styles.detailLabel}>お告げ</span>
                            <p className={styles.detailMissionText}>{selectedLog.missionText}</p>
                        </div>

                        {selectedLog.location && (
                            <div className={styles.detailInfo}>
                                <span className={styles.detailLabel}>場所</span>
                                <p className={styles.detailText}>{selectedLog.location.name}</p>
                            </div>
                        )}

                        {selectedLog.memo && (
                            <div className={styles.detailInfo}>
                                <span className={styles.detailLabel}>メモ</span>
                                <p className={styles.detailText}>{selectedLog.memo}</p>
                            </div>
                        )}
                    </div>
                </main>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            <main className={styles.main}>
                <div className={styles.headerContainer}>
                    <h1 className={styles.header}>冒険の書</h1>
                    <button onClick={() => router.push('/')} className={styles.homeButton}>
                        ホーム
                    </button>
                </div>

                <div className={styles.stats}>
                    <p className={styles.statsText}>総冒険数: {logs.length}回</p>
                </div>

                <div className={styles.logList}>
                    {logs.map((log, index) => (
                        <div
                            key={index}
                            onClick={() => setSelectedLog(log)}
                            className={styles.logCard}
                        >
                            <div className={styles.logDate}>
                                {formatDate(log.createdAt)}
                            </div>

                            {(log.imageUrl || log.imageData) && (
                                <div className={styles.logImageContainer}>
                                    <img
                                        src={
                                            log.imageUrl
                                                ? getThumbnailUrl(log.imageUrl)
                                                : log.imageData || ''
                                        }
                                        alt="冒険の写真"
                                        className={styles.logImage}
                                    />
                                </div>
                            )}

                            <div className={styles.logContent}>
                                <p className={styles.logMission}>{log.missionText}</p>
                                {log.location && (
                                    <p className={styles.logLocation}>📍 {log.location.name}</p>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </main>
        </div>
    );
}
