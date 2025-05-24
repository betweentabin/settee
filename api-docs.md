# Settee バックエンド API ドキュメント

## 概要

このドキュメントは、SetteeアプリケーションのバックエンドAPIの仕様を定義します。APIはRESTful原則に従い、JSONフォーマットでデータをやり取りします。

## ベースURL

```
https://api.settee-app.example.com/api
```

## 認証

ほとんどのAPIエンドポイントでは認証が必要です。認証はJWTトークンを使用します。

### 認証ヘッダー

```
Authorization: Bearer <token>
```

## レスポンス形式

すべてのAPIレスポンスは以下の形式に従います：

```json
{
  "success": true|false,
  "message": "レスポンスメッセージ",
  "data": { ... } | [ ... ],
  "error": "エラーメッセージ（エラー時のみ）"
}
```

## エラーコード

| ステータスコード | 説明 |
|--------------|------|
| 200 | 成功 |
| 201 | リソース作成成功 |
| 400 | 不正なリクエスト |
| 401 | 認証エラー |
| 403 | 権限エラー |
| 404 | リソースが見つからない |
| 500 | サーバーエラー |

## API エンドポイント

### 認証 API

#### ユーザー登録

```
POST /auth/register
```

**リクエスト**

```json
{
  "name": "山田太郎",
  "userId": "yamada_taro",
  "email": "yamada@example.com",
  "password": "Password123",
  "birthDate": "2000-01-01"
}
```

**レスポンス**

```json
{
  "success": true,
  "message": "ユーザー登録が完了しました。確認メールを送信しました。",
  "data": {
    "userId": "yamada_taro",
    "name": "山田太郎",
    "email": "yamada@example.com"
  }
}
```

#### ログイン

```
POST /auth/login
```

**リクエスト**

```json
{
  "email": "yamada@example.com",
  "password": "Password123"
}
```

**レスポンス**

```json
{
  "success": true,
  "message": "ログインに成功しました",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "60d21b4667d0d8992e610c85",
      "userId": "yamada_taro",
      "name": "山田太郎",
      "email": "yamada@example.com",
      "profileImage": "https://example.com/profile.jpg",
      "verificationStatus": {
        "isEmailVerified": true,
        "isStudentIdVerified": false
      },
      "points": 0
    }
  }
}
```

#### ログアウト

```
POST /auth/logout
```

**レスポンス**

```json
{
  "success": true,
  "message": "ログアウトしました"
}
```

#### パスワードリセットメール送信

```
POST /auth/reset-password
```

**リクエスト**

```json
{
  "email": "yamada@example.com"
}
```

**レスポンス**

```json
{
  "success": true,
  "message": "パスワードリセットメールを送信しました"
}
```

#### ユーザープロフィール取得

```
GET /auth/profile
```

**レスポンス**

```json
{
  "success": true,
  "data": {
    "id": "60d21b4667d0d8992e610c85",
    "userId": "yamada_taro",
    "name": "山田太郎",
    "email": "yamada@example.com",
    "birthDate": "2000-01-01T00:00:00.000Z",
    "profileImage": "https://example.com/profile.jpg",
    "verificationStatus": {
      "isEmailVerified": true,
      "isStudentIdVerified": false
    },
    "points": 0,
    "settings": {
      "notifications": {
        "messages": true,
        "requests": true,
        "pins": true,
        "system": true
      },
      "theme": "system",
      "language": "ja"
    },
    "inviteCode": "ABC123XY",
    "createdAt": "2021-06-22T12:34:56.789Z"
  }
}
```

#### 学生証認証

```
POST /auth/verify-student
```

**リクエスト**

```json
{
  "studentIdImageUrl": "https://storage.example.com/student-id/123456.jpg"
}
```

**レスポンス**

```json
{
  "success": true,
  "message": "学生証認証が完了しました",
  "data": {
    "verificationStatus": {
      "isEmailVerified": true,
      "isStudentIdVerified": true,
      "studentIdImageUrl": "https://storage.example.com/student-id/123456.jpg",
      "verificationDate": "2023-05-22T12:34:56.789Z"
    },
    "points": 100
  }
}
```

### ピン API

#### ピン作成

```
POST /pins
```

**リクエスト**

