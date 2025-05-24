const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { protect, verifyFirebaseToken } = require('../middlewares/auth.middleware');

// ユーザー登録
router.post('/register', authController.registerUser);

// ログイン
router.post('/login', verifyFirebaseToken, authController.loginUser);

// ログアウト
router.post('/logout', protect, authController.logoutUser);

// パスワードリセットメール送信
router.post('/reset-password', authController.sendPasswordResetEmail);

// ユーザープロフィール取得
router.get('/profile', protect, authController.getUserProfile);

// 学生証認証
router.post('/verify-student', protect, authController.verifyStudentId);

module.exports = router;
