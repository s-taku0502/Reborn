# Phase 2 実装タスクリスト

**期間**: 2026/2/8 - 2/22  
**目標**: データ永続化・セキュリティ完成（本番サービス展開可能状態）

---

## 📋 タスク一覧

### 🔄 進行中
- なし

### ✅ 完了
- [x] Phase 1: パスワード再設定機能（2026/2/1 完了）

### ⏳ 未着手

#### 2-1. 復元機能の完全実装（3ストライク + 60分ロック）
**優先度**: 🔴 高  
**工数**: 2-3日  
**担当ファイル**: `app/mypage/page.tsx`

- [ ] `RestoreAttempt` インターフェース実装
- [ ] localStorage への失敗回数保存
- [ ] ロック状態チェック機能
- [ ] 残り回数表示UI
- [ ] ロック中のボタン無効化
- [ ] 60分ロックタイマー実装
- [ ] 成功時のカウンターリセット

**参照**: requirements_definition.md §4.4

---

#### 2-2A. Firebase Firestore - ユーザー登録連携
**優先度**: 🔴 高  
**工数**: 3-4日  
**担当ファイル**: `lib/firestore.ts`（新規）, `app/setup/page.tsx`

- [ ] Firebase プロジェクト作成
- [ ] `.env.local` 環境変数設定
- [ ] `lib/firestore.ts` 作成
- [ ] `checkUserIdExists()` 実装
- [ ] `createUser()` 実装
- [ ] `getUser()` 実装
- [ ] setup/page.tsx に重複チェック組み込み
- [ ] Firestore へのユーザープロフィール保存

**参照**: requirements_definition.md §7.1.1

---

#### 2-2B. Firebase Firestore - ログ保存連携
**優先度**: 🔴 高  
**工数**: 2-3日  
**担当ファイル**: `lib/firestore.ts`, `app/record/page.tsx`

- [ ] `saveLogToFirestore()` 実装
- [ ] `getLogsFromFirestore()` 実装
- [ ] record/page.tsx にFirestore保存組み込み
- [ ] エラー時のlocalStorageフォールバック
- [ ] album/page.tsx のFirestoreからの読み込み

**参照**: requirements_definition.md §7.1.2

---

#### 2-3. アカウント削除機能
**優先度**: 🔴 高  
**工数**: 1-2日  
**担当ファイル**: `lib/firestore.ts`, `app/mypage/page.tsx`

- [ ] `deleteUserAccount()` 実装
- [ ] ログコレクション全削除処理
- [ ] ユーザードキュメント削除処理
- [ ] 「削除」テキスト入力確認UI
- [ ] localStorage 全削除
- [ ] セットアップ画面へリダイレクト

**参照**: requirements_definition.md §4.5

---

#### 2-4. エラーハンドリング強化
**優先度**: 🟡 中  
**工数**: 2-3日  
**担当ファイル**: `lib/errorHandler.ts`（新規）, 各ページ

- [ ] `lib/errorHandler.ts` 作成
- [ ] `getErrorMessage()` 実装
- [ ] オフライン検知 (`navigator.onLine`)
- [ ] QuotaExceededError ハンドリング
- [ ] Firestore接続エラーハンドリング
- [ ] 全ページへのエラーハンドラー適用

**参照**: requirements_definition.md §9

---

#### 2-5. バックアップ・復元の完全実装
**優先度**: 🟡 中  
**工数**: 2-3日  
**担当ファイル**: `app/mypage/page.tsx`

- [ ] バックアップ形式を version 1.0.0 に更新
- [ ] ファイル選択UI実装
- [ ] JSON パース・バージョンチェック
- [ ] Firestoreへの復元処理
- [ ] localStorageへのキャッシュ
- [ ] 復元成功時の通知

**参照**: requirements_definition.md §7.2

---

#### 2-6. PWA設定強化
**優先度**: 🟢 低  
**工数**: 1日  
**担当ファイル**: `public/sw.js`（新規）, `public/manifest.json`

- [ ] Service Worker 作成 (`public/sw.js`)
- [ ] キャッシュ戦略実装
- [ ] manifest.json 完全版作成
- [ ] アイコン準備 (192x192, 512x512)
- [ ] Next.js への Service Worker 登録

**参照**: requirements_definition.md §10

---

#### 2-7. オフライン同期機能
**優先度**: 🟡 中  
**工数**: 2日  
**担当ファイル**: `lib/syncManager.ts`（新規）

- [ ] `lib/syncManager.ts` 作成
- [ ] オンライン/オフライン検知
- [ ] localStorage → Firestore 同期処理
- [ ] バックグラウンド同期実装
- [ ] 同期ステータス表示

**参照**: requirements_definition.md §3.1

---

## 📅 スケジュール（詳細）

### Week 1 (2/8 - 2/14)
- **2/8 (月)**: 2-1 復元ロック実装開始
- **2/9 (火)**: 2-1 復元ロック完成・テスト
- **2/10 (水)**: 2-2A Firebase設計・lib/firestore.ts作成
- **2/11 (木)**: 2-2A ユーザー登録のFirestore連携
- **2/12 (金)**: 2-2B ログ保存のFirestore連携
- **週末**: テスト・バグ修正

### Week 2 (2/15 - 2/21)
- **2/15 (月)**: 2-3 アカウント削除機能
- **2/16 (火)**: 2-4 エラーハンドリング開始
- **2/17 (水)**: 2-4 エラーハンドリング完成
- **2/18 (木)**: 2-5 バックアップ・復元実装
- **2/19 (金)**: 2-6 PWA設定 + 2-7 同期機能
- **週末**: 統合テスト・デバッグ

### Week 3 (2/22)
- **2/22 (土)**: Phase 2 完了確認・vol04レポート作成

---

## ✅ Phase 2 完了条件

### 機能面
- [ ] 復元機能が3ストライク + 60分ロックで動作する
- [ ] ユーザー登録時にFirestoreにデータが保存される
- [ ] ユーザーID重複チェックが機能する
- [ ] ログ保存時にFirestoreに永続化される
- [ ] アカウント削除機能が動作する
- [ ] ネットワークエラー時に適切なメッセージが表示される
- [ ] オフライン時もlocalStorageで動作する
- [ ] バックアップファイルから復元できる

### 技術面
- [ ] TypeScript コンパイルエラーなし
- [ ] `npm run build` が成功する
- [ ] Firebase接続テスト成功（本番環境）
- [ ] localStorage ↔ Firestore 同期が正常動作

### ドキュメント面
- [ ] REQUIREMENTS_DIFF_vol04.md 作成
- [ ] README.md 更新（環境変数設定手順）

---

## 📝 メモ・注意事項

- Firebase プロジェクトは実装前に作成必須
- `.env.local` は Git 管理対象外（.gitignore 確認）
- Firestore セキュリティルールは Phase 2 完了後に設定
- 画像はまだ Base64（Cloudinary は Phase 3）

---

**最終更新**: 2026/2/1  
**ステータス**: Phase 2 開始準備完了
