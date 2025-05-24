# Settee バックエンド実装 セットアップガイド

## 概要

このドキュメントでは、Setteeアプリケーションのバックエンドシステムのセットアップ方法と利用方法について説明します。

## 前提条件

以下のサービスのアカウントが必要です：

1. MongoDB Atlas（無料枠で十分）
2. Firebase（Authentication、Storage、Cloud Messagingを使用）
3. MapTiler（地図サービス用）
4. Vercel、Railway、またはHeroku（デプロイ用）

## 環境構築

### ローカル開発環境のセットアップ

1. リポジトリをクローン
```bash
git clone https://github.com/your-username/settee-backend.git
cd settee-backend
```

2. 依存パッケージのインストール
```bash
npm install
```

3. 環境変数の設定
`.env`ファイルを作成し、以下の内容を設定します：

```
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb+srv://...
JWT_SECRET=your_jwt_secret
FRONTEND_URL=http://localhost:3000
FIREBASE_SERVICE_ACCOUNT={"type":"service_account",...}
```

4. サーバーの起動
```bash
npm run dev
```

## ディレクトリ構造

```
settee-backend/
├── src/
│   ├── config/              # 設定ファイル
│   │   ├── database.js      # データベース接続設定
│   │   ├── firebase.js      # Firebase設定
│   │   ├── maptiler.js      # MapTiler API設定
│   │   └── socket.js        # Socket.IO設定
│   │
│   ├── controllers/         # APIコントローラー
│   │   ├── auth.controller.js
│   │   ├── user.controller.js
│   │   ├── pin.controller.js
│   │   ├── chat.controller.js
│   │   ├── point.controller.js
│   │   ├── notification.controller.js
│   │   ├── invite.controller.js
│   │   ├── setting.controller.js
│   │   └── location.controller.js
│   │
│   ├── models/              # データモデル
│   │   ├── user.model.js
│   │   ├── pin.model.js
│   │   ├── chatroom.model.js
│   │   ├── message.model.js
│   │   └── pointtransaction.model.js
│   │
│   ├── routes/              # APIルート定義
│   │   ├── auth.routes.js
│   │   ├── pin.routes.js
│   │   ├── chat.routes.js
│   │   ├── point.routes.js
│   │   ├── setting.routes.js
│   │   └── location.routes.js
│   │
│   ├── middlewares/         # ミドルウェア
│   │   ├── auth.middleware.js
│   │   ├── validation.middleware.js
│   │   └── error.middleware.js
│   │
│   ├── sockets/             # WebSocket処理
│   │   └── socket.js
│   │
│   ├── app.js               # Expressアプリケーション設定
│   └── server.js            # サーバー起動ファイル
│
├── .env                     # 環境変数
├── package.json             # 依存関係
└── api-docs.md              # APIドキュメント
```

## 主要機能

1. **ユーザー認証**
   - 登録、ログイン、ログアウト
   - パスワードリセット
   - 学生証認証

2. **ピン機能**
   - ピンの作成、取得、更新、削除
   - ピンリクエストの送信、承認、拒否

3. **チャット機能**
   - チャットルームの取得
   - メッセージの送受信
   - 既読ステータス管理

4. **ポイントシステム**
   - ポイント残高取得
   - ポイント取引履歴
   - 友達招待ポイント付与

5. **位置情報機能**
   - ユーザー位置情報更新
   - 近くのユーザー検索

6. **設定機能**
   - ユーザー設定の取得、更新

7. **リアルタイム通信**
   - WebSocketによるチャット
   - タイピング状態通知
   - 位置情報リアルタイム更新

8. **プッシュ通知**
   - Firebase Cloud Messagingによる通知

## API利用方法

詳細なAPI仕様は `api-docs.md` を参照してください。

### 基本的な利用フロー

1. ユーザー登録
```
POST /api/auth/register
```

2. ログイン
```
POST /api/auth/login
```

3. 認証が必要なAPIへのアクセス
```
Authorization: Bearer <token>
```

## デプロイ方法

### Vercelへのデプロイ

1. Vercelアカウントを作成

2. Vercel CLIをインストール
```bash
npm install -g vercel
```

3. デプロイ
```bash
vercel
```

4. 環境変数の設定
Vercelダッシュボードから環境変数を設定します。

### Railwayへのデプロイ

1. Railwayアカウントを作成

2. Railway CLIをインストール
```bash
npm install -g @railway/cli
```

3. ログイン
```bash
railway login
```

4. プロジェクト初期化
```bash
railway init
```

5. デプロイ
```bash
railway up
```

6. 環境変数の設定
Railwayダッシュボードから環境変数を設定します。

## 無料枠の利用について

このバックエンドシステムは、以下の無料サービスを利用しています：

1. **MongoDB Atlas**
   - 無料枠: 512MB
   - 注意点: データ量が増えた場合は定期的なクリーンアップが必要

2. **Firebase Authentication**
   - 無料枠: 月間10,000認証
   - 注意点: 大規模なユーザーベースになる場合は有料プランへの移行が必要

3. **Firebase Storage**
   - 無料枠: 5GB
   - 注意点: 画像は圧縮してアップロードすることを推奨

4. **MapTiler**
   - 無料枠: 月間10万リクエスト
   - 注意点: キャッシュ戦略を実装して使用量を抑える

5. **Vercel/Railway**
   - 無料枠: 基本的なホスティング
   - 注意点: 無料枠ではスリープ状態になる場合があるため、定期的なpingが必要

## スケーリング戦略

ユーザー数が増加した場合のスケーリング戦略：

1. **データベース**
   - MongoDB Atlasの有料プランへの移行
   - シャーディングの導入

2. **サーバー**
   - 水平スケーリング（複数インスタンス）
   - ロードバランサーの導入

3. **キャッシュ**
   - Redisの導入
   - CDNの活用

4. **マイクロサービス化**
   - 機能ごとのサービス分割
   - APIゲートウェイの導入

## トラブルシューティング

### よくある問題と解決策

1. **接続エラー**
   - MongoDB接続文字列の確認
   - ネットワーク設定の確認

2. **認証エラー**
   - JWTシークレットの確認
   - Firebaseサービスアカウントの確認

3. **WebSocketエラー**
   - CORSの設定確認
   - クライアント側の接続パラメータ確認

## セキュリティ対策

1. **認証・認可**
   - JWTトークンの使用
   - ロールベースアクセス制御

2. **データ保護**
   - 入力検証
   - XSS対策

3. **レート制限**
   - APIリクエスト制限
   - アカウント作成制限

4. **エラーハンドリング**
   - セキュアなエラーメッセージ
   - ログ記録

## メンテナンス

1. **定期的なバックアップ**
   - MongoDB Atlasの自動バックアップ設定

2. **ログ監視**
   - エラーログの定期確認
   - 異常なアクセスパターンの監視

3. **依存パッケージの更新**
   - セキュリティ更新の適用
   - 互換性の確認

## サポート

問題が発生した場合は、以下の情報を添えてご連絡ください：

1. エラーメッセージ
2. 発生時の状況
3. 環境情報（OS、Node.jsバージョンなど）

## ライセンス

このプロジェクトは独自ライセンスの下で提供されています。詳細については、ライセンスファイルを参照してください。
