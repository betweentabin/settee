const ChatRoom = require('../models/chatroom.model');
const Message = require('../models/message.model');
const User = require('../models/user.model');
const Pin = require('../models/pin.model');

// チャットルーム一覧取得
const getChatRooms = async (req, res) => {
  try {
    const userId = req.user.id;

    // ユーザーが参加しているチャットルームを取得
    const chatRooms = await ChatRoom.find({
      participants: userId
    })
      .populate('pinId', 'title')
      .populate('participants', 'name userId profileImage')
      .populate('lastMessage.senderId', 'name userId')
      .sort({ 'lastMessage.timestamp': -1 }); // 最新メッセージ順

    // チャットルームごとに未読メッセージ数を取得
    const chatRoomsWithUnread = await Promise.all(
      chatRooms.map(async (room) => {
        const unreadCount = await Message.countDocuments({
          chatId: room._id,
          readBy: { $ne: userId },
          senderId: { $ne: userId }
        });

        return {
          id: room._id,
          pinId: room.pinId,
          pinTitle: room.pinId ? room.pinId.title : null,
          participants: room.participants,
          lastMessage: room.lastMessage,
          unreadCount,
          createdAt: room.createdAt
        };
      })
    );

    res.status(200).json({
      success: true,
      count: chatRoomsWithUnread.length,
      data: chatRoomsWithUnread
    });
  } catch (error) {
    console.error('チャットルーム一覧取得エラー:', error);
    res.status(500).json({
      success: false,
      message: 'サーバーエラーが発生しました',
      error: error.message
    });
  }
};

// チャットルーム詳細取得
const getChatRoomById = async (req, res) => {
  try {
    const { chatId } = req.params;
    const userId = req.user.id;

    // チャットルームの存在確認
    const chatRoom = await ChatRoom.findById(chatId)
      .populate('pinId', 'title description dateTime location')
      .populate('participants', 'name userId profileImage');

    if (!chatRoom) {
      return res.status(404).json({
        success: false,
        message: 'チャットルームが見つかりません'
      });
    }

    // 参加者のみアクセス可能
    if (!chatRoom.participants.some(p => p._id.toString() === userId)) {
      return res.status(403).json({
        success: false,
        message: 'このチャットルームにアクセスする権限がありません'
      });
    }

    res.status(200).json({
      success: true,
      data: chatRoom
    });
  } catch (error) {
    console.error('チャットルーム詳細取得エラー:', error);
    res.status(500).json({
      success: false,
      message: 'サーバーエラーが発生しました',
      error: error.message
    });
  }
};

// メッセージ一覧取得
const getMessages = async (req, res) => {
  try {
    const { chatId } = req.params;
    const userId = req.user.id;
    const { limit = 50, before } = req.query;

    // チャットルームの存在確認
    const chatRoom = await ChatRoom.findById(chatId);

    if (!chatRoom) {
      return res.status(404).json({
        success: false,
        message: 'チャットルームが見つかりません'
      });
    }

    // 参加者のみアクセス可能
    if (!chatRoom.participants.some(p => p.toString() === userId)) {
      return res.status(403).json({
        success: false,
        message: 'このチャットルームにアクセスする権限がありません'
      });
    }

    // クエリ条件の設定
    const query = { chatId };
    if (before) {
      query.createdAt = { $lt: new Date(before) };
    }

    // メッセージの取得
    const messages = await Message.find(query)
      .populate('senderId', 'name userId profileImage')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));

    // 未読メッセージを既読に更新
    await Message.updateMany(
      {
        chatId,
        readBy: { $ne: userId },
        senderId: { $ne: userId }
      },
      {
        $addToSet: { readBy: userId }
      }
    );

    res.status(200).json({
      success: true,
      count: messages.length,
      data: messages.reverse() // 古い順に並び替え
    });
  } catch (error) {
    console.error('メッセージ一覧取得エラー:', error);
    res.status(500).json({
      success: false,
      message: 'サーバーエラーが発生しました',
      error: error.message
    });
  }
};

// メッセージ送信
const sendMessage = async (req, res) => {
  try {
    const { chatId } = req.params;
    const { text } = req.body;
    const userId = req.user.id;

    if (!text || !text.trim()) {
      return res.status(400).json({
        success: false,
        message: 'メッセージは必須です'
      });
    }

    // チャットルームの存在確認
    const chatRoom = await ChatRoom.findById(chatId);

    if (!chatRoom) {
      return res.status(404).json({
        success: false,
        message: 'チャットルームが見つかりません'
      });
    }

    // 参加者のみメッセージ送信可能
    if (!chatRoom.participants.some(p => p.toString() === userId)) {
      return res.status(403).json({
        success: false,
        message: 'このチャットルームにメッセージを送信する権限がありません'
      });
    }

    // メッセージの作成
    const message = new Message({
      chatId,
      senderId: userId,
      text: text.trim(),
      readBy: [userId] // 送信者は既読
    });

    await message.save();

    // チャットルームの最終メッセージを更新
    chatRoom.lastMessage = {
      text: text.trim(),
      senderId: userId,
      timestamp: new Date()
    };

    await chatRoom.save();

    // 送信者情報を含めて返す
    const populatedMessage = await Message.findById(message._id)
      .populate('senderId', 'name userId profileImage');

    res.status(201).json({
      success: true,
      message: 'メッセージが送信されました',
      data: populatedMessage
    });
  } catch (error) {
    console.error('メッセージ送信エラー:', error);
    res.status(500).json({
      success: false,
      message: 'サーバーエラーが発生しました',
      error: error.message
    });
  }
};

// 既読ステータス更新
const markAsRead = async (req, res) => {
  try {
    const { chatId } = req.params;
    const userId = req.user.id;

    // チャットルームの存在確認
    const chatRoom = await ChatRoom.findById(chatId);

    if (!chatRoom) {
      return res.status(404).json({
        success: false,
        message: 'チャットルームが見つかりません'
      });
    }

    // 参加者のみ既読更新可能
    if (!chatRoom.participants.some(p => p.toString() === userId)) {
      return res.status(403).json({
        success: false,
        message: 'このチャットルームの既読ステータスを更新する権限がありません'
      });
    }

    // 未読メッセージを既読に更新
    const result = await Message.updateMany(
      {
        chatId,
        readBy: { $ne: userId },
        senderId: { $ne: userId }
      },
      {
        $addToSet: { readBy: userId }
      }
    );

    res.status(200).json({
      success: true,
      message: '既読ステータスが更新されました',
      data: {
        updatedCount: result.nModified
      }
    });
  } catch (error) {
    console.error('既読ステータス更新エラー:', error);
    res.status(500).json({
      success: false,
      message: 'サーバーエラーが発生しました',
      error: error.message
    });
  }
};

// チャットルーム作成（ピンリクエスト承認時に自動作成）
const createChatRoom = async (pinId, participantIds) => {
  try {
    // 既存のチャットルームをチェック
    const existingChatRoom = await ChatRoom.findOne({
      pinId,
      participants: { $all: participantIds }
    });

    if (existingChatRoom) {
      return existingChatRoom;
    }

    // 新しいチャットルームを作成
    const chatRoom = new ChatRoom({
      pinId,
      participants: participantIds
    });

    await chatRoom.save();
    return chatRoom;
  } catch (error) {
    console.error('チャットルーム作成エラー:', error);
    throw error;
  }
};

module.exports = {
  getChatRooms,
  getChatRoomById,
  getMessages,
  sendMessage,
  markAsRead,
  createChatRoom
};
