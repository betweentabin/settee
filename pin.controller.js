const Pin = require('../models/pin.model');
const User = require('../models/user.model');

// ピン作成
const createPin = async (req, res) => {
  try {
    const { title, description, location, dateTime } = req.body;
    const creatorId = req.user.id;

    // 入力検証
    if (!title || !description || !location || !dateTime) {
      return res.status(400).json({
        success: false,
        message: '必須項目が不足しています'
      });
    }

    // 位置情報の検証
    if (!location.coordinates || location.coordinates.length !== 2) {
      return res.status(400).json({
        success: false,
        message: '位置情報が不正です'
      });
    }

    // ピンの作成
    const pin = new Pin({
      creatorId,
      title,
      description,
      location: {
        type: 'Point',
        coordinates: location.coordinates,
        address: location.address
      },
      dateTime: new Date(dateTime),
      participants: [creatorId] // 作成者を参加者に追加
    });

    await pin.save();

    // ピン作成ボーナスポイントの付与（実際のアプリではポイントサービスを使用）
    const user = await User.findById(creatorId);
    if (user) {
      user.points += 20;
      await user.save();
    }

    res.status(201).json({
      success: true,
      message: 'ピンが作成されました',
      data: {
        pin,
        points: user ? user.points : 0
      }
    });
  } catch (error) {
    console.error('ピン作成エラー:', error);
    res.status(500).json({
      success: false,
      message: 'サーバーエラーが発生しました',
      error: error.message
    });
  }
};

// ピン一覧取得
const getPins = async (req, res) => {
  try {
    const { latitude, longitude, radius = 5000, limit = 20, skip = 0 } = req.query;

    // 位置情報の検証
    if (!latitude || !longitude) {
      return res.status(400).json({
        success: false,
        message: '位置情報が必要です'
      });
    }

    // 位置情報に基づくピンの検索
    const pins = await Pin.find({
      'location.coordinates': {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [parseFloat(longitude), parseFloat(latitude)]
          },
          $maxDistance: parseInt(radius)
        }
      },
      status: 'active',
      dateTime: { $gte: new Date() } // 現在以降の日時のピンのみ
    })
      .sort({ dateTime: 1 }) // 日時の昇順
      .skip(parseInt(skip))
      .limit(parseInt(limit))
      .populate('creatorId', 'name userId profileImage')
      .select('-requests'); // リクエスト情報は除外

    // 総件数の取得
    const total = await Pin.countDocuments({
      'location.coordinates': {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [parseFloat(longitude), parseFloat(latitude)]
          },
          $maxDistance: parseInt(radius)
        }
      },
      status: 'active',
      dateTime: { $gte: new Date() }
    });

    res.status(200).json({
      success: true,
      count: pins.length,
      total,
      data: pins
    });
  } catch (error) {
    console.error('ピン一覧取得エラー:', error);
    res.status(500).json({
      success: false,
      message: 'サーバーエラーが発生しました',
      error: error.message
    });
  }
};

// ピン詳細取得
const getPinById = async (req, res) => {
  try {
    const { pinId } = req.params;

    const pin = await Pin.findById(pinId)
      .populate('creatorId', 'name userId profileImage')
      .populate('participants', 'name userId profileImage');

    if (!pin) {
      return res.status(404).json({
        success: false,
        message: 'ピンが見つかりません'
      });
    }

    res.status(200).json({
      success: true,
      data: pin
    });
  } catch (error) {
    console.error('ピン詳細取得エラー:', error);
    res.status(500).json({
      success: false,
      message: 'サーバーエラーが発生しました',
      error: error.message
    });
  }
};

// ピン更新
const updatePin = async (req, res) => {
  try {
    const { pinId } = req.params;
    const { title, description, location, dateTime, status } = req.body;
    const userId = req.user.id;

    // ピンの存在確認
    const pin = await Pin.findById(pinId);

    if (!pin) {
      return res.status(404).json({
        success: false,
        message: 'ピンが見つかりません'
      });
    }

    // 作成者のみ更新可能
    if (pin.creatorId.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'このピンを更新する権限がありません'
      });
    }

    // 更新データの準備
    const updateData = {};
    if (title) updateData.title = title;
    if (description) updateData.description = description;
    if (location) {
      updateData.location = {
        type: 'Point',
        coordinates: location.coordinates,
        address: location.address
      };
    }
    if (dateTime) updateData.dateTime = new Date(dateTime);
    if (status) updateData.status = status;

    // ピンの更新
    const updatedPin = await Pin.findByIdAndUpdate(
      pinId,
      updateData,
      { new: true }
    ).populate('creatorId', 'name userId profileImage');

    res.status(200).json({
      success: true,
      message: 'ピンが更新されました',
      data: updatedPin
    });
  } catch (error) {
    console.error('ピン更新エラー:', error);
    res.status(500).json({
      success: false,
      message: 'サーバーエラーが発生しました',
      error: error.message
    });
  }
};

