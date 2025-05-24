const User = require('../models/user.model');

// ユーザー位置情報更新
const updateUserLocation = async (req, res) => {
  try {
    const userId = req.user.id;
    const { coordinates } = req.body;

    // 入力検証
    if (!coordinates || !Array.isArray(coordinates) || coordinates.length !== 2) {
      return res.status(400).json({
        success: false,
        message: '位置情報は[経度, 緯度]の形式で入力してください'
      });
    }

    // ユーザーの存在確認
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'ユーザーが見つかりません'
      });
    }

    // 位置情報の更新
    user.location = {
      type: 'Point',
      coordinates: coordinates,
      lastUpdated: new Date()
    };

    await user.save();

    res.status(200).json({
      success: true,
      message: '位置情報が更新されました',
      data: {
        location: user.location
      }
    });
  } catch (error) {
    console.error('位置情報更新エラー:', error);
    res.status(500).json({
      success: false,
      message: 'サーバーエラーが発生しました',
      error: error.message
    });
  }
};

// 近くのユーザー検索
const getNearbyUsers = async (req, res) => {
  try {
    const userId = req.user.id;
    const { latitude, longitude, radius = 1000, limit = 20 } = req.query;

    // 入力検証
    if (!latitude || !longitude) {
      return res.status(400).json({
        success: false,
        message: '位置情報が必要です'
      });
    }

    // 近くのユーザーを検索
    const nearbyUsers = await User.find({
      _id: { $ne: userId }, // 自分以外
      'location.coordinates': {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [parseFloat(longitude), parseFloat(latitude)]
          },
          $maxDistance: parseInt(radius)
        }
      },
      'verificationStatus.isStudentIdVerified': true // 学生証認証済みのみ
    })
      .select('name userId profileImage location')
      .limit(parseInt(limit));

    res.status(200).json({
      success: true,
      count: nearbyUsers.length,
      data: nearbyUsers
    });
  } catch (error) {
    console.error('近くのユーザー検索エラー:', error);
    res.status(500).json({
      success: false,
      message: 'サーバーエラーが発生しました',
      error: error.message
    });
  }
};

module.exports = {
  updateUserLocation,
  getNearbyUsers
};
