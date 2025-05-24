const admin = require('firebase-admin');

// Firebase Admin SDKの初期化
// 実際の環境では、サービスアカウントキーは環境変数から取得するか、
// Google Cloud環境の場合は自動的に認証される
const initializeFirebaseAdmin = () => {
  // 環境変数からサービスアカウントキーを取得する場合
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    try {
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
      });
      console.log('Firebase Admin SDK initialized with service account');
    } catch (error) {
      console.error('Error initializing Firebase Admin SDK:', error);
      process.exit(1);
    }
  } 
  // サービスアカウントキーファイルを使用する場合
  else if (process.env.FIREBASE_SERVICE_ACCOUNT_PATH) {
    try {
      const serviceAccount = require(process.env.FIREBASE_SERVICE_ACCOUNT_PATH);
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
      });
      console.log('Firebase Admin SDK initialized with service account file');
    } catch (error) {
      console.error('Error initializing Firebase Admin SDK:', error);
      process.exit(1);
    }
  }
  // デフォルト認証情報を使用する場合（Google Cloud環境など）
  else {
    try {
      admin.initializeApp({
        credential: admin.credential.applicationDefault()
      });
      console.log('Firebase Admin SDK initialized with default credentials');
    } catch (error) {
      console.error('Error initializing Firebase Admin SDK:', error);
      process.exit(1);
    }
  }
};

module.exports = {
  admin,
  initializeFirebaseAdmin
};
