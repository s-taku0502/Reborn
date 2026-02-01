'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { validateUserId, validatePassword } from '@/lib/validation';
import { hashPassword, savePasswordHash, verifyPassword } from '@/lib/password';
import { checkUserIdExists, createUser, getUser, getLogsFromFirestore } from '@/lib/firestore';
import styles from './setup.module.css';

export default function SetupPage() {
    const router = useRouter();
    const [mode, setMode] = useState<'signup' | 'login'>('signup');
    const [userId, setUserId] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (mode === 'login') {
            await handleLogin();
        } else {
            await handleSignup();
        }
    };

    const handleLogin = async () => {
        // バリデーション
        const userIdValidation = validateUserId(userId);
        if (!userIdValidation.valid) {
            setError(userIdValidation.error!);
            return;
        }

        const passwordValidation = validatePassword(password);
        if (!passwordValidation.valid) {
            setError(passwordValidation.error!);
            return;
        }

        setIsLoading(true);

        try {
            // 1. Firestore からユーザー情報取得
            const user = await getUser(userId);
            if (!user) {
                setError('ユーザーIDまたはパスワードが間違っています');
                setIsLoading(false);
                return;
            }

            // 2. パスワード検証
            const isValid = await verifyPassword(password, user.passwordHash);
            if (!isValid) {
                setError('ユーザーIDまたはパスワードが間違っています');
                setIsLoading(false);
                return;
            }

            // 3. localStorage に保存
            await savePasswordHash(password);
            localStorage.setItem('sanposhin_userId', userId);

            // 4. Firestore からログを取得して localStorage にキャッシュ
            try {
                const logs = await getLogsFromFirestore(userId);
                localStorage.setItem('sanposhin_logs', JSON.stringify(logs));
                console.log(`ログイン成功: ${logs.length}件のログを取得しました`);
            } catch (logError) {
                console.warn('ログ取得に失敗しましたが、ログインは継続します:', logError);
            }

            // 5. ホームへリダイレクト
            router.push('/');
        } catch (err) {
            console.error('Login error:', err);
            setError('ログイン中にエラーが発生しました');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSignup = async () => {
        const userIdValidation = validateUserId(userId);
        if (!userIdValidation.valid) {
            setError(userIdValidation.error!);
            return;
        }

        const passwordValidation = validatePassword(password);
        if (!passwordValidation.valid) {
            setError(passwordValidation.error!);
            return;
        }

        if (password !== confirmPassword) {
            setError('パスワードが一致しません');
            return;
        }

        setIsLoading(true);

        try {
            // 1. ユーザーID重複チェック (Firestore)
            const exists = await checkUserIdExists(userId);
            if (exists) {
                setError('このユーザーIDはすでに使用されています');
                setIsLoading(false);
                return;
            }

            // 2. パスワードハッシュ化
            const hash = await hashPassword(password);

            // 3. Firestore にユーザー作成
            await createUser(userId, hash);

            // 4. localStorage にも保存（キャッシュ）
            await savePasswordHash(password);
            localStorage.setItem('sanposhin_userId', userId);
            localStorage.setItem('sanposhin_createdAt', new Date().toISOString());
            localStorage.setItem('sanposhin_logs', JSON.stringify([]));

            // 5. ホームへリダイレクト
            router.push('/');
        } catch (err) {
            console.error('Registration error:', err);
            if (err instanceof Error && err.message.includes('ネットワーク')) {
                setError('ネットワーク接続を確認してください');
            } else {
                setError('登録中にエラーが発生しました。しばらくしてから再度お試しください。');
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className={styles.container}>
            <main className={styles.main}>
                <h1 className={styles.title}>{mode === 'signup' ? '初期設定' : 'ログイン'}</h1>
                <p className={styles.description}>
                    {mode === 'signup' ? (
                        <>
                            散歩神を始めるために、<br />
                            ユーザーIDとバックアップ用パスワードを設定してください。
                        </>
                    ) : (
                        'ユーザーIDとパスワードでログインしてください。'
                    )}
                </p>

                <form onSubmit={handleSubmit} className={styles.form}>
                    <div className={styles.formGroup}>
                        <label htmlFor="userId" className={styles.label}>
                            ユーザーID
                        </label>
                        <input
                            type="text"
                            id="userId"
                            value={userId}
                            onChange={(e) => setUserId(e.target.value)}
                            className={styles.input}
                            placeholder="例: ocean_t_umi"
                            autoComplete="off"
                            disabled={isLoading}
                        />
                        <p className={styles.hint}>
                            英小文字、数字、アンダースコアが使用できます（3〜20文字、先頭は英字）
                        </p>
                    </div>

                    <div className={styles.formGroup}>
                        <label htmlFor="password" className={styles.label}>
                            バックアップパスワード（7桁の数字）
                        </label>
                        <input
                            type="password"
                            id="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className={styles.input}
                            placeholder="1234567"
                            maxLength={7}
                            inputMode="numeric"
                            autoComplete="off"
                            disabled={isLoading}
                        />
                    </div>

                    {mode === 'signup' && (
                        <div className={styles.formGroup}>
                            <label htmlFor="confirmPassword" className={styles.label}>
                                パスワード（確認）
                            </label>
                            <input
                                type="password"
                                id="confirmPassword"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className={styles.input}
                                placeholder="1234567"
                                maxLength={7}
                                inputMode="numeric"
                                autoComplete="off"
                                disabled={isLoading}
                            />
                        </div>
                    )}

                    {error && <p className={styles.error}>{error}</p>}

                    <button
                        type="submit"
                        className={styles.submitButton}
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            mode === 'signup' ? '設定中...' : 'ログイン中...'
                        ) : (
                            mode === 'signup' ? '設定を完了する' : 'ログインする'
                        )}
                    </button>
                </form>

                <button
                    onClick={() => {
                        setMode(mode === 'signup' ? 'login' : 'signup');
                        setError('');
                        setPassword('');
                        setConfirmPassword('');
                    }}
                    className={styles.toggleButton}
                    disabled={isLoading}
                >
                    {mode === 'signup' ? '既にアカウントをお持ちの方はこちら' : '新規登録はこちら'}
                </button>

                {mode === 'signup' && (
                    <p className={styles.note}>
                        ※ 一度設定したIDは変更できません<br />
                        ※ パスワードは端末移行時に必要になります
                    </p>
                )}
            </main>
        </div>
    );
}
