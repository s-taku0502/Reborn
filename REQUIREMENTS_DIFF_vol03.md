# 要件定義書と実装の差異レポート Vol.03（残タスク詳細版）

## 実施日: 2026年2月1日

**前次版**: REQUIREMENTS_DIFF_vol02.md  
**目的**: Phase 2以降の残タスク詳細化と実装計画確定

---

## 📊 残タスク全体像

```
Phase 1 完了状況: 3/14 (21%) ✅
───────────────────────────────
Phase 2 必須タスク: 6項目 (43%)
Phase 3 拡張機能: 5項目 (36%)
───────────────────────────────
合計残タスク: 11項目 (79%) 🔴
```

### 重大度別の残タスク内訳

| 重大度 | Phase 2 必須 | Phase 3 拡張 | 合計 |
|-------|------------|------------|------|
| 🔴 重大 | 0.5項目 | 0項目 | 0.5 |
| 🟡 中程 | 4.5項目 | 0項目 | 4.5 |
| 🟢 軽微 | 1項目 | 4項目 | 5 |
| **合計** | **6** | **4** | **11** |

---

## 🎯 Phase 2: データ永続化・セキュリティ完成（必須実装）

**目標**: 本番サービス展開可能な状態（マルチデバイス対応 + データ永続化）  
**期間**: 2026/2/8 - 2/22（約2週間）  
**優先度**: 🔴 最高（MVP完成の最終条件）

---

### 2-1. 🟡 復元機能の完全実装（3ストライク + 60分ロック）

**現在の状態**:

- ✅ ユーザーID・パスワード検証（ハッシュ比較）
- ⚠️ 「復元機能は開発中です」アラート表示
- ❌ 失敗回数カウント未実装
- ❌ ロック機能未実装

**実装要件（DIFF_REPAIR §7.2.2 に基づく）**:

#### データ構造

```typescript
interface RestoreAttempt {
  failureCount: number;      // 失敗回数（0-3）
  lockUntil?: number;        // ロック解除時刻（Unix timestamp）
  lastFailedAt?: number;     // 最終失敗時刻
}
```

#### フロー

```typescript
const handleRestore = async () => {
  // 1. ロック状態確認
  const attempts: RestoreAttempt = JSON.parse(
    localStorage.getItem('sanposhin_restore_attempts') || '{"failureCount": 0}'
  );

  if (attempts.lockUntil && Date.now() < attempts.lockUntil) {
    const lockDate = new Date(attempts.lockUntil).toLocaleString('ja-JP');
    alert(`ロック中です。${lockDate} までお待ちください。`);
    return;
  }

  // 2. パスワード検証
  const hash = localStorage.getItem('sanposhin_password_hash');
  const isValid = await verifyPassword(restorePassword, hash!);

  if (!isValid || restoreUserId !== userId) {
    // 失敗処理
    attempts.failureCount++;
    attempts.lastFailedAt = Date.now();

    if (attempts.failureCount >= 3) {
      attempts.lockUntil = Date.now() + 60 * 60 * 1000; // 60分後
      localStorage.setItem('sanposhin_restore_attempts', JSON.stringify(attempts));
      alert('3回失敗しました。60分間ロックされます。');
      setRestoreUserId('');
      setRestorePassword('');
      return;
    }

    localStorage.setItem('sanposhin_restore_attempts', JSON.stringify(attempts));
    setError(`ユーザーIDまたはパスワードが正しくありません（残り${3 - attempts.failureCount}回）`);
    return;
  }

  // 3. 復元成功 - カウンターリセット
  localStorage.setItem('sanposhin_restore_attempts', JSON.stringify({ failureCount: 0 }));
  
  // 4. バックアップファイルから復元処理（実装）
  // TODO: ファイル選択 → JSON解析 → localStorage復元
};
```

#### UI改善

- 失敗回数の残り表示: 「残り2回」
- ロック中の視覚的フィードバック（ボタン無効化）
- ロック解除時刻のカウントダウン表示（オプション）

**工数見積もり**: 2-3日  
**ファイル**: `app/mypage/page.tsx`

---

### 2-2. 🔴 Firebase Firestore 基本CRUD実装

**現在の状態**:

- ✅ Firebase SDK インストール済み
- ✅ `lib/firebase.ts` 初期化コード存在
- ❌ Firestore への実際のデータ操作なし
- ❌ 全データが localStorage のみ

**実装要件（DIFF_REPAIR §7.3.1 に基づく）**:

#### Phase 2-2A: ユーザー登録時の Firestore 連携

**目的**: ユーザーID重複チェック + プロフィール保存

```typescript
// lib/firestore.ts（新規作成）
import { getFirestore, doc, setDoc, getDoc } from 'firebase/firestore';
import { app } from './firebase';

const db = getFirestore(app);

// ユーザーID重複チェック
export async function checkUserIdExists(userId: string): Promise<boolean> {
  const userRef = doc(db, 'users', userId);
  const docSnap = await getDoc(userRef);
  return docSnap.exists();
}

// 新規ユーザー登録
export async function createUser(userId: string, passwordHash: string): Promise<void> {
  const userRef = doc(db, 'users', userId);
  await setDoc(userRef, {
    userId,
    passwordHash,
    createdAt: new Date().toISOString(),
    totalAdventures: 0,
  });
}

// ユーザー情報取得
export async function getUser(userId: string) {
  const userRef = doc(db, 'users', userId);
  const docSnap = await getDoc(userRef);
  return docSnap.exists() ? docSnap.data() : null;
}
```

**setup/page.tsx 修正**:

```typescript
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setIsLoading(true);

  try {
    // 1. ユーザーID重複チェック
    const exists = await checkUserIdExists(userId);
    if (exists) {
      setError('このユーザーIDはすでに使用されています');
      setIsLoading(false);
      return;
    }

    // 2. パスワードハッシュ化
    const hash = await hashPassword(password);

    // 3. Firestore に保存
    await createUser(userId, hash);

    // 4. localStorage にも保存（キャッシュ）
    localStorage.setItem('sanposhin_userId', userId);
    await savePasswordHash(password);
    localStorage.setItem('sanposhin_createdAt', new Date().toISOString());
    localStorage.setItem('sanposhin_logs', JSON.stringify([]));

    router.push('/');
  } catch (error) {
    console.error('Registration error:', error);
    setError('登録中にエラーが発生しました。ネットワーク接続を確認してください。');
  } finally {
    setIsLoading(false);
  }
};
```

**工数見積もり**: 3-4日

---

#### Phase 2-2B: 冒険ログの Firestore 保存

**目的**: 写真・ログの永続化とマルチデバイス同期基盤

```typescript
// lib/firestore.ts に追加
import { collection, addDoc, query, where, getDocs, orderBy } from 'firebase/firestore';

// ログ保存
export async function saveLogToFirestore(userId: string, log: UserLog): Promise<string> {
  const logsRef = collection(db, 'users', userId, 'logs');
  const docRef = await addDoc(logsRef, {
    ...log,
    createdAt: new Date().toISOString(),
  });
  return docRef.id;
}

// ログ一覧取得
export async function getLogsFromFirestore(userId: string): Promise<UserLog[]> {
  const logsRef = collection(db, 'users', userId, 'logs');
  const q = query(logsRef, orderBy('createdAt', 'desc'));
  const querySnapshot = await getDocs(q);
  
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  })) as UserLog[];
}
```

**record/page.tsx 修正**:

```typescript
const handleSave = async () => {
  // ... 既存の検証処理 ...

  const newLog: UserLog = {
    userId: userId!,
    missionText: missionText!,
    missionId: mission?.id || 'fallback',
    imageData: imageData || undefined,
    memo,
    isPublic: false,
    createdAt: new Date().toISOString(),
  };

  try {
    // 1. Firestore に保存
    const logId = await saveLogToFirestore(userId!, newLog);
    newLog.id = logId;

    // 2. localStorage にも保存（キャッシュ）
    const logsString = localStorage.getItem('sanposhin_logs') || '[]';
    const logs: UserLog[] = JSON.parse(logsString);
    logs.push(newLog);
    localStorage.setItem('sanposhin_logs', JSON.stringify(logs));

    router.push('/record/success');
  } catch (error) {
    console.error('Save log error:', error);
    alert('保存中にエラーが発生しました。オフラインの場合、ログはローカルに保存されます。');
    
    // フォールバック: localStorage のみ保存
    const logsString = localStorage.getItem('sanposhin_logs') || '[]';
    const logs: UserLog[] = JSON.parse(logsString);
    logs.push(newLog);
    localStorage.setItem('sanposhin_logs', JSON.stringify(logs));
    router.push('/record/success');
  }
};
```

**工数見積もり**: 2-3日

---

### 2-3. 🔴 アカウント削除機能実装

**現在の状態**:

- ❌ アカウント削除機能なし
- ❌ GDPR対応不可

**実装要件（DIFF_REPAIR §7.3.2 に基づく）**:

#### データ削除範囲

1. Firestore: `/users/{userId}` ドキュメント全体
2. Firestore: `/users/{userId}/logs` コレクション全体
3. localStorage: 全キー削除

#### 実装コード

```typescript
// lib/firestore.ts に追加
import { deleteDoc, collection, getDocs } from 'firebase/firestore';

export async function deleteUserAccount(userId: string): Promise<void> {
  // 1. ログコレクション削除
  const logsRef = collection(db, 'users', userId, 'logs');
  const logsSnapshot = await getDocs(logsRef);
  const deletePromises = logsSnapshot.docs.map(doc => deleteDoc(doc.ref));
  await Promise.all(deletePromises);

  // 2. ユーザードキュメント削除
  const userRef = doc(db, 'users', userId);
  await deleteDoc(userRef);
}
```

**mypage/page.tsx に追加**:

```typescript
const handleDeleteAccount = async () => {
  const confirmMessage = `アカウントを削除しますか？\n\nこの操作は取り消せません。\n- すべての冒険ログが削除されます\n- ユーザーIDは再利用できなくなります\n\n削除する場合は「削除」と入力してください`;
  const userInput = prompt(confirmMessage);

  if (userInput !== '削除') {
    return;
  }

  setIsLoading(true);
  try {
    // 1. Firestore からデータ削除
    await deleteUserAccount(userId!);

    // 2. localStorage 全削除
    localStorage.clear();

    alert('アカウントが削除されました。ご利用ありがとうございました。');
    router.push('/setup');
  } catch (error) {
    console.error('Delete account error:', error);
    alert('削除中にエラーが発生しました。ネットワーク接続を確認してください。');
  } finally {
    setIsLoading(false);
  }
};
```

**UI配置**:

```tsx
<div className={styles.section}>
  <h2 className={styles.sectionTitle}>危険な操作</h2>
  <p className={styles.warningText}>
    以下の操作は取り消せません。十分に注意してください。
  </p>
  <button onClick={handleDeleteAccount} className={styles.dangerButton}>
    ⚠️ アカウントを削除
  </button>
</div>
```

**工数見積もり**: 1-2日

---

### 2-4. 🟡 エラーハンドリング強化

**現在の状態**:

- ⚠️ 基本的なフォームバリデーションのみ
- ❌ ネットワークエラー時の適切な通知なし
- ❌ Firestore接続失敗時のフォールバックなし

**実装要件（DIFF_REPAIR §7.3.3 に基づく）**:

#### エラー種別と対応

| エラー種別 | 検知方法 | ユーザー通知 | 復旧方法 |
|-----------|---------|------------|---------|
| ネットワーク切断 | `navigator.onLine` | 「オフラインです」 | ローカルストレージに保存 |
| Firestore接続失敗 | `catch (error)` | 「サーバーに接続できません」 | ローカルストレージ使用 |
| ストレージ容量不足 | `QuotaExceededError` | 「容量不足です」 | 古いログ削除を提案 |
| 画像サイズ超過 | ファイルサイズチェック | 「画像が大きすぎます」 | リサイズ or 圧縮 |

#### 実装例

```typescript
// lib/errorHandler.ts（新規作成）
export function getErrorMessage(error: unknown): string {
  if (!navigator.onLine) {
    return 'オフラインです。インターネット接続を確認してください。';
  }

  if (error instanceof Error) {
    if (error.name === 'QuotaExceededError') {
      return 'ストレージ容量が不足しています。古いログを削除してください。';
    }
    
    if (error.message.includes('auth')) {
      return '認証エラーが発生しました。再ログインしてください。';
    }

    if (error.message.includes('network')) {
      return 'ネットワークエラーが発生しました。接続を確認してください。';
    }
  }

  return '予期しないエラーが発生しました。しばらくしてから再度お試しください。';
}

// オフライン検知
export function setupOfflineDetection(onOffline: () => void, onOnline: () => void) {
  window.addEventListener('offline', onOffline);
  window.addEventListener('online', onOnline);

  return () => {
    window.removeEventListener('offline', onOffline);
    window.removeEventListener('online', onOnline);
  };
}
```

**各ページへの適用**:

```typescript
// 全ページ共通
try {
  await firestoreOperation();
} catch (error) {
  const message = getErrorMessage(error);
  setError(message);
  
  // ローカルストレージへのフォールバック
  saveToLocalStorage(data);
}
```