```json
{
  "title": "一緒に勉強しませんか？",
  "description": "図書館で数学のレポートを一緒にやりましょう！",
  "location": {
    "coordinates": [139.7671, 35.6812],
    "address": "東京都千代田区丸の内1-1-1"
  },
  "dateTime": "2023-05-25T15:00:00.000Z"
}
```

**レスポンス**

```json
{
  "success": true,
  "message": "ピンが作成されました",
  "data": {
    "pin": {
      "_id": "60d21b4667d0d8992e610c86",
      "creatorId": "60d21b4667d0d8992e610c85",
      "title": "一緒に勉強しませんか？",
      "description": "図書館で数学のレポートを一緒にやりましょう！",
      "location": {
        "type": "Point",
        "coordinates": [139.7671, 35.6812],
        "address": "東京都千代田区丸の内1-1-1"
      },
      "dateTime": "2023-05-25T15:00:00.000Z",
      "status": "active",
      "participants": ["60d21b4667d0d8992e610c85"],
      "requests": [],
      "createdAt": "2023-05-22T12:34:56.789Z",
      "updatedAt": "2023-05-22T12:34:56.789Z"
    },
    "points": 20
  }
}
```

#### ピン一覧取得

```
GET /pins?latitude=35.6812&longitude=139.7671&radius=5000&limit=20&skip=0
```

**レスポンス**

```json
{
  "success": true,
  "count": 2,
  "total": 10,
  "data": [
    {
      "_id": "60d21b4667d0d8992e610c86",
      "creatorId": {
        "_id": "60d21b4667d0d8992e610c85",
        "name": "山田太郎",
        "userId": "yamada_taro",
        "profileImage": "https://example.com/profile.jpg"
      },
      "title": "一緒に勉強しませんか？",
      "description": "図書館で数学のレポートを一緒にやりましょう！",
      "location": {
        "type": "Point",
        "coordinates": [139.7671, 35.6812],
        "address": "東京都千代田区丸の内1-1-1"
      },
      "dateTime": "2023-05-25T15:00:00.000Z",
      "status": "active",
      "participants": ["60d21b4667d0d8992e610c85"],
      "createdAt": "2023-05-22T12:34:56.789Z",
      "updatedAt": "2023-05-22T12:34:56.789Z"
    },
    {
      "_id": "60d21b4667d0d8992e610c87",
      "creatorId": {
        "_id": "60d21b4667d0d8992e610c88",
        "name": "佐藤花子",
        "userId": "sato_hanako",
        "profileImage": "https://example.com/profile2.jpg"
      },
      "title": "カフェでプログラミング",
      "description": "JavaScriptの課題をやります。一緒にどうですか？",
      "location": {
        "type": "Point",
        "coordinates": [139.7654, 35.6789],
        "address": "東京都渋谷区渋谷1-1-1"
      },
      "dateTime": "2023-05-26T13:00:00.000Z",
      "status": "active",
      "participants": ["60d21b4667d0d8992e610c88"],
      "createdAt": "2023-05-22T13:45:56.789Z",
      "updatedAt": "2023-05-22T13:45:56.789Z"
    }
  ]
}
```

#### ピン詳細取得

```
GET /pins/:pinId
```

**レスポンス**

```json
{
  "success": true,
  "data": {
    "_id": "60d21b4667d0d8992e610c86",
    "creatorId": {
      "_id": "60d21b4667d0d8992e610c85",
      "name": "山田太郎",
      "userId": "yamada_taro",
      "profileImage": "https://example.com/profile.jpg"
    },
    "title": "一緒に勉強しませんか？",
    "description": "図書館で数学のレポートを一緒にやりましょう！",
    "location": {
      "type": "Point",
      "coordinates": [139.7671, 35.6812],
      "address": "東京都千代田区丸の内1-1-1"
    },
    "dateTime": "2023-05-25T15:00:00.000Z",
    "status": "active",
    "participants": [
      {
        "_id": "60d21b4667d0d8992e610c85",
        "name": "山田太郎",
        "userId": "yamada_taro",
        "profileImage": "https://example.com/profile.jpg"
      }
    ],
    "requests": [
      {
        "_id": "60d21b4667d0d8992e610c89",
        "userId": "60d21b4667d0d8992e610c88",
        "message": "一緒に勉強したいです！",
        "status": "pending",
        "createdAt": "2023-05-22T14:00:00.000Z"
      }
    ],
    "createdAt": "2023-05-22T12:34:56.789Z",
    "updatedAt": "2023-05-22T14:00:00.789Z"
  }
}
```

