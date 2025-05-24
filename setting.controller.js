const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/auth.middleware');
const User = require('../models/user.model');

// ユーザー設定取得
const getUserSettings = async (req, res) => {
  try {
    const userId = req.user.id;

    // ユーザーの存在確認
    const user = await User.findById(userId).select('settings');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'ユーザーが見つかりません'
      });
    }

    res.status(200).json({
      success: true,
      data: user.settings
    });
  } catch (error) {
    console.error('設定取得エラー:', error);
    res.status(500).json({
      success: false,
      message: 'サーバーエラーが発生しました',
      error: error.message
    });
  }
};

// ユーザー設定更新
const updateUserSettings = async (req, res) => {
  try {
    const userId = req.user.id;
    const { notifications, theme, language } = req.body;

    // ユーザーの存在確認
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'ユーザーが見つかりません'
      });
    }

    // 設定の更新
    if (notifications) {
      user.settings.notifications = {
        ...user.settings.notifications,
        ...notifications
      };
    }

    if (theme) {
      user.settings.theme = theme;
    }

    if (language) {
      user.settings.language = language;
    }

    await user.save();

    res.status(200).json({
      success: true,
      message: '設定が更新されました',
      data: user.settings
    });
  } catch (error) {
    console.error('設定更新エラー:', error);
    res.status(500).json({
      success: false,
      message: 'サーバーエラーが発生しました',
      error: error.message
    });
  }
};

module.exports = {
  getUserSettings,
  updateUserSettings
};
