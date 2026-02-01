# 差異修復レポート（DIFF_REPAIR）

## 対象

* 差異レポート: REQUIREMENTS_DIFF.md
* 対応項目: **🔴 重大な差異 1. パスワード再設定（新規発行）機能**

## 実施日

2026年2月1日

---

## 1. 修復方針（実装）

### ゴール

* **ログイン中ユーザーのみ**が実行可能
* **既存パスワードの確認・表示は行わない**
* **新しい7文字パスワードを設定した時点で旧パスワードは即時無効化**
* 再設定完了時に**一度だけ新パスワードを通知**（表示）

### セキュリティ前提

* 平文パスワードは**保存しない**
* 保存するのは**ハッシュのみ**（`sanposhin_password_hash`）

---

## 2. 実装内容（要約）

### UI 追加（マイページ）

* 「パスワードを再設定」ボタンを追加
* 確認ダイアログを表示（取り消し可能）

### 処理フロー

1. ログイン状態を検証（`sanposhin_userId` の存在）
2. 新しい7文字パスワードを生成
3. bcrypt でハッシュ化
4. `sanposhin_password_hash` を**上書き保存**（旧ハッシュ無効化）
5. 新パスワードを**一度だけ表示**し、控えを促す

### 疑似コード

```ts
import bcrypt from 'bcryptjs';

const handlePasswordReset = async () => {
  // 1. ログインチェック
  const userId = localStorage.getItem('sanposhin_userId');
  if (!userId) {
    alert('ログイン中のユーザーのみ実行できます');
    return;
  }

  // 2. 新規パスワード生成（7文字）
  const newPassword = generatePassword(7);

  // 3. ハッシュ化して保存（上書き）
  const hash = await bcrypt.hash(newPassword, 10);
  localStorage.setItem('sanposhin_password_hash', hash);

  // 4. 一度だけ通知
  alert(`新しいパスワードです。必ず控えてください：\n${newPassword}`);
};
```

---

## 3. 検証観点（チェックリスト）

* [ ] ログインしていない場合、再設定できない
* [ ] 既存パスワードの表示・確認が行われない
* [ ] 再設定後、**旧パスワードでログイン不可**
* [ ] 新パスワードでログイン可能
* [ ] ローカルストレージに**平文パスワードが存在しない**

---

## 4. 要件定義への反映（修正点）

> 本対応により、要件定義 §4.3.3 は**内容を明確化**する修正が必要。

### 修正前（抜粋｜§4.3.3）

```
- ログイン中のユーザーのみ実行可能
- 既存パスワードの確認（表示）は一切行わない
- 新しい7文字パスワードを設定した時点で、旧パスワードは即時無効化
```

### 修正後（反映案｜§4.3.3）

```
- ログイン中のユーザーのみ実行可能
- 既存パスワードの確認・表示・復元は一切行わない
- パスワードは平文で保存せず、ハッシュ化したもののみを保持する
- 新しい7文字パスワードを設定した時点で、旧パスワードは即時無効化する
- 再設定完了時に限り、新パスワードを一度だけユーザーに表示する
```

※ 本修正は **セキュリティ要件の明文化**であり、要件の後退ではありません。

---

## 5. 関連差異への影響

* 差異 2（平文保存）・差異 3（バックアップに含有）は**本対応のみでは未解消**
* ただし、**再設定後は平文を扱わない設計**に統一され、後続修正の前提が整う

---

## 6. ステータス

* 対応範囲（差異 1）: **修復完了**
* 次対応候補: 差異 2 → 差異 3（Phase 1 継続）

---

## 7. データ永続化・セキュリティ・同期設計（Phase 2 確定仕様）

本章は REQUIREMENTS_DIFF_vol03.md を正式に要件定義へ昇格させた **確定仕様** である。
実装・レビュー・評価は本章を唯一の根拠とする。

---

## 7.1 データ責務分離（SSOT）

```text
Firestore = 正（Single Source of Truth）
localStorage = キャッシュ / オフラインフォールバック
Cloudinary = 画像資産
```

* Firestore が利用可能な場合は必ず Firestore を優先
* localStorage は通信失敗時の一時保存のみ
* 復旧時に Firestore → localStorage 同期を行う

---

## 7.2 復元機能（3ストライク + 60分ロック）【必須】

### 7.2.1 要件

* 復元失敗は **3回まで**
* 3回失敗で **60分ロック**
* ロック中は復元操作不可
* 成功時にカウンター完全リセット

### 7.2.2 データ構造

```ts
interface RestoreAttempt {
  failureCount: number;      // 0-3
  lockUntil?: number;        // Unix timestamp
  lastFailedAt?: number;
}
```

### 7.2.3 UX要件

* 残り回数表示（例: 残り2回）
* ロック中はボタン無効化
* ロック解除時刻の明示

---

## 7.3 Firebase Firestore 永続化（Phase 2 MVP条件）

### 7.3.1 ユーザー管理

* `/users/{userId}` に保存
* ユーザーIDは **Firestore存在チェック必須**
* 重複不可・削除後も再利用不可

```ts
interface UserProfile {
  userId: string;
  passwordHash: string;
  createdAt: string;
  totalAdventures: number;
}
```

---

### 7.3.2 冒険ログ

* `/users/{userId}/logs/{logId}`
* Firestore 永続化が正
* localStorage はフォールバック

```ts
interface UserLog {
  id?: string;
  userId: string;
  missionId: string;
  missionText: string;
  imageUrl?: string;
  imageData?: string;
  memo?: string;
  createdAt: string;
}
```

---

## 7.4 アカウント削除（GDPR準拠）【必須】

### 削除範囲

1. Firestore `/users/{userId}`
2. Firestore `/users/{userId}/logs/*`
3. localStorage 全削除

* UI上で「削除」と入力させる
* 処理は取り消し不可

---

## 7.5 バックアップ・復元（完全仕様）

### 7.5.1 バックアップ形式

```ts
interface BackupData {
  version: "1.0.0";
  userId: string;
  createdAt: string;
  logs: UserLog[];
}
```

* **passwordHash を含めない**

---

### 7.5.2 復元条件

* ユーザーID一致
* パスワード一致
* ロック解除状態

---

## 7.6 エラーハンドリング統一仕様

| 種別          | 対応              |
| ----------- | --------------- |
| ネットワーク断     | localStorage 保存 |
| Firestore失敗 | フォールバック         |
| 容量超過        | ユーザー通知          |

---

## 7.7 オフライン・PWA

* Service Worker 明示登録
* manifest.json 完備
* オフライン時でも閲覧・保存可能

---

## 8. Phase 2 完了条件（Definition of Done）

* 復元ロックが動作
* Firestore CRUD 完全実装
* アカウント削除可能
* バックアップ復元成功
* オフライン対応確認

---

## 9. Phase 3（拡張）

* Cloudinary 画像保存
* Geolocation
* Google Sheets ミッション管理
* SNS共有

---

**本章は REQUIREMENTS_DIFF_vol03.md を完全反映した確定要件である。**

