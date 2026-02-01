// 禁止されているユーザーID（予約語）
export const RESERVED_USER_IDS = [
    // システム予約語
    'admin', 'system', 'root', 'support', 'api', 'auth',
    'login', 'logout', 'signup', 'backup', 'restore',
    'public', 'private',

    // 初期サンプル・誤設定防止
    'sample', 'test', 'tester', 'demo', 'example',
    'user', 'username', 'yourname', 'anonymous',

    // URL / 技術衝突回避
    'www', 'app', 'static', 'assets', 'images',
    'cloudinary', 'firebase',
];

/**
 * ユーザーIDが予約語またはその前方一致に該当するかチェック
 */
export function isReservedUserId(userId: string): boolean {
    const lowerUserId = userId.toLowerCase();

    return RESERVED_USER_IDS.some(reserved => {
        // 完全一致または前方一致
        return lowerUserId === reserved || lowerUserId.startsWith(reserved);
    });
}

/**
 * ユーザーIDのフォーマットをバリデーション
 * 要件: 英小文字・数字・アンダースコア、3〜20文字、先頭は英字
 */
export function validateUserId(userId: string): {
    valid: boolean;
    error?: string;
} {
    // 長さチェック
    if (userId.length < 3 || userId.length > 20) {
        return { valid: false, error: 'ユーザーIDは3〜20文字で入力してください' };
    }

    // フォーマットチェック: 英小文字・数字・アンダースコアのみ
    if (!/^[a-z][a-z0-9_]*$/.test(userId)) {
        return {
            valid: false,
            error: 'ユーザーIDは英小文字で始まり、英小文字・数字・アンダースコアのみ使用できます'
        };
    }

    // 予約語チェック
    if (isReservedUserId(userId)) {
        return {
            valid: false,
            error: 'このユーザーIDは使用できません（予約語）'
        };
    }

    return { valid: true };
}

/**
 * パスワードのバリデーション
 * 要件: 7桁の数字のみ
 */
export function validatePassword(password: string): {
    valid: boolean;
    error?: string;
} {
    if (password.length !== 7) {
        return { valid: false, error: 'パスワードは7桁で入力してください' };
    }

    if (!/^\d{7}$/.test(password)) {
        return { valid: false, error: 'パスワードは数字のみで入力してください' };
    }

    return { valid: true };
}
