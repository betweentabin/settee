const socketIo = require('socket.io');
const jwt = require('jsonwebtoken');
const User = require('./user.model');
const ChatRoom = require('./chatroom.model');
const Message = require('./message.model');

// Socket.IOサーバーの初期化
const initializeSocketServer = (server) => {
  const io = socketIo(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST']
    }
  });

  // 認証ミドルウェア
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      
      if (!token) {
        return next(new Error('認証トークンがありません'));
      }
      
      // JWTトークンの検証
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // ユーザーの存在確認
      const user = await User.findById(decoded.id);
      
      if (!user) {
        return next(new Error('ユーザーが見つかりません'));
      }
      
      // ソケットにユーザー情報を追加
      socket.user = {
        id: user._id.toString(),
        name: user.name,
        userId: user.userId
      };
      
      next();
    } catch (error) {
      console.error('Socket認証エラー:', error);
      next(new Error('認証に失敗しました'));
    }
  });

  // 接続イベント
  io.on('connection', (socket) => {
    console.log(`ユーザー接続: ${socket.user.id}`);
    
    // ユーザー固有のルームに参加
    socket.join(`user:${socket.user.id}`);
    
    // オンラインステータスを更新
    updateUserStatus(socket.user.id, true);
    
    // チャットルーム参加
    socket.on('join_chat', (chatId) => {
      if (!chatId) return;
      
      console.log(`ユーザー ${socket.user.id} がチャットルーム ${chatId} に参加`);
      socket.join(`chat:${chatId}`);
    });
    
    // チャットルーム退出
    socket.on('leave_chat', (chatId) => {
      if (!chatId) return;
      
      console.log(`ユーザー ${socket.user.id} がチャットルーム ${chatId} を退出`);
      socket.leave(`chat:${chatId}`);
    });
    
    // メッセージ送信
    socket.on('send_message', async (data) => {
      try {
        const { chatId, text } = data;
        
        if (!chatId || !text) return;
        
        // チャットルームの存在確認
        const chatRoom = await ChatRoom.findById(chatId);
        
        if (!chatRoom) {
          return socket.emit('error', { message: 'チャットルームが見つかりません' });
        }
        
        // 参加者のみメッセージ送信可能
        if (!chatRoom.participants.some(p => p.toString() === socket.user.id)) {
          return socket.emit('error', { message: 'このチャットルームにメッセージを送信する権限がありません' });
        }
        
        // メッセージの作成
        const message = new Message({
          chatId,
          senderId: socket.user.id,
          text: text.trim(),
          readBy: [socket.user.id] // 送信者は既読
        });
        
        await message.save();
        
        // チャットルームの最終メッセージを更新
        chatRoom.lastMessage = {
          text: text.trim(),
          senderId: socket.user.id,
          timestamp: new Date()
        };
        
        await chatRoom.save();
        
        // 送信者情報を含めて返す
        const populatedMessage = await Message.findById(message._id)
          .populate('senderId', 'name userId profileImage');
        
        // 同じチャットルームの全ユーザーにブロードキャスト
        io.to(`chat:${chatId}`).emit('new_message', {
          chatId,
          message: populatedMessage
        });
      } catch (error) {
        console.error('メッセージ送信エラー:', error);
        socket.emit('error', { message: 'メッセージの送信に失敗しました' });
      }
    });
    
    // タイピング状態
    socket.on('typing', (data) => {
      const { chatId, isTyping } = data;
      
      if (!chatId) return;
      
      socket.to(`chat:${chatId}`).emit('user_typing', {
        chatId,
        user: {
          id: socket.user.id,
          name: socket.user.name,
          userId: socket.user.userId
        },
        isTyping
      });
    });
    
    // 既読ステータス更新
    socket.on('mark_as_read', async (data) => {
      try {
        const { chatId, messageIds } = data;
        
        if (!chatId) return;
        
        // メッセージIDが指定されている場合は特定のメッセージのみ既読に
        if (messageIds && Array.isArray(messageIds) && messageIds.length > 0) {
          await Message.updateMany(
            {
              _id: { $in: messageIds },
              chatId,
              readBy: { $ne: socket.user.id }
            },
            {
              $addToSet: { readBy: socket.user.id }
            }
          );
        } 
        // 指定がない場合はチャットルーム内の全メッセージを既読に
        else {
          await Message.updateMany(
            {
              chatId,
              readBy: { $ne: socket.user.id },
              senderId: { $ne: socket.user.id }
            },
            {
              $addToSet: { readBy: socket.user.id }
            }
          );
        }
        
        // 既読ステータスの変更を通知
        io.to(`chat:${chatId}`).emit('messages_read', {
          chatId,
          userId: socket.user.id,
          messageIds
        });
      } catch (error) {
        console.error('既読ステータス更新エラー:', error);
        socket.emit('error', { message: '既読ステータスの更新に失敗しました' });
      }
    });
    
    // 位置情報更新
    socket.on('update_location', async (data) => {
      try {
        const { coordinates } = data;
        
        if (!coordinates || !Array.isArray(coordinates) || coordinates.length !== 2) {
          return socket.emit('error', { message: '位置情報は[経度, 緯度]の形式で入力してください' });
        }
        
        // ユーザーの位置情報を更新
        await User.findByIdAndUpdate(socket.user.id, {
          'location.coordinates': coordinates,
          'location.lastUpdated': new Date()
        });
        
        // 位置情報の更新を通知（必要に応じて）
        // 例: 同じピンの参加者に通知するなど
      } catch (error) {
        console.error('位置情報更新エラー:', error);
        socket.emit('error', { message: '位置情報の更新に失敗しました' });
      }
    });
    
    // 切断イベント
    socket.on('disconnect', () => {
      console.log(`ユーザー切断: ${socket.user.id}`);
      
      // オンラインステータスを更新
      updateUserStatus(socket.user.id, false);
    });
  });

  return io;
};

// ユーザーのオンラインステータスを更新
const updateUserStatus = async (userId, isOnline) => {
  try {
    // 実際のアプリでは、ここでユーザーのオンラインステータスをデータベースに保存
    // 今回は簡易的に実装
    console.log(`ユーザー ${userId} は ${isOnline ? 'オンライン' : 'オフライン'} になりました`);
  } catch (error) {
    console.error('ユーザーステータス更新エラー:', error);
  }
};

module.exports = {
  initializeSocketServer
};
