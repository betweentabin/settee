# Settee アプリケーション設計書

## アーキテクチャ概要

Setteeアプリは、学生向けのマッチングプラットフォームとして、以下のアーキテクチャで構築します。

### 全体アーキテクチャ

Setteeアプリは、モバイルアプリケーションとして、以下の技術スタックで実装します：

- **フロントエンド**: React Native（iOS/Android両対応）
- **バックエンド**: Node.js + Express
- **データベース**: MongoDB（ユーザー情報、ピン情報、チャットデータなど）
- **認証**: Firebase Authentication
- **リアルタイム通信**: Socket.io（チャット機能、リアルタイム通知）
- **地図API**: Google Maps API
- **ストレージ**: Firebase Cloud Storage（プロフィール画像、学生証画像など）
- **プッシュ通知**: Firebase Cloud Messaging

### アプリケーション層構造

1. **プレゼンテーション層**
   - UI/UXコンポーネント
   - 画面遷移管理
   - ユーザー入力処理

2. **ビジネスロジック層**
   - ユーザー認証・認可
   - マッチングアルゴリズム
   - ポイント管理システム
   - 位置情報処理

3. **データアクセス層**
   - APIクライアント
   - ローカルストレージ管理
   - キャッシュ管理

4. **インフラストラクチャ層**
   - ネットワーク通信
   - エラーハンドリング
   - ロギング

## データモデル設計

### ユーザーモデル
```json
{
  "userId": "String (UUID)",
  "name": "String",
  "username": "String (一意のID)",
  "email": "String (学校メールアドレス)",
  "birthDate": "Date",
  "profileImage": "String (URL)",
  "verificationStatus": {
    "isEmailVerified": "Boolean",
    "isStudentIdVerified": "Boolean",
    "studentIdImages": ["String (URL)"],
    "faceImage": "String (URL)",
    "verificationDate": "Date"
  },
  "points": "Number",
  "createdAt": "Date",
  "lastLogin": "Date",
  "settings": {
    "notifications": "Boolean",
    "locationSharing": "Boolean",
    "theme": "String"
  }
}
```

### ピンモデル
```json
{
  "pinId": "String (UUID)",
  "creatorId": "String (ユーザーID)",
  "title": "String",
  "description": "String",
  "location": {
    "latitude": "Number",
    "longitude": "Number",
    "address": "String"
  },
  "dateTime": "Date",
  "isToday": "Boolean",
  "status": "String (active, matched, expired)",
  "participants": ["String (ユーザーID)"],
  "requests": [{
    "userId": "String",
    "message": "String",
    "status": "String (pending, accepted, rejected)",
    "timestamp": "Date"
  }],
  "createdAt": "Date",
  "expiresAt": "Date"
}
```

### チャットモデル
```json
{
  "chatId": "String (UUID)",
  "pinId": "String (関連するピンID)",
  "participants": ["String (ユーザーID)"],
  "messages": [{
    "senderId": "String (ユーザーID)",
    "content": "String",
    "timestamp": "Date",
    "readBy": ["String (ユーザーID)"]
  }],
  "createdAt": "Date",
  "lastActivity": "Date"
}
```

### ポイント取引モデル
```json
{
  "transactionId": "String (UUID)",
  "userId": "String (ユーザーID)",
  "type": "String (earn, spend)",
  "amount": "Number",
  "description": "String",
  "relatedEntityId": "String (関連するエンティティID)",
  "timestamp": "Date"
}
```

## 画面遷移設計

### 認証フロー
1. スプラッシュ画面
2. 新規登録/ログイン選択画面
3. 新規登録フロー
   - 名前入力
   - ID設定
   - 生年月日入力
   - 学校メールアドレス入力
   - パスワード設定
   - プロフィール写真設定
   - 学生証アップロード（オプション）
4. チュートリアル
5. ホーム画面

### メインナビゲーション
- ホーム（マップ）
- ピン作成
- チャット一覧
- プロフィール
- 設定

### ホーム画面フロー
1. マップ表示（位置情報ベース）
2. ピン詳細表示
3. リクエスト送信
4. マッチング通知
5. チャットルーム

### ピン作成フロー
1. 位置選択
2. 日時設定
3. 詳細情報入力
4. 確認・投稿

### プロフィールフロー
1. プロフィール表示
2. 編集画面
3. 学生証認証状況
4. ポイント履歴

### 設定フロー
1. アカウント設定
2. 通知設定
3. プライバシー設定
4. ヘルプ・サポート
5. 解約手続き