// ピン削除
const deletePin = async (req, res) => {
  try {
    const { pinId } = req.params;
    const userId = req.user.id;

    // ピンの存在確認
    const pin = await Pin.findById(pinId);

    if (!pin) {
      return res.status(404).json({
        success: false,
        message: 'ピンが見つかりません'
      });
    }

    // 作成者のみ削除可能
    if (pin.creatorId.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'このピンを削除する権限がありません'
      });
    }

    // ピンの削除
    await Pin.findByIdAndDelete(pinId);

    res.status(200).json({
      success: true,
      message: 'ピンが削除されました'
    });
  } catch (error) {
    console.error('ピン削除エラー:', error);
    res.status(500).json({
      success: false,
      message: 'サーバーエラーが発生しました',
      error: error.message
    });
  }
};

// ピンリクエスト送信
const sendPinRequest = async (req, res) => {
  try {
    const { pinId } = req.params;
    const { message } = req.body;
    const userId = req.user.id;

    if (!message) {
      return res.status(400).json({
        success: false,
        message: 'メッセージは必須です'
      });
    }

    // ピンの存在確認
    const pin = await Pin.findById(pinId);

    if (!pin) {
      return res.status(404).json({
        success: false,
        message: 'ピンが見つかりません'
      });
    }

    // 自分のピンにはリクエスト不可
    if (pin.creatorId.toString() === userId) {
      return res.status(400).json({
        success: false,
        message: '自分のピンにリクエストを送ることはできません'
      });
    }

    // 既に参加者の場合はリクエスト不可
    if (pin.participants.includes(userId)) {
      return res.status(400).json({
        success: false,
        message: '既にこのピンに参加しています'
      });
    }

    // 既にリクエスト済みの場合は重複不可
    const existingRequest = pin.requests.find(
      req => req.userId.toString() === userId
    );

    if (existingRequest) {
      return res.status(400).json({
        success: false,
        message: '既にリクエストを送信済みです'
      });
    }

    // リクエストの追加
    pin.requests.push({
      userId,
      message,
      status: 'pending',
      createdAt: new Date()
    });

    await pin.save();

    res.status(201).json({
      success: true,
      message: 'リクエストが送信されました',
      data: {
        requestId: pin.requests[pin.requests.length - 1]._id
      }
    });
  } catch (error) {
    console.error('ピンリクエスト送信エラー:', error);
    res.status(500).json({
      success: false,
      message: 'サーバーエラーが発生しました',
      error: error.message
    });
  }
};

// ピンリクエスト一覧取得
const getPinRequests = async (req, res) => {
  try {
    const { pinId } = req.params;
    const userId = req.user.id;

    // ピンの存在確認
    const pin = await Pin.findById(pinId);

    if (!pin) {
      return res.status(404).json({
        success: false,
        message: 'ピンが見つかりません'
      });
    }

    // 作成者のみリクエスト一覧を取得可能
    if (pin.creatorId.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'このピンのリクエスト一覧を取得する権限がありません'
      });
    }

    // リクエスト一覧を取得
    const requests = await Promise.all(
      pin.requests.map(async (request) => {
        const user = await User.findById(request.userId).select('name userId profileImage');
        return {
          id: request._id,
          user,
          message: request.message,
          status: request.status,
          createdAt: request.createdAt
        };
      })
    );

    res.status(200).json({
      success: true,
      count: requests.length,
      data: requests
    });
  } catch (error) {
    console.error('ピンリクエスト一覧取得エラー:', error);
    res.status(500).json({
      success: false,
      message: 'サーバーエラーが発生しました',
      error: error.message
    });
  }
};

// ピンリクエスト承認/拒否
const respondToPinRequest = async (req, res) => {
  try {
    const { pinId, requestId } = req.params;
    const { status } = req.body;
    const userId = req.user.id;

    if (!status || !['approved', 'rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'ステータスは approved または rejected である必要があります'
      });
    }

    // ピンの存在確認
    const pin = await Pin.findById(pinId);

    if (!pin) {
      return res.status(404).json({
        success: false,
        message: 'ピンが見つかりません'
      });
    }

    // 作成者のみリクエストに応答可能
    if (pin.creatorId.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'このピンのリクエストに応答する権限がありません'
      });
    }

    // リクエストの存在確認
    const requestIndex = pin.requests.findIndex(
      req => req._id.toString() === requestId
    );

    if (requestIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'リクエストが見つかりません'
      });
    }

    // リクエストのステータス更新
    pin.requests[requestIndex].status = status;

    // 承認の場合は参加者に追加
    if (status === 'approved') {
      const requestUserId = pin.requests[requestIndex].userId;
      
      // 既に参加者に含まれていない場合のみ追加
      if (!pin.participants.includes(requestUserId)) {
        pin.participants.push(requestUserId);
      }
    }

    await pin.save();

    res.status(200).json({
      success: true,
      message: `リクエストが${status === 'approved' ? '承認' : '拒否'}されました`,
      data: {
        requestId,
        status
      }
    });
  } catch (error) {
    console.error('ピンリクエスト応答エラー:', error);
    res.status(500).json({
      success: false,
      message: 'サーバーエラーが発生しました',
      error: error.message
    });
  }
};

module.exports = {
  createPin,
  getPins,
  getPinById,
  updatePin,
  deletePin,
  sendPinRequest,
  getPinRequests,
  respondToPinRequest
};
