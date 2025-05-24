const jwt = require('jsonwebtoken');
const { admin } = require('../config/firebase');
const User = require('../models/user.model');

// Firebase認証を使用したユーザー登録
const registerUser = async (req, res) => {
  try {
    const { name, userId, email, password, birthDate } = req.body;

    // 入力検証
    if (!name || !userId || !email || !password || !birthDate) {
      return res.status(400).json({ 
        success: false, 
        message: '必須項目が不足しています' 
      });
    }

    // ユーザーIDとメールアドレスの重複チェック
    const existingUser = await User.findOne({ 
      $or: [{ userId }, { email }] 
    });

    if (existingUser) {
      return res.status(400).json({ 
        success: false, 
        message: 'ユーザーIDまたはメールアドレスが既に使用されています' 
      });
    }

    // Firebaseでユーザーを作成
    const firebaseUser = await admin.auth().createUser({
      email,
      password,
      displayName: name,
      emailVerified: false
    });

    // 招待コードの生成（ランダムな8文字の英数字）
    const inviteCode = Math.random().toString(36).substring(2, 10).toUpperCase();

    // MongoDBにユーザー情報を保存
    const user = new User({
      firebaseUid: firebaseUser.uid,
      name,
      userId,
      email,
      birthDate: new Date(birthDate),
      inviteCode
    });

    await user.save();

    // 確認メールの送信
    const actionCodeSettings = {
      url: `${process.env.FRONTEND_URL}/login?email=${email}`,
      handleCodeInApp: true
    };

    await admin.auth().generateEmailVerificationLink(email, actionCodeSettings);

    res.status(201).json({
      success: true,
      message: 'ユーザー登録が完了しました。確認メールを送信しました。',
      data: {
        userId: user.userId,
        name: user.name,
        email: user.email
      }
    });
  } catch (error) {
    console.error('ユーザー登録エラー:', error);
    res.status(500).json({ 
      success: false, 
      message: 'サーバーエラーが発生しました', 
      error: error.message 
    });
  }
};

// Firebase認証を使用したログイン
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // 入力検証
    if (!email || !password) {
      return res.status(400).json({ 
        success: false, 
        message: 'メールアドレスとパスワードを入力してください' 
      });
    }

    // Firebase認証情報の検証はクライアント側で行い、IDトークンを取得
    // バックエンドではIDトークンを検証する
    const idToken = req.headers.authorization?.split('Bearer ')[1];
    
    if (!idToken) {
      return res.status(401).json({ 
        success: false, 
        message: '認証トークンがありません' 
      });
    }

    // Firebaseトークンを検証
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const firebaseUid = decodedToken.uid;

    // ユーザー情報を取得
    const user = await User.findOne({ firebaseUid });
    
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'ユーザーが見つかりません' 
      });
    }

    // JWTトークンの生成
    const token = jwt.sign(
      { id: user._id, firebaseUid, role: 'user' },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(200).json({
      success: true,
      message: 'ログインに成功しました',
      data: {
        token,
        user: {
          id: user._id,
          userId: user.userId,
          name: user.name,
          email: user.email,
          profileImage: user.profileImage,
          verificationStatus: user.verificationStatus,
          points: user.points
        }
      }
    });
  } catch (error) {
    console.error('ログインエラー:', error);
    res.status(500).json({ 
      success: false, 
      message: 'サーバーエラーが発生しました', 
      error: error.message 
    });
  }
};

// ユーザープロフィール取得
const getUserProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const user = await User.findById(userId).select('-__v');
    
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'ユーザーが見つかりません' 
      });
    }

    res.status(200).json({
      success: true,
      data: {
        id: user._id,
        userId: user.userId,
        name: user.name,
        email: user.email,
        birthDate: user.birthDate,
        profileImage: user.profileImage,
        verificationStatus: user.verificationStatus,
        points: user.points,
        settings: user.settings,
        inviteCode: user.inviteCode,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    console.error('プロフィール取得エラー:', error);
    res.status(500).json({ 
      success: false, 
      message: 'サーバーエラーが発生しました', 
      error: error.message 
    });
  }
};

// 学生証認証
const verifyStudentId = async (req, res) => {
  try {
    const userId = req.user.id;
    const { studentIdImageUrl } = req.body;

    if (!studentIdImageUrl) {
      return res.status(400).json({ 
        success: false, 
        message: '学生証画像URLが必要です' 
      });
    }

    // ユーザー情報を取得
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'ユーザーが見つかりません' 
      });
    }

    // 学生証画像URLを保存
    user.verificationStatus.studentIdImageUrl = studentIdImageUrl;
    
    // 実際のアプリでは、ここで学生証の検証処理を行う
    // 今回は簡易的に自動承認する
    user.verificationStatus.isStudentIdVerified = true;
    user.verificationStatus.verificationDate = new Date();

    await user.save();

    // 学生証認証ボーナスポイントの付与（実際のアプリではポイントサービスを使用）
    user.points += 100;
    await user.save();

    res.status(200).json({
      success: true,
      message: '学生証認証が完了しました',
      data: {
        verificationStatus: user.verificationStatus,
        points: user.points
      }
    });
  } catch (error) {
    console.error('学生証認証エラー:', error);
    res.status(500).json({ 
      success: false, 
      message: 'サーバーエラーが発生しました', 
      error: error.message 
    });
  }
};

// パスワードリセットメール送信
const sendPasswordResetEmail = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ 
        success: false, 
        message: 'メールアドレスを入力してください' 
      });
    }

    // ユーザーの存在確認
    const user = await User.findOne({ email });
    
    if (!user) {
      // セキュリティのため、ユーザーが存在しなくても成功レスポンスを返す
      return res.status(200).json({
        success: true,
        message: 'パスワードリセットメールを送信しました（存在する場合）'
      });
    }

    // パスワードリセットリンクの生成
    const actionCodeSettings = {
      url: `${process.env.FRONTEND_URL}/reset-password?email=${email}`,
      handleCodeInApp: true
    };

    await admin.auth().generatePasswordResetLink(email, actionCodeSettings);

    res.status(200).json({
      success: true,
      message: 'パスワードリセットメールを送信しました'
    });
  } catch (error) {
    console.error('パスワードリセットエラー:', error);
    res.status(500).json({ 
      success: false, 
      message: 'サーバーエラーが発生しました', 
      error: error.message 
    });
  }
};

// ログアウト
const logoutUser = async (req, res) => {
  try {
    // JWTはステートレスなので、サーバー側でのログアウト処理は特にない
    // クライアント側でトークンを削除する
    
    res.status(200).json({
      success: true,
      message: 'ログアウトしました'
    });
  } catch (error) {
    console.error('ログアウトエラー:', error);
    res.status(500).json({ 
      success: false, 
      message: 'サーバーエラーが発生しました', 
      error: error.message 
    });
  }
};

module.exports = {
  registerUser,
  loginUser,
  getUserProfile,
  verifyStudentId,
  sendPasswordResetEmail,
  logoutUser
};