#### ピン更新

```
PUT /pins/:pinId
```

**リクエスト**

```json
{
  "title": "一緒に勉強しませんか？（更新）",
  "description": "図書館で数学とプログラミングのレポートを一緒にやりましょう！",
  "location": {
    "coordinates": [139.7671, 35.6812],
    "address": "東京都千代田区丸の内1-1-1 図書館"
  },
  "dateTime": "2023-05-25T16:00:00.000Z"
}
```

**レスポンス**

```json
{
  "success": true,
  "message": "ピンが更新されました",
  "data": {
    "_id": "60d21b4667d0d8992e610c86",
    "creatorId": {
      "_id": "60d21b4667d0d8992e610c85",
      "name": "山田太郎",
      "userId": "yamada_taro",
      "profileImage": "https://example.com/profile.jpg"
    },
    "title": "一緒に勉強しませんか？（更新）",
    "description": "図書館で数学とプログラミングのレポートを一緒にやりましょう！",
    "location": {
      "type": "Point",
      "coordinates": [139.7671, 35.6812],
      "address": "東京都千代田区丸の内1-1-1 図書館"
    },
    "dateTime": "2023-05-25T16:00:00.000Z",
    "status": "active",
    "participants": ["60d21b4667d0d8992e610c85"],
    "requests": [
      {
        "_id": "60d21b4667d0d8992e610c89",
        "userId": "60d21b4667d0d8992e610c88",
        "message": "一緒に勉強したいです！",
        "status": "pending",
        "createdAt": "2023-05-22T14:00:00.000Z"
      }
    ],
    "createdAt": "2023-05-22T12:34:56.789Z",
    "updatedAt": "2023-05-22T15:00:00.789Z"
  }
}
```

#### ピン削除

```
DELETE /pins/:pinId
```

**レスポンス**

```json
{
  "success": true,
  "message": "ピンが削除されました"
}
```

#### ピンリクエスト送信

```
POST /pins/:pinId/requests
```

**リクエスト**

```json
{
  "message": "一緒に勉強したいです！"
}
```

**レスポンス**

```json
{
  "success": true,
  "message": "リクエストが送信されました",
  "data": {
    "requestId": "60d21b4667d0d8992e610c89"
  }
}
```

#### ピンリクエスト一覧取得

```
GET /pins/:pinId/requests
```

**レスポンス**

```json
{
  "success": true,
  "count": 2,
  "data": [
    {
      "id": "60d21b4667d0d8992e610c89",
      "user": {
        "_id": "60d21b4667d0d8992e610c88",
        "name": "佐藤花子",
        "userId": "sato_hanako",
        "profileImage": "https://example.com/profile2.jpg"
      },
      "message": "一緒に勉強したいです！",
      "status": "pending",
      "createdAt": "2023-05-22T14:00:00.000Z"
    },
    {
      "id": "60d21b4667d0d8992e610c90",
      "user": {
        "_id": "60d21b4667d0d8992e610c91",
        "name": "鈴木一郎",
        "userId": "suzuki_ichiro",
        "profileImage": "https://example.com/profile3.jpg"
      },
      "message": "参加させてください！",
      "status": "pending",
      "createdAt": "2023-05-22T14:30:00.000Z"
    }
  ]
}
```

#### ピンリクエスト承認/拒否

```
PUT /pins/:pinId/requests/:requestId
```

**リクエスト**

```json
{
  "status": "approved" // または "rejected"
}
```

**レスポンス**

```json
{
  "success": true,
  "message": "リクエストが承認されました",
  "data": {
    "requestId": "60d21b4667d0d8992e610c89",
    "status": "approved"
  }
}
```

### チャット API

#### チャットルーム一覧取得

```
GET /chats
```

**レスポンス**

