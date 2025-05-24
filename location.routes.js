const express = require('express');
const router = express.Router();
const locationController = require('../controllers/location.controller');
const { protect, requireStudentVerification } = require('../middlewares/auth.middleware');
const { body } = require('express-validator');
const { handleValidationErrors } = require('../middlewares/validation.middleware');

// 位置情報更新のバリデーション
const validateLocationUpdate = [
  body('coordinates')
    .isArray().withMessage('位置情報は配列である必要があります')
    .custom((value) => {
      if (!Array.isArray(value) || value.length !== 2) {
        throw new Error('位置情報は[経度, 緯度]の形式で入力してください');
      }
      return true;
    }),
  
  handleValidationErrors
];

// ユーザー位置情報更新
router.put('/update', protect, requireStudentVerification, validateLocationUpdate, locationController.updateUserLocation);

// 近くのユーザー検索
router.get('/nearby', protect, requireStudentVerification, locationController.getNearbyUsers);

module.exports = router;
