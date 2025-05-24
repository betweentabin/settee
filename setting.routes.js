const express = require('express');
const router = express.Router();
const settingController = require('../controllers/setting.controller');
const { protect } = require('../middlewares/auth.middleware');
const { body } = require('express-validator');
const { handleValidationErrors } = require('../middlewares/validation.middleware');

// 設定更新のバリデーション
const validateSettingsUpdate = [
  body('notifications')
    .optional()
    .isObject().withMessage('通知設定はオブジェクト形式である必要があります'),
  
  body('notifications.messages')
    .optional()
    .isBoolean().withMessage('メッセージ通知設定は真偽値である必要があります'),
  
  body('notifications.requests')
    .optional()
    .isBoolean().withMessage('リクエスト通知設定は真偽値である必要があります'),
  
  body('notifications.pins')
    .optional()
    .isBoolean().withMessage('ピン通知設定は真偽値である必要があります'),
  
  body('notifications.system')
    .optional()
    .isBoolean().withMessage('システム通知設定は真偽値である必要があります'),
  
  body('theme')
    .optional()
    .isIn(['light', 'dark', 'system']).withMessage('テーマは light, dark, system のいずれかである必要があります'),
  
  body('language')
    .optional()
    .isString().withMessage('言語は文字列である必要があります')
    .isLength({ min: 2, max: 5 }).withMessage('言語は2〜5文字で入力してください'),
  
  handleValidationErrors
];

// 設定取得
router.get('/', protect, settingController.getUserSettings);

// 設定更新
router.put('/', protect, validateSettingsUpdate, settingController.updateUserSettings);

module.exports = router;