```json
{
  "success": true,
  "count": 2,
  "data": [
    {
      "id": "60d21b4667d0d8992e610c92",
      "pinId": {
        "_id": "60d21b4667d0d8992e610c86",
        "title": "一緒に勉強しませんか？"
      },
      "participants": [
        {
          "_id": "60d21b4667d0d8992e610c85",
          "name": "山田太郎",
          "userId": "yamada_taro",
          "profileImage": "https://example.com/profile.jpg"
        },
        {
          "_id": "60d21b4667d0d8992e610c88",
          "name": "佐藤花子",
          "userId": "sato_hanako",
          "profileImage": "https://example.com/profile2.jpg"
        }
      ],
      "lastMessage": {
        "text": "何時に集合しますか？",
        "senderId": {
          "_id": "60d21b4667d0d8992e610c88",
          "name": "佐藤花子",
          "userId": "sato_hanako"
        },
        "timestamp": "2023-05-22T15:30:00.000Z"
      },
      "unreadCount": 1,
      "createdAt": "2023-05-22T14:10:00.000Z"
    },
    {
      "id": "60d21b4667d0d8992e610c93",
      "pinId": {
        "_id": "60d21b4667d0d8992e610c87",
        "title": "カフェでプログラミング"
      },
      "participants": [
        {
          "_id": "60d21b4667d0d8992e610c85",
          "name": "山田太郎",
          "userId": "yamada_taro",
          "profileImage": "https://example.com/profile.jpg"
        },
        {
          "_id": "60d21b4667d0d8992e610c88",
          "name": "佐藤花子",
          "userId": "sato_hanako",
          "profileImage": "https://example.com/profile2.jpg"
        }
      ],
      "lastMessage": {
        "text": "よろしくお願いします！",
        "senderId": {
          "_id": "60d21b4667d0d8992e610c85",
          "name": "山田太郎",
          "userId": "yamada_taro"
        },
        "timestamp": "2023-05-22T14:20:00.000Z"
      },
      "unreadCount": 0,
      "createdAt": "2023-05-22T14:15:00.000Z"
    }
  ]
}
```

#### チャットルーム詳細取得

```
GET /chats/:chatId
```

**レスポンス**

```json
{
  "success": true,
  "data": {
    "_id": "60d21b4667d0d8992e610c92",
    "pinId": {
      "_id": "60d21b4667d0d8992e610c86",
      "title": "一緒に勉強しませんか？",
      "description": "図書館で数学のレポートを一緒にやりましょう！",
      "dateTime": "2023-05-25T15:00:00.000Z",
      "location": {
        "type": "Point",
        "coordinates": [139.7671, 35.6812],
        "address": "東京都千代田区丸の内1-1-1"
      }
    },
    "participants": [
      {
        "_id": "60d21b4667d0d8992e610c85",
        "name": "山田太郎",
        "userId": "yamada_taro",
        "profileImage": "https://example.com/profile.jpg"
      },
      {
        "_id": "60d21b4667d0d8992e610c88",
        "name": "佐藤花子",
        "userId": "sato_hanako",
        "profileImage": "https://example.com/profile2.jpg"
      }
    ],
    "createdAt": "2023-05-22T14:10:00.000Z",
    "updatedAt": "2023-05-22T15:30:00.000Z"
  }
}
```

#### メッセージ一覧取得

```
GET /chats/:chatId/messages?limit=50&before=2023-05-22T15:30:00.000Z
```

**レスポンス**

```json
{
  "success": true,
  "count": 3,
  "data": [
    {
      "_id": "60d21b4667d0d8992e610c94",
      "chatId": "60d21b4667d0d8992e610c92",
      "senderId": {
        "_id": "60d21b4667d0d8992e610c85",
        "name": "山田太郎",
        "userId": "yamada_taro",
        "profileImage": "https://example.com/profile.jpg"
      },
      "text": "こんにちは！リクエストを承認しました。",
      "readBy": ["60d21b4667d0d8992e610c85", "60d21b4667d0d8992e610c88"],
      "createdAt": "2023-05-22T14:10:00.000Z"
    },
    {
      "_id": "60d21b4667d0d8992e610c95",
      "chatId": "60d21b4667d0d8992e610c92",
      "senderId": {
        "_id": "60d21b4667d0d8992e610c88",
        "name": "佐藤花子",
        "userId": "sato_hanako",
        "profileImage": "https://example.com/profile2.jpg"
      },
      "text": "ありがとうございます！よろしくお願いします。",
      "readBy": ["60d21b4667d0d8992e610c85", "60d21b4667d0d8992e610c88"],
      "createdAt": "2023-05-22T14:15:00.000Z"
    },
    {
      "_id": "60d21b4667d0d8992e610c96",
      "chatId": "60d21b4667d0d8992e610c92",
      "senderId": {
        "_id": "60d21b4667d0d8992e610c88",
        "name": "佐藤花子",
        "userId": "sato_hanako",
        "profileImage": "https://example.com/profile2.jpg"
      },
      "text": "何時に集合しますか？",
      "readBy": ["60d21b4667d0d8992e610c88"],
      "createdAt": "2023-05-22T15:30:00.000Z"
    }
  ]
}
```