**工数見積もり**: 2-3日

---

### 2-5. 🟡 バックアップ・復元の完全実装

**現在の状態**:

- ✅ バックアップファイル生成（JSON）
- ✅ パスワード除外済み
- ⚠️ 復元はUI存在するが「開発中」
- ❌ ファイル選択・解析・復元処理未実装

**実装要件**:

#### バックアップ形式（確定版）

```typescript
interface BackupData {
  version: string;           // "1.0.0"
  userId: string;
  createdAt: string;
  logs: UserLog[];
  // passwordHash は含めない（ユーザーが秘密鍵として保持）
}
```

#### 復元処理フロー

```typescript
const handleRestoreFromFile = async (file: File) => {
  try {
    // 1. ファイル読み込み
    const text = await file.text();
    const backupData: BackupData = JSON.parse(text);

    // 2. バージョンチェック
    if (!backupData.version || backupData.version !== '1.0.0') {
      alert('非対応のバックアップファイルです');
      return;
    }

    // 3. ユーザーID・パスワード検証
    if (backupData.userId !== userId) {
      setError('バックアップファイルのユーザーIDが一致しません');
      return;
    }

    const hash = localStorage.getItem('sanposhin_password_hash');
    const isValid = await verifyPassword(restorePassword, hash!);
    if (!isValid) {
      setError('パスワードが正しくありません');
      return;
    }

    // 4. Firestore に復元
    for (const log of backupData.logs) {
      await saveLogToFirestore(userId!, log);
    }

    // 5. localStorage にも復元
    localStorage.setItem('sanposhin_logs', JSON.stringify(backupData.logs));
    localStorage.setItem('sanposhin_createdAt', backupData.createdAt);

    // 6. カウンターリセット
    localStorage.setItem('sanposhin_restore_attempts', JSON.stringify({ failureCount: 0 }));

    alert('復元が完了しました');
    setShowRestore(false);
    window.location.reload();
  } catch (error) {
    console.error('Restore error:', error);
    setError('復元中にエラーが発生しました。ファイルが壊れている可能性があります。');
  }
};
```

**UI実装**:

```tsx
{showRestore && (
  <div className={styles.restoreForm}>
    <p className={styles.restoreNote}>
      バックアップファイルを選択して、ユーザーIDとパスワードを入力してください
    </p>
    <input
      type="file"
      accept="application/json"
      onChange={(e) => {
        if (e.target.files?.[0]) {
          setRestoreFile(e.target.files[0]);
        }
      }}
      className={styles.fileInput}
    />
    <input
      type="text"
      value={restoreUserId}
      onChange={(e) => setRestoreUserId(e.target.value)}
      placeholder="ユーザーID"
      className={styles.input}
    />
    <input
      type="password"
      value={restorePassword}
      onChange={(e) => setRestorePassword(e.target.value)}
      placeholder="パスワード（7桁）"
      maxLength={7}
      className={styles.input}
    />
    {error && <p className={styles.error}>{error}</p>}
    <button
      onClick={() => restoreFile && handleRestoreFromFile(restoreFile)}
      className={styles.primaryButton}
      disabled={!restoreFile || !restoreUserId || !restorePassword}
    >
      復元する
    </button>
  </div>
)}
```

**工数見積もり**: 2-3日

---

### 2-6. 🟢 オフライン対応・PWA設定強化

**現在の状態**:

- ✅ Next.js デフォルト PWA 対応
- ⚠️ Service Worker の明示的設定なし
- ✅ localStorage で基本的なオフライン対応

**実装要件**:

#### Service Worker 設定

```javascript
// public/sw.js（新規作成）
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open('sanposhin-v1').then((cache) => {
      return cache.addAll([
        '/',
        '/setup',
        '/oracle',
        '/record',
        '/album',
        '/mypage',
      ]);
    })
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});
```

#### manifest.json 完全版

```json
{
  "name": "散歩神 Reborn",
  "short_name": "散歩神",
  "description": "日常の散歩を神のお告げで冒険に変えるアプリ",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#4a90e2",
  "icons": [
    {
      "src": "/icon-192x192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icon-512x512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}
```

**工数見積もり**: 1日

---

## 🚀 Phase 3: 拡張機能（任意実装）

**目標**: UX向上・スケーラビリティ強化  
**期間**: 2026/3月以降  
**優先度**: 🟢 中〜低

