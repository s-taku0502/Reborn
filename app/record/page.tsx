'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Mission, UserLog } from '@/lib/types';
import { saveLogToFirestore } from '@/lib/firestore';
import { getErrorMessage, showErrorNotification, checkImageSize } from '@/lib/errorHandler';
import { isCloudinaryConfigured, uploadImageFile } from '@/lib/cloudinary';
import { MAX_LOCATION_LENGTH, MAX_MEMO_LENGTH, sanitizeTextInput, validateLocation, validateMemo } from '@/lib/validation';
import styles from './record.module.css';

function RecordContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [userId, setUserId] = useState<string | null>(null);
    const [mission, setMission] = useState<Mission | null>(null);
    const [startTime, setStartTime] = useState<Date | null>(null);
    const [imageData, setImageData] = useState<string | null>(null);
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [memo, setMemo] = useState('');
    const [location, setLocation] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [uploadMessage, setUploadMessage] = useState<string | null>(null);

    useEffect(() => {
        // ユーザーIDチェック
        const storedUserId = localStorage.getItem('sanposhin_userId');
        if (!storedUserId) {
            router.push('/setup');
            return;
        }
        setUserId(storedUserId);

        // URLパラメータからミッション情報を取得
        const missionParam = searchParams.get('mission');
        const startTimeParam = searchParams.get('startTime');

        if (missionParam) {
            try {
                const missionData = JSON.parse(decodeURIComponent(missionParam));
                setMission(missionData);
            } catch (error) {
                console.error('Failed to parse mission data:', error);
                router.push('/');
            }
        }

        if (startTimeParam) {
            setStartTime(new Date(startTimeParam));
        }
    }, [router, searchParams]);

    const handleImageCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            // 画像サイズチェック（5MB制限）
            const sizeError = checkImageSize(file, 5);
            if (sizeError) {
                showErrorNotification(sizeError);
                return;
            }

            setImageFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setImageData(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSave = async () => {
        if (!userId || !mission) return;

        const sanitizedLocation = sanitizeTextInput(location);
        const sanitizedMemo = sanitizeTextInput(memo);

        const locationValidation = validateLocation(sanitizedLocation);
        if (!locationValidation.valid) {
            showErrorNotification(locationValidation.error!);
            return;
        }

        const memoValidation = validateMemo(sanitizedMemo);
        if (!memoValidation.valid) {
            showErrorNotification(memoValidation.error!);
            return;
        }

        setIsSaving(true);
        setUploadMessage(null);

        try {
            let finalImageUrl: string | undefined;
            let finalImageData: string | undefined;

            // Cloudinary が設定されている場合はアップロード
            if (imageFile && isCloudinaryConfigured()) {
                try {
                    setUploadMessage('画像をアップロード中...');
                    finalImageUrl = await uploadImageFile(imageFile, userId);
                    setUploadMessage('画像アップロード完了');
                    // Cloudinary にアップロード成功した場合は Base64 を保存しない
                } catch (uploadError) {
                    console.error('Cloudinary upload failed:', uploadError);
                    setUploadMessage('画像アップロードに失敗しました。Base64で保存します。');
                    // フォールバック: Base64 データを保存
                    finalImageData = imageData || undefined;
                }
            } else {
                // Cloudinary 未設定の場合は Base64 を使用
                finalImageData = imageData || undefined;
            }

            // ログデータの作成
            const log: UserLog = {
                userId,
                missionText: mission.text,
                missionId: mission.id,
                imageUrl: finalImageUrl,
                imageData: finalImageData,
                location: sanitizedLocation ? { name: sanitizedLocation } : undefined,
                memo: sanitizedMemo || undefined,
                isPublic: false,
                createdAt: new Date().toISOString(),
            };

            // Firestore に保存（SSOT）
            await saveLogToFirestore(userId, log);

            // localStorage にもキャッシュ（オフライン対応）
            try {
                const logsString = localStorage.getItem('sanposhin_logs') || '[]';
                const logs = JSON.parse(logsString);
                logs.push(log);
                localStorage.setItem('sanposhin_logs', JSON.stringify(logs));
            } catch (storageError) {
                console.warn('localStorage へのキャッシュに失敗しました:', storageError);
                // Firestore への保存は成功しているので続行
            }

            setUploadMessage('記録を保存しました');

            // 成功画面へ遷移
            router.push('/record/success');
        } catch (error) {
            console.error('Failed to save log:', error);
            const message = getErrorMessage(error);
            showErrorNotification(`保存に失敗しました: ${message}`);
        } finally {
            setIsSaving(false);
        }
    };

    if (!mission || !userId) {
        return (
            <div className={styles.container}>
                <div className={styles.loading}>読み込み中...</div>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            <main className={styles.main}>
                <h1 className={styles.header}>記録を残す</h1>

                <div className={styles.missionBox}>
                    <p className={styles.missionText}>{mission.text}</p>
                </div>

                <div className={styles.formGroup}>
                    <label className={styles.label}>写真</label>
                    <div className={styles.imageInputContainer}>
                        {!imageData ? (
                            <label htmlFor="imageInput" className={styles.imageInputLabel}>
                                <input
                                    type="file"
                                    id="imageInput"
                                    accept="image/*"
                                    capture="environment"
                                    onChange={handleImageCapture}
                                    className={styles.imageInput}
                                />
                                <div className={styles.imageInputPlaceholder}>
                                    📷 写真を撮る
                                </div>
                            </label>
                        ) : (
                            <div className={styles.imagePreview}>
                                <img src={imageData} alt="撮影した写真" className={styles.previewImage} />
                                <button
                                    onClick={() => {
                                        setImageData(null);
                                        setImageFile(null);
                                    }}
                                    className={styles.imageChangeButton}
                                >
                                    撮り直す
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                <div className={styles.formGroup}>
                    <label htmlFor="location" className={styles.label}>
                        場所（任意）
                    </label>
                    <input
                        type="text"
                        id="location"
                        value={location}
                        onChange={(e) => {
                            const value = sanitizeTextInput(e.target.value);
                            if (value.length <= MAX_LOCATION_LENGTH) {
                                setLocation(value);
                            }
                        }}
                        className={styles.input}
                        placeholder="例: 公園の近く"
                        maxLength={MAX_LOCATION_LENGTH}
                    />
                </div>

                <div className={styles.formGroup}>
                    <label htmlFor="memo" className={styles.label}>
                        メモ（任意）
                    </label>
                    <textarea
                        id="memo"
                        value={memo}
                        onChange={(e) => {
                            const value = sanitizeTextInput(e.target.value);
                            if (value.length <= MAX_MEMO_LENGTH) {
                                setMemo(value);
                            }
                        }}
                        className={styles.textarea}
                        placeholder="気づいたこと、感じたことを..."
                        rows={4}
                        maxLength={MAX_MEMO_LENGTH}
                    />
                </div>

                {uploadMessage && (
                    <div className={styles.noticeMessage}>{uploadMessage}</div>
                )}

                <button
                    onClick={handleSave}
                    className={styles.primaryButton}
                    disabled={isSaving}
                >
                    {isSaving ? '保存中...' : '保存する'}
                </button>

                <button
                    onClick={() => router.push('/')}
                    className={styles.secondaryButton}
                    disabled={isSaving}
                >
                    キャンセル
                </button>
            </main>
        </div>
    );
}

export default function RecordPage() {
    return (
        <Suspense fallback={<div>読み込み中...</div>}>
            <RecordContent />
        </Suspense>
    );
}