#### メッセージ送信

```
POST /chats/:chatId/messages
```

**リクエスト**

```json
{
  "text": "15時に図書館の入り口で会いましょう！"
}
```

**レスポンス**

```json
{
  "success": true,
  "message": "メッセージが送信されました",
  "data": {
    "_id": "60d21b4667d0d8992e610c97",
    "chatId": "60d21b4667d0d8992e610c92",
    "senderId": {
      "_id": "60d21b4667d0d8992e610c85",
      "name": "山田太郎",
      "userId": "yamada_taro",
      "profileImage": "https://example.com/profile.jpg"
    },
    "text": "15時に図書館の入り口で会いましょう！",
    "readBy": ["60d21b4667d0d8992e610c85"],
    "createdAt": "2023-05-22T15:35:00.000Z"
  }
}
```

#### 既読ステータス更新

```
PUT /chats/:chatId/read
```

**レスポンス**

```json
{
  "success": true,
  "message": "既読ステータスが更新されました",
  "data": {
    "updatedCount": 2
  }
}
```

### ポイント API

#### ポイント残高取得

```
GET /points/balance
```

**レスポンス**

```json
{
  "success": true,
  "data": {
    "points": 150
  }
}
```

#### ポイント取引履歴取得

```
GET /points/transactions?limit=20&skip=0&type=earn
```

**レスポンス**

```json
{
  "success": true,
  "count": 3,
  "total": 5,
  "data": [
    {
      "_id": "60d21b4667d0d8992e610c98",
      "userId": "60d21b4667d0d8992e610c85",
      "type": "earn",
      "amount": 100,
      "description": "学生証認証ボーナス",
      "relatedId": null,
      "createdAt": "2023-05-22T13:00:00.000Z"
    },
    {
      "_id": "60d21b4667d0d8992e610c99",
      "userId": "60d21b4667d0d8992e610c85",
      "type": "earn",
      "amount": 20,
      "description": "ピン作成ボーナス",
      "relatedId": "60d21b4667d0d8992e610c86",
      "createdAt": "2023-05-22T12:34:56.789Z"
    },
    {
      "_id": "60d21b4667d0d8992e610c9a",
      "userId": "60d21b4667d0d8992e610c85",
      "type": "earn",
      "amount": 10,
      "description": "ピンリクエスト承認ボーナス",
      "relatedId": "60d21b4667d0d8992e610c88",
      "createdAt": "2023-05-22T14:05:00.000Z"
    }
  ]
}
```

#### 友達招待ポイント付与

```
POST /points/invite
```

**リクエスト**

```json
{
  "inviteCode": "XYZ789AB"
}
```

**レスポンス**

```json
{
  "success": true,
  "message": "招待コードが適用され、ポイントが付与されました",
  "data": {
    "inviterPoints": 250,
    "yourPoints": 200
  }
}
```

### 位置情報 API

#### ユーザー位置情報更新

```
PUT /location/update
```

**リクエスト**

```json
{
  "coordinates": [139.7671, 35.6812]
}
```

**レスポンス**

```json
{
  "success": true,
  "message": "位置情報が更新されました",
  "data": {
    "location": {
      "type": "Point",
      "coordinates": [139.7671, 35.6812],
      "lastUpdated": "2023-05-22T16:00:00.000Z"
    }
  }
}
```

#### 近くのユーザー検索

```
GET /location/nearby?latitude=35.6812&longitude=139.7671&radius=1000&limit=20
```

**レスポンス**

```json
{
  "success": true,
  "count": 2,
  "data": [
    {
      "_id": "60d21b4667d0d8992e610c88",
      "name": "佐藤花子",
      "userId": "sato_hanako",
      "profileImage": "https://example.com/profile2.jpg",
      "location": {
        "type": "Point",
        "coordinates": [139.7654, 35.6789],
        "lastUpdated": "2023-05-22T15:55:00.000Z"
      }
    },
    {
      "_id": "60d21b4667d0d8992e610c91",
      "name": "鈴木一郎",
      "userId": "suzuki_ichiro",
      "profileImage": "https://example.com/profile3.jpg",
      "location": {
        "type": "Point",
        "coordinates": [139.7680, 35.6820],
        "lastUpdated": "2023-05-22T15:58:00.000Z"
      }
    }
  ]
}
```

