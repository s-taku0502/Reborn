import {
    getFirestore,
    doc,
    setDoc,
    getDoc,
    collection,
    addDoc,
    query,
    where,
    getDocs,
    orderBy,
    deleteDoc,
    Timestamp
} from 'firebase/firestore';
import { app } from './firebase';
import { UserLog } from './types';

function removeUndefined<T>(value: T): T {
    if (Array.isArray(value)) {
        return value.map(removeUndefined) as T;
    }

    if (value instanceof Timestamp || value instanceof Date) {
        return value;
    }

    if (value && typeof value === 'object') {
        const result: Record<string, unknown> = {};
        Object.entries(value as Record<string, unknown>).forEach(([key, val]) => {
            if (val === undefined) return;
            const cleaned = removeUndefined(val);
            if (cleaned !== undefined) {
                result[key] = cleaned;
            }
        });
        return result as T;
    }

    return value;
}

// Firebase の初期化チェック
function getDb() {
    if (typeof window === 'undefined') {
        throw new Error('Firestore は クライアントサイドでのみ使用可能です');
    }
    return getFirestore(app);
}

// ============================================================
// ユーザー管理
// ============================================================

/**
 * ユーザーIDの重複チェック
 * @param userId - チェックするユーザーID
 * @returns 既に存在する場合true
 */
export async function checkUserIdExists(userId: string): Promise<boolean> {
    try {
        const userRef = doc(getDb(), 'users', userId);
        const docSnap = await getDoc(userRef);
        return docSnap.exists();
    } catch (error) {
        console.error('checkUserIdExists error:', error);
        throw new Error('ユーザーID存在チェック中にエラーが発生しました');
    }
}

/**
 * 新規ユーザー作成
 * @param userId - ユーザーID
 * @param passwordHash - bcrypt ハッシュ化パスワード
 */
export async function createUser(userId: string, passwordHash: string): Promise<void> {
    try {
        const userRef = doc(getDb(), 'users', userId);
        await setDoc(userRef, {
            userId,
            passwordHash,
            createdAt: new Date().toISOString(),
            totalAdventures: 0,
            lastLoginAt: new Date().toISOString(),
        });
    } catch (error) {
        console.error('createUser error:', error);
        throw new Error('ユーザー作成中にエラーが発生しました');
    }
}

/**
 * ユーザー情報取得
 * @param userId - ユーザーID
 * @returns ユーザープロフィール、存在しない場合null
 */
export async function getUser(userId: string) {
    try {
        const userRef = doc(getDb(), 'users', userId);
        const docSnap = await getDoc(userRef);
        return docSnap.exists() ? docSnap.data() : null;
    } catch (error) {
        console.error('getUser error:', error);
        throw new Error('ユーザー情報取得中にエラーが発生しました');
    }
}

/**
 * ユーザーの最終ログイン時刻を更新
 * @param userId - ユーザーID
 */
export async function updateLastLogin(userId: string): Promise<void> {
    try {
        const userRef = doc(getDb(), 'users', userId);
        await setDoc(userRef, {
            lastLoginAt: new Date().toISOString(),
        }, { merge: true });
    } catch (error) {
        console.error('updateLastLogin error:', error);
        // ログイン時刻更新失敗は致命的ではないのでスロー しない
    }
}

// ============================================================
// 冒険ログ管理
// ============================================================

/**
 * ログをFirestoreに保存
 * @param userId - ユーザーID
 * @param log - ログデータ
 * @returns 保存されたログのID
 */
export async function saveLogToFirestore(userId: string, log: UserLog): Promise<string> {
    try {
        const logsRef = collection(getDb(), 'users', userId, 'logs');
        const docRef = await addDoc(
            logsRef,
            removeUndefined({
                ...log,
                createdAt: new Date().toISOString(),
            })
        );

        // totalAdventures をインクリメント
        const userRef = doc(getDb(), 'users', userId);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
            const currentTotal = userSnap.data().totalAdventures || 0;
            await setDoc(userRef, {
                totalAdventures: currentTotal + 1,
            }, { merge: true });
        }

        return docRef.id;
    } catch (error) {
        console.error('saveLogToFirestore error:', error);
        throw new Error('ログ保存中にエラーが発生しました');
    }
}

/**
 * ユーザーの全ログを取得
 * @param userId - ユーザーID
 * @returns ログ配列（新しい順）
 */
export async function getLogsFromFirestore(userId: string): Promise<UserLog[]> {
    try {
        const logsRef = collection(getDb(), 'users', userId, 'logs');
        const q = query(logsRef, orderBy('createdAt', 'desc'));
        const querySnapshot = await getDocs(q);

        return querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
        })) as UserLog[];
    } catch (error) {
        console.error('getLogsFromFirestore error:', error);
        throw new Error('ログ取得中にエラーが発生しました');
    }
}

// ============================================================
// アカウント削除
// ============================================================

/**
 * ユーザーアカウント完全削除
 * @param userId - ユーザーID
 */
export async function deleteUserAccount(userId: string): Promise<void> {
    try {
        // 1. ログコレクション全削除
        const logsRef = collection(getDb(), 'users', userId, 'logs');
        const logsSnapshot = await getDocs(logsRef);
        const deletePromises = logsSnapshot.docs.map(doc => deleteDoc(doc.ref));
        await Promise.all(deletePromises);

        // 2. ユーザードキュメント削除
        const userRef = doc(getDb(), 'users', userId);
        await deleteDoc(userRef);
    } catch (error) {
        console.error('deleteUserAccount error:', error);
        throw new Error('アカウント削除中にエラーが発生しました');
    }
}

// ============================================================
// バックアップ・復元
// ============================================================

/**
 * Firestoreから全ログを取得してバックアップ用に整形
 * @param userId - ユーザーID
 * @returns バックアップデータ
 */
export async function createBackupData(userId: string) {
    try {
        const logs = await getLogsFromFirestore(userId);

        console.log('Backup: Firestore から取得したログ数:', logs.length);

        return {
            version: '1.0.0',
            userId,
            createdAt: new Date().toISOString(),
            logs: logs.map(log => {
                // imageData を除外（undefined を設定しない）
                const { imageData, ...logWithoutImageData } = log;
                return logWithoutImageData;
            }),
        };
    } catch (error) {
        console.error('createBackupData error:', error);
        throw new Error('バックアップデータ作成中にエラーが発生しました');
    }
}

/**
 * バックアップデータからFirestoreへ復元
 * @param userId - ユーザーID
 * @param logs - ログ配列
 */
export async function restoreLogsToFirestore(userId: string, logs: UserLog[]): Promise<void> {
    try {
        const logsRef = collection(getDb(), 'users', userId, 'logs');

        // 既存ログを削除しない（追加のみ）
        // 重複を避けるため、createdAt でチェック
        const existingLogs = await getDocs(logsRef);
        const existingCreatedAts = new Set(
            existingLogs.docs.map(doc => doc.data().createdAt)
        );

        // 新しいログのみ追加
        const addPromises = logs
            .filter(log => !existingCreatedAts.has(log.createdAt))
            .map(log => {
                // id フィールドを除外してから追加
                const { id, ...logWithoutId } = log;
                return addDoc(logsRef, removeUndefined(logWithoutId));
            });

        await Promise.all(addPromises);

        // totalAdventures を更新
        const userRef = doc(getDb(), 'users', userId);
        const currentLogs = await getDocs(logsRef);
        await setDoc(userRef, {
            totalAdventures: currentLogs.size,
        }, { merge: true });
    } catch (error) {
        console.error('restoreLogsToFirestore error:', error);
        throw new Error('ログ復元中にエラーが発生しました');
    }
}
