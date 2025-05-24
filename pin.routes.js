const express = require('express');
const router = express.Router();
const pinController = require('../controllers/pin.controller');
const { protect, requireStudentVerification } = require('../middlewares/auth.middleware');
const { body } = require('express-validator');
const { handleValidationErrors } = require('../middlewares/validation.middleware');

// ピン作成のバリデーション
const validateCreatePin = [
  body('title')
    .notEmpty().withMessage('タイトルは必須です')
    .isLength({ min: 3, max: 100 }).withMessage('タイトルは3〜100文字で入力してください'),
  
  body('description')
    .notEmpty().withMessage('説明は必須です')
    .isLength({ min: 10, max: 1000 }).withMessage('説明は10〜1000文字で入力してください'),
  
  body('location.coordinates')
    .isArray().withMessage('位置情報は配列である必要があります')
    .custom((value) => {
      if (!Array.isArray(value) || value.length !== 2) {
        throw new Error('位置情報は[経度, 緯度]の形式で入力してください');
      }
      return true;
    }),
  
  body('dateTime')
    .notEmpty().withMessage('日時は必須です')
    .isISO8601().withMessage('有効な日付形式で入力してください'),
  
  handleValidationErrors
];

// ピンリクエストのバリデーション
const validatePinRequest = [
  body('message')
    .notEmpty().withMessage('メッセージは必須です')
    .isLength({ min: 10, max: 500 }).withMessage('メッセージは10〜500文字で入力してください'),
  
  handleValidationErrors
];

// ピン作成
router.post('/', protect, requireStudentVerification, validateCreatePin, pinController.createPin);

// ピン一覧取得
router.get('/', protect, pinController.getPins);

// ピン詳細取得
router.get('/:pinId', protect, pinController.getPinById);

// ピン更新
router.put('/:pinId', protect, requireStudentVerification, pinController.updatePin);

// ピン削除
router.delete('/:pinId', protect, pinController.deletePin);

// ピンリクエスト送信
router.post('/:pinId/requests', protect, requireStudentVerification, validatePinRequest, pinController.sendPinRequest);

// ピンリクエスト一覧取得
router.get('/:pinId/requests', protect, pinController.getPinRequests);

// ピンリクエスト承認/拒否
router.put('/:pinId/requests/:requestId', protect, pinController.respondToPinRequest);

module.exports = router;
