const jwt = require('jsonwebtoken');
const { admin } = require('../config/firebase');
const User = require('../models/user.model');

// JWT認証ミドルウェア
const protect = async (req, res, next) => {
  try {
    let token;
    
    // Authorization ヘッダーからトークンを取得
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: '認証トークンがありません。ログインしてください。'
      });
    }
    
    // JWTトークンの検証
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // ユーザーの存在確認
    const user = await User.findById(decoded.id);
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'ユーザーが存在しません'
      });
    }
    
    // リクエストオブジェクトにユーザー情報を追加
    req.user = {
      id: user._id,
      firebaseUid: user.firebaseUid,
      role: decoded.role || 'user'
    };
    
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: '無効なトークンです'
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'トークンの有効期限が切れています'
      });
    }
    
    console.error('認証エラー:', error);
    res.status(500).json({
      success: false,
      message: 'サーバーエラーが発生しました',
      error: error.message
    });
  }
};

// Firebase IDトークン検証ミドルウェア
const verifyFirebaseToken = async (req, res, next) => {
  try {
    const idToken = req.headers.authorization?.split('Bearer ')[1];
    
    if (!idToken) {
      return res.status(401).json({
        success: false,
        message: '認証トークンがありません'
      });
    }
    
    // Firebaseトークンを検証
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    
    // リクエストオブジェクトにFirebase情報を追加
    req.firebase = {
      uid: decodedToken.uid,
      email: decodedToken.email,
      emailVerified: decodedToken.email_verified
    };
    
    next();
  } catch (error) {
    console.error('Firebase認証エラー:', error);
    res.status(401).json({
      success: false,
      message: '認証に失敗しました',
      error: error.message
    });
  }
};

// 学生証認証済みチェックミドルウェア
const requireStudentVerification = async (req, res, next) => {
  try {
    const userId = req.user.id;
    
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'ユーザーが見つかりません'
      });
    }
    
    if (!user.verificationStatus.isStudentIdVerified) {
      return res.status(403).json({
        success: false,
        message: '学生証認証が必要です'
      });
    }
    
    next();
  } catch (error) {
    console.error('学生証認証チェックエラー:', error);
    res.status(500).json({
      success: false,
      message: 'サーバーエラーが発生しました',
      error: error.message
    });
  }
};

module.exports = {
  protect,
  verifyFirebaseToken,
  requireStudentVerification
};
