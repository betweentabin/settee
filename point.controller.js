const User = require('../models/user.model');
const PointTransaction = require('../models/pointtransaction.model');

// ポイント残高取得
const getPointBalance = async (req, res) => {
  try {
    const userId = req.user.id;

    // ユーザー情報を取得
    const user = await User.findById(userId).select('points');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'ユーザーが見つかりません'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        points: user.points
      }
    });
  } catch (error) {
    console.error('ポイント残高取得エラー:', error);
    res.status(500).json({
      success: false,
      message: 'サーバーエラーが発生しました',
      error: error.message
    });
  }
};

// ポイント取引履歴取得
const getPointTransactions = async (req, res) => {
  try {
    const userId = req.user.id;
    const { limit = 20, skip = 0, type } = req.query;

    // クエリ条件の設定
    const query = { userId };
    if (type && ['earn', 'spend'].includes(type)) {
      query.type = type;
    }

    // 取引履歴の取得
    const transactions = await PointTransaction.find(query)
      .sort({ createdAt: -1 })
      .skip(parseInt(skip))
      .limit(parseInt(limit));

    // 総件数の取得
    const total = await PointTransaction.countDocuments(query);

    res.status(200).json({
      success: true,
      count: transactions.length,
      total,
      data: transactions
    });
  } catch (error) {
    console.error('ポイント取引履歴取得エラー:', error);
    res.status(500).json({
      success: false,
      message: 'サーバーエラーが発生しました',
      error: error.message
    });
  }
};

// ポイント付与（内部サービス用）
const addPoints = async (userId, amount, description, relatedId = null) => {
  try {
    if (!userId || !amount || amount <= 0 || !description) {
      throw new Error('無効なパラメータです');
    }

    // ユーザーの存在確認
    const user = await User.findById(userId);
    
    if (!user) {
      throw new Error('ユーザーが見つかりません');
    }

    // ポイント取引の作成
    const transaction = new PointTransaction({
      userId,
      type: 'earn',
      amount,
      description,
      relatedId
    });

    await transaction.save();

    // ユーザーのポイント残高を更新
    user.points += amount;
    await user.save();

    return {
      success: true,
      transaction,
      newBalance: user.points
    };
  } catch (error) {
    console.error('ポイント付与エラー:', error);
    throw error;
  }
};

// ポイント消費（内部サービス用）
const usePoints = async (userId, amount, description, relatedId = null) => {
  try {
    if (!userId || !amount || amount <= 0 || !description) {
      throw new Error('無効なパラメータです');
    }

    // ユーザーの存在確認
    const user = await User.findById(userId);
    
    if (!user) {
      throw new Error('ユーザーが見つかりません');
    }

    // ポイント残高の確認
    if (user.points < amount) {
      throw new Error('ポイント残高が不足しています');
    }

    // ポイント取引の作成
    const transaction = new PointTransaction({
      userId,
      type: 'spend',
      amount,
      description,
      relatedId
    });

    await transaction.save();

    // ユーザーのポイント残高を更新
    user.points -= amount;
    await user.save();

    return {
      success: true,
      transaction,
      newBalance: user.points
    };
  } catch (error) {
    console.error('ポイント消費エラー:', error);
    throw error;
  }
};

// 友達招待ポイント付与
const awardInvitePoints = async (req, res) => {
  try {
    const { inviteCode } = req.body;
    const userId = req.user.id;

    if (!inviteCode) {
      return res.status(400).json({
        success: false,
        message: '招待コードは必須です'
      });
    }

    // 自分のユーザー情報を取得
    const currentUser = await User.findById(userId);
    
    if (!currentUser) {
      return res.status(404).json({
        success: false,
        message: 'ユーザーが見つかりません'
      });
    }

    // 既に招待者が設定されている場合はエラー
    if (currentUser.invitedBy) {
      return res.status(400).json({
        success: false,
        message: '既に招待コードが適用されています'
      });
    }

    // 招待コードからユーザーを検索
    const inviter = await User.findOne({ inviteCode });
    
    if (!inviter) {
      return res.status(404).json({
        success: false,
        message: '無効な招待コードです'
      });
    }

    // 自分自身の招待コードは使用不可
    if (inviter._id.toString() === userId) {
      return res.status(400).json({
        success: false,
        message: '自分自身の招待コードは使用できません'
      });
    }

    // 招待者を設定
    currentUser.invitedBy = inviter._id;
    await currentUser.save();

    // 招待者にポイント付与
    const inviterResult = await addPoints(
      inviter._id,
      100,
      `${currentUser.name}さんの招待ボーナス`,
      currentUser._id
    );

    // 被招待者にもポイント付与
    const inviteeResult = await addPoints(
      userId,
      50,
      '招待コード適用ボーナス',
      inviter._id
    );

    res.status(200).json({
      success: true,
      message: '招待コードが適用され、ポイントが付与されました',
      data: {
        inviterPoints: inviterResult.newBalance,
        yourPoints: inviteeResult.newBalance
      }
    });
  } catch (error) {
    console.error('招待ポイント付与エラー:', error);
    res.status(500).json({
      success: false,
      message: 'サーバーエラーが発生しました',
      error: error.message
    });
  }
};

module.exports = {
  getPointBalance,
  getPointTransactions,
  addPoints,
  usePoints,
  awardInvitePoints
};