### 設定 API

#### ユーザー設定取得

```
GET /settings
```

**レスポンス**

```json
{
  "success": true,
  "data": {
    "notifications": {
      "messages": true,
      "requests": true,
      "pins": true,
      "system": true
    },
    "theme": "system",
    "language": "ja"
  }
}
```

#### ユーザー設定更新

```
PUT /settings
```

**リクエスト**

```json
{
  "notifications": {
    "messages": true,
    "requests": true,
    "pins": false,
    "system": true
  },
  "theme": "dark",
  "language": "ja"
}
```

**レスポンス**

```json
{
  "success": true,
  "message": "設定が更新されました",
  "data": {
    "notifications": {
      "messages": true,
      "requests": true,
      "pins": false,
      "system": true
    },
    "theme": "dark",
    "language": "ja"
  }
}
```

## WebSocket API

WebSocketを使用したリアルタイム通信は、Socket.IOを使用して実装されています。

### 接続

```javascript
const socket = io('https://api.settee-app.example.com', {
  auth: {
    token: 'JWT_TOKEN'
  }
});
```

### イベント

#### 接続イベント

```javascript
socket.on('connect', () => {
  console.log('接続成功');
});

socket.on('error', (error) => {
  console.error('エラー:', error);
});
```

#### チャットルーム参加

```javascript
socket.emit('join_chat', 'CHAT_ID');
```

#### チャットルーム退出

```javascript
socket.emit('leave_chat', 'CHAT_ID');
```

#### メッセージ送信

```javascript
socket.emit('send_message', {
  chatId: 'CHAT_ID',
  text: 'こんにちは！'
});
```

#### 新規メッセージ受信

```javascript
socket.on('new_message', (data) => {
  console.log('新規メッセージ:', data);
  // data = { chatId, message }
});
```

#### タイピング状態通知

```javascript
socket.emit('typing', {
  chatId: 'CHAT_ID',
  isTyping: true
});
```

#### タイピング状態受信

```javascript
socket.on('user_typing', (data) => {
  console.log('タイピング状態:', data);
  // data = { chatId, user, isTyping }
});
```

#### 既読ステータス更新

```javascript
socket.emit('mark_as_read', {
  chatId: 'CHAT_ID',
  messageIds: ['MESSAGE_ID_1', 'MESSAGE_ID_2'] // オプション
});
```

#### 既読ステータス受信

```javascript
socket.on('messages_read', (data) => {
  console.log('既読ステータス:', data);
  // data = { chatId, userId, messageIds }
});
```

#### 位置情報更新

```javascript
socket.emit('update_location', {
  coordinates: [139.7671, 35.6812]
});
```

## セキュリティ

- すべてのAPIリクエストはHTTPS経由で行われます
- 認証にはJWTトークンを使用します
- トークンの有効期限は7日間です
- レート制限が適用されています
- 入力検証が実装されています
- XSS対策が実装されています
- CORS設定が適切に構成されています

## エラーハンドリング

エラーが発生した場合、APIは適切なHTTPステータスコードとエラーメッセージを返します。

```json
{
  "success": false,
  "message": "エラーメッセージ",
  "error": "詳細なエラー情報（開発環境のみ）"
}
```

## 無料枠の利用

このAPIは以下の無料サービスを利用しています：

- MongoDB Atlas: 無料枠（512MB）
- Firebase Authentication: 無料枠（月間10,000認証）
- Firebase Storage: 無料枠（5GB）
- MapTiler: 無料枠（月間10万リクエスト）
- Vercel/Railway: 無料枠（ホスティング）

## デプロイ

APIは以下の環境変数を必要とします：

```
PORT=5000
NODE_ENV=production
MONGODB_URI=mongodb+srv://...
JWT_SECRET=your_jwt_secret
FRONTEND_URL=https://settee-app.example.com
FIREBASE_SERVICE_ACCOUNT={"type":"service_account",...}
```

## バージョン情報

API Version: 1.0.0
最終更新日: 2023年5月22日