---

### 3-1. 🟢 Cloudinary 画像アップロード

**現在の問題**:

- 画像が Base64 で localStorage（容量制限 5-10MB）
- マルチデバイス同期困難
- 画像最適化なし

**実装要件**:

```typescript
// lib/cloudinary.ts（新規作成）
export async function uploadToCloudinary(base64Image: string): Promise<string> {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

  const formData = new FormData();
  formData.append('file', base64Image);
  formData.append('upload_preset', uploadPreset!);

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
    {
      method: 'POST',
      body: formData,
    }
  );

  const data = await response.json();
  return data.secure_url;
}
```

**record/page.tsx 修正**:

```typescript
const handleSave = async () => {
  // ... 既存処理 ...

  let imageUrl: string | undefined;
  if (imageData) {
    try {
      imageUrl = await uploadToCloudinary(imageData);
    } catch (error) {
      console.error('Cloudinary upload error:', error);
      // フォールバック: Base64 のまま保存
    }
  }

  const newLog: UserLog = {
    // ...
    imageUrl,
    imageData: imageUrl ? undefined : imageData, // Cloudinary成功時はBase64不要
  };
};
```

**工数見積もり**: 2-3日

---

### 3-2. 🟢 位置情報（Geolocation）基本実装

**MVP定義**: 位置情報は必須ではない（§2）が、拡張機能として有用

**実装要件**:

```typescript
// lib/geolocation.ts（新規作成）
export async function getCurrentLocation(): Promise<{ latitude: number; longitude: number } | null> {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve(null);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      },
      (error) => {
        console.error('Geolocation error:', error);
        resolve(null);
      }
    );
  });
}

export function getLocationName(latitude: number, longitude: number): Promise<string> {
  // Reverse geocoding（Google Maps API等）
  // MVP では "緯度経度のみ" または省略でも可
  return Promise.resolve(`${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
}
```

**工数見積もり**: 1-2日

---

### 3-3. 🟢 Google Sheets 連携（お題マスター自動更新）

**現在の実装**: `data/missions.json`（静的ファイル）

**実装要件**:

1. Google Sheets にお題リストを作成
2. Google Apps Script で定期実行（1日1回）
3. Sheets → JSON 変換 → Firebase Storage にアップロード
4. アプリ起動時に最新 JSON をフェッチ

```typescript
// lib/missions.ts 修正
export async function fetchMissionsFromFirebase(): Promise<Mission[]> {
  try {
    const response = await fetch('https://firebasestorage.googleapis.com/.../missions.json');
    const missions = await response.json();
    return missions;
  } catch (error) {
    console.error('Fetch missions error:', error);
    // フォールバック: ローカルJSON使用
    return import('@/data/missions.json').then(m => m.default);
  }
}
```

**工数見積もり**: 2-3日（GAS含む）

---

### 3-4. 🟢 SNS共有機能（画像生成）

**実装要件**:

```typescript
// lib/shareImage.ts（新規作成）
export async function generateShareImage(log: UserLog): Promise<string> {
  const canvas = document.createElement('canvas');
  canvas.width = 1200;
  canvas.height = 630;
  const ctx = canvas.getContext('2d')!;

  // 背景画像
  const img = new Image();
  img.src = log.imageUrl || log.imageData || '';
  await new Promise((resolve) => { img.onload = resolve; });
  ctx.drawImage(img, 0, 0, 1200, 630);

  // お告げテキストオーバーレイ
  ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
  ctx.fillRect(0, 480, 1200, 150);
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 36px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(log.missionText, 600, 555);

  return canvas.toDataURL('image/png');
}
```

**工数見積もり**: 2-3日

---

### 3-5. 🟢 AI生成お告げ（ChatGPT API連携）

**実装要件**: 拡張スコープとして凍結（§2.2.4）

現時点では実装しない。Phase 4（Q2以降）に検討。

---

## 📅 Phase 2 実装スケジュール（詳細）

```
Week 1 (2/8 - 2/14)
├─ 月 2/8:  復元ロック機能実装開始
├─ 火 2/9:  復元ロック機能完成・テスト
├─ 水 2/10: Firebase CRUD 設計・lib/firestore.ts作成
├─ 木 2/11: ユーザー登録のFirestore連携実装
├─ 金 2/12: ログ保存のFirestore連携実装
└─ 週末:    テスト・バグ修正

