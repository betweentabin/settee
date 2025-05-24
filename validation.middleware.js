const { body, validationResult } = require('express-validator');

// バリデーションエラーを処理するミドルウェア
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'バリデーションエラー',
      errors: errors.array()
    });
  }
  next();
};

// ユーザー登録バリデーション
const validateRegister = [
  body('name')
    .notEmpty().withMessage('名前は必須です')
    .isLength({ min: 2, max: 50 }).withMessage('名前は2〜50文字で入力してください'),
  
  body('userId')
    .notEmpty().withMessage('ユーザーIDは必須です')
    .isLength({ min: 3, max: 20 }).withMessage('ユーザーIDは3〜20文字で入力してください')
    .matches(/^[a-zA-Z0-9_]+$/).withMessage('ユーザーIDは英数字とアンダースコアのみ使用できます'),
  
  body('email')
    .notEmpty().withMessage('メールアドレスは必須です')
    .isEmail().withMessage('有効なメールアドレスを入力してください'),
  
  body('password')
    .notEmpty().withMessage('パスワードは必須です')
    .isLength({ min: 8 }).withMessage('パスワードは8文字以上で入力してください')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/).withMessage('パスワードは大文字、小文字、数字を含める必要があります'),
  
  body('birthDate')
    .notEmpty().withMessage('生年月日は必須です')
    .isISO8601().withMessage('有効な日付形式で入力してください'),
  
  handleValidationErrors
];

// ログインバリデーション
const validateLogin = [
  body('email')
    .notEmpty().withMessage('メールアドレスは必須です')
    .isEmail().withMessage('有効なメールアドレスを入力してください'),
  
  body('password')
    .notEmpty().withMessage('パスワードは必須です'),
  
  handleValidationErrors
];

// パスワードリセットバリデーション
const validatePasswordReset = [
  body('email')
    .notEmpty().withMessage('メールアドレスは必須です')
    .isEmail().withMessage('有効なメールアドレスを入力してください'),
  
  handleValidationErrors
];

// 学生証認証バリデーション
const validateStudentVerification = [
  body('studentIdImageUrl')
    .notEmpty().withMessage('学生証画像URLは必須です')
    .isURL().withMessage('有効なURLを入力してください'),
  
  handleValidationErrors
];

module.exports = {
  validateRegister,
  validateLogin,
  validatePasswordReset,
  validateStudentVerification,
  handleValidationErrors
};
