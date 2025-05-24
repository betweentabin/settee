const express = require('express');
const router = express.Router();
const pointController = require('../controllers/point.controller');
const { protect, requireStudentVerification } = require('../middlewares/auth.middleware');
const { body } = require('express-validator');
const { handleValidationErrors } = require('../middlewares/validation.middleware');

// 招待コード適用のバリデーション
const validateInviteCode = [
  body('inviteCode')
    .notEmpty().withMessage('招待コードは必須です')
    .isLength({ min: 6, max: 10 }).withMessage('招待コードは6〜10文字で入力してください'),
  
  handleValidationErrors
];

// ポイント残高取得
router.get('/balance', protect, pointController.getPointBalance);

// ポイント取引履歴取得
router.get('/transactions', protect, pointController.getPointTransactions);

// 友達招待ポイント付与
router.post('/invite', protect, requireStudentVerification, validateInviteCode, pointController.awardInvitePoints);

module.exports = router;