## UI/UXデザイン方針

### デザインシステム
- **カラーパレット**:
  - プライマリ: #6200EE（紫）
  - セカンダリ: #03DAC6（ティール）
  - アクセント: #FF4081（ピンク）
  - 背景: #121212（ダークグレー）
  - テキスト: #FFFFFF（白）、#B0B0B0（薄いグレー）

- **タイポグラフィ**:
  - 見出し: Roboto Bold
  - 本文: Roboto Regular
  - アクセント: Roboto Medium

- **コンポーネント**:
  - ボタン: 角丸長方形、グラデーション背景
  - カード: 角丸、微妙な影付き
  - 入力フィールド: 下線スタイル、フォーカス時アニメーション
  - アイコン: シンプルな線画スタイル

### アニメーションとトランジション
- 画面遷移: スライドアニメーション
- ボタン押下: リップルエフェクト
- リスト項目: フェードイン
- マップピン: バウンスアニメーション
- マッチング成立: 祝福アニメーション

### アクセシビリティ
- 十分なコントラスト比
- スクリーンリーダー対応
- タッチターゲットサイズの最適化
- カスタマイズ可能なフォントサイズ

## 機能モジュール詳細設計

### 認証モジュール
- Firebase Authenticationを使用
- メールアドレス認証
- 学生証認証プロセス
- セッション管理

### 位置情報モジュール
- Google Maps APIとの連携
- リアルタイム位置更新
- ジオフェンシング
- 位置情報のプライバシー設定

### ピン管理モジュール
- ピン作成・編集・削除
- 日時指定機能
- 当日ピンの優先表示ロジック
- ピン検索・フィルタリング

### マッチングモジュール
- リクエスト送信・受信
- 承認・拒否処理
- マッチングアルゴリズム
- 複数マッチング管理

### チャットモジュール
- リアルタイムメッセージング
- グループチャット
- 既読機能
- メディア共有

### ポイントシステムモジュール
- ポイント獲得ロジック
- ポイント消費機能
- 特典・アイテム交換
- ポイント履歴管理

### 通知モジュール
- プッシュ通知
- アプリ内通知
- 通知設定
- イベントトリガー

### 友達招待モジュール
- 招待リンク生成
- QRコード共有
- SNS連携
- 招待特典処理

## セキュリティ設計

### データ保護
- エンドツーエンド暗号化（チャット）
- 安全なデータストレージ
- 個人情報の最小限収集

### 認証・認可
- 多要素認証
- トークンベースの認証
- 権限管理

### プライバシー対策
- 位置情報の選択的共有
- プロフィール情報の公開範囲設定
- データ削除オプション

### 不正利用対策
- アカウント検証
- 学生証認証
- 報告・ブロック機能
- 自動モデレーション

## パフォーマンス最適化

### ネットワーク最適化
- データ圧縮
- キャッシュ戦略
- バックグラウンド同期

### バッテリー消費最適化
- 位置情報取得の最適化
- バックグラウンド処理の制限
- 効率的なプッシュ通知

### メモリ管理
- 画像リサイズ
- リソースの遅延読み込み
- メモリリーク防止

## テスト戦略

### 単体テスト
- コアロジックのテスト
- モデルバリデーション
- ユーティリティ関数

### 統合テスト
- APIエンドポイント
- データフロー
- コンポーネント間連携

### UIテスト
- 画面遷移
- ユーザーインタラクション
- レスポンシブデザイン

### パフォーマンステスト
- 負荷テスト
- メモリ使用量
- バッテリー消費

## 拡張性と将来計画

### スケーラビリティ
- マイクロサービスアーキテクチャ
- 水平スケーリング対応
- キャッシュ層の導入

### 将来機能
- AIベースのマッチング推奨
- イベント機能の拡張
- コミュニティ機能
- 学校別コミュニティ

### 国際化対応
- 多言語サポート
- 地域別カスタマイズ
- タイムゾーン対応

## 実装ロードマップ

### フェーズ1: 基本機能
- 認証システム
- プロフィール管理
- 基本的なマップ表示
- シンプルなピン作成

### フェーズ2: コア機能
- マッチングシステム
- チャット機能
- ポイントシステム基本実装
- 学生証認証

### フェーズ3: 拡張機能
- 友達招待システム
- 高度なフィルタリング
- ポイント交換機能
- 通知システムの強化

### フェーズ4: 最適化と拡張
- パフォーマンス最適化
- UI/UX改善
- 追加機能の実装
- フィードバックに基づく調整