Week 2 (2/15 - 2/21)
├─ 月 2/15: アカウント削除機能実装
├─ 火 2/16: エラーハンドリング強化開始
├─ 水 2/17: エラーハンドリング完成
├─ 木 2/18: バックアップ・復元完全実装
├─ 金 2/19: PWA設定強化
└─ 週末:    統合テスト・デバッグ

Week 3 (2/22)
└─ 土 2/22: Phase 2 完了・vol04 レポート作成
```

---

## ✅ Phase 2 完了条件（Definition of Done）

以下の条件を**すべて満たした時点**で Phase 2 完了とする：

### 機能面

- [ ] 復元機能が3ストライク + 60分ロックで動作する
- [ ] ユーザー登録時にFirestoreにデータが保存される
- [ ] ユーザーID重複チェックが機能する
- [ ] ログ保存時にFirestoreに永続化される
- [ ] アカウント削除機能が動作する（Firestore + localStorage完全削除）
- [ ] ネットワークエラー時に適切なメッセージが表示される
- [ ] オフライン時もローカルストレージで動作する
- [ ] バックアップファイルから復元できる

### 技術面

- [ ] TypeScript コンパイルエラーなし
- [ ] `npm run build` が成功する
- [ ] Firebase接続テスト成功（本番環境）
- [ ] localStorage ↔ Firestore 同期が正常動作

### ドキュメント面

- [ ] REQUIREMENTS_DIFF_vol04.md 作成（Phase 2 完了報告）
- [ ] requirements_definition.md 更新（Firebase連携仕様追記）
- [ ] README.md 更新（環境変数設定手順追記）

---

## 🎯 Phase 3 以降の判断基準

Phase 2 完了後、以下の判断を行う：

### 即座に Phase 3 へ進む場合

- ✅ 市場投入を急がない（技術検証・ポートフォリオ目的）
- ✅ 画像容量問題が顕在化している
- ✅ 位置情報機能の需要が明確

### Phase 3 を延期する場合

- ✅ 早期市場投入（Phase 2 完了時点で MVP完成とみなす）
- ✅ ユーザーフィードバック収集を優先
- ✅ 運用コスト削減（Cloudinary課金回避）

---

## 📊 工数見積もりサマリー

| Phase | タスク | 工数 | 累計 |
|-------|-------|------|------|
| Phase 2-1 | 復元ロック | 2-3日 | 2-3日 |
| Phase 2-2 | Firebase CRUD | 5-7日 | 7-10日 |
| Phase 2-3 | アカウント削除 | 1-2日 | 8-12日 |
| Phase 2-4 | エラーハンドリング | 2-3日 | 10-15日 |
| Phase 2-5 | バックアップ復元 | 2-3日 | 12-18日 |
| Phase 2-6 | PWA強化 | 1日 | 13-19日 |
| **Phase 2 合計** | | **13-19日** | |
| | | | |
| Phase 3-1 | Cloudinary | 2-3日 | - |
| Phase 3-2 | Geolocation | 1-2日 | - |
| Phase 3-3 | Google Sheets | 2-3日 | - |
| Phase 3-4 | SNS共有 | 2-3日 | - |
| **Phase 3 合計** | | **7-11日** | |

**Phase 2 推奨スケジュール**: 2週間（2/8 - 2/22）  
**Phase 3 推奨スケジュール**: 2026年3月以降（任意）

---

## 🔐 環境変数の追加設定（Phase 2 必須）

Phase 2 実装前に以下の環境変数を設定する必要がある：

### .env.local（実値あり・Git管理対象外）

```env
# Firebase（必須）
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSy...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=sanposhin-reborn.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=sanposhin-reborn
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=sanposhin-reborn.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abcdef

# Cloudinary（Phase 3 で使用）
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=
```

### .env.sample（変数名のみ・公開リポジトリ）

```env
# Firebase
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=

# Cloudinary
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=
```

---

## 📝 ドキュメント更新履歴

| 版 | 日付 | 内容 |
|---|------|------|
| v01 | 2026/2/1 | 初版（14項目差異抽出） |
| v02 | 2026/2/1 | Phase 1 完了反映 |
| **v03** | **2026/2/1** | **Phase 2 詳細計画・工数見積もり** |

---

**最終ステータス**: 🟡 **Phase 2 実装計画確定 / 実装開始準備完了**  
**次回更新**: 2026/2/22 (Phase 2 完了時点で v04 作成予定)  
**推奨アクション**: Firebase プロジェクト作成 → 環境変数設定 → Phase 2-1 実装開始
