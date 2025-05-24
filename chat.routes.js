const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chat.controller');
const { protect, requireStudentVerification } = require('../middlewares/auth.middleware');
const { body } = require('express-validator');
const { handleValidationErrors } = require('../middlewares/validation.middleware');

// メッセージ送信のバリデーション
const validateSendMessage = [
  body('text')
    .notEmpty().withMessage('メッセージは必須です')
    .isLength({ max: 1000 }).withMessage('メッセージは1000文字以内で入力してください'),
  
  handleValidationErrors
];

// チャットルーム一覧取得
router.get('/', protect, chatController.getChatRooms);

// チャットルーム詳細取得
router.get('/:chatId', protect, chatController.getChatRoomById);

// メッセージ一覧取得
router.get('/:chatId/messages', protect, chatController.getMessages);

// メッセージ送信
router.post('/:chatId/messages', protect, requireStudentVerification, validateSendMessage, chatController.sendMessage);

// 既読ステータス更新
router.put('/:chatId/read', protect, chatController.markAsRead);

module.exports = router;
