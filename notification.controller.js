const admin = require('firebase-admin');
const User = require('../models/user.model');
const PointTransaction = require('../models/pointtransaction.model');
const { addPoints } = require('./point.controller');

// プッシュ通知送信
const sendPushNotification = async (userId, title, body, data = {}) => {
  try {
    // ユーザーの存在確認
    const user = await User.findById(userId);
    
    if (!user || !user.firebaseUid) {
      throw new Error('ユーザーが見つかりません');
    }

    // ユーザーの通知設定を確認
    const notificationType = data.type || 'system';
    if (
      user.settings && 
      user.settings.notifications && 
      user.settings.notifications[notificationType] === false
    ) {
      console.log(`ユーザー ${userId} は ${notificationType} 通知をオフにしています`);
      return;
    }

    // FCMトークンの取得（実際のアプリでは、ユーザーモデルにFCMトークンを保存する必要がある）
    // この例では簡易的に実装
    const fcmToken = user.fcmToken;
    
    if (!fcmToken) {
      console.log(`ユーザー ${userId} のFCMトークンがありません`);
      return;
    }

    // 通知メッセージの作成
    const message = {
      notification: {
        title,
        body
      },
      data: {
        ...data,
        click_action: 'FLUTTER_NOTIFICATION_CLICK'
      },
      token: fcmToken
    };

    // 通知の送信
    const response = await admin.messaging().send(message);
    console.log('通知送信成功:', response);
    
    return response;
  } catch (error) {
    console.error('プッシュ通知送信エラー:', error);
    throw error;
  }
};

// 複数ユーザーへのプッシュ通知送信
const sendMulticastPushNotification = async (userIds, title, body, data = {}) => {
  try {
    // ユーザーの存在確認
    const users = await User.find({ _id: { $in: userIds } });
    
    if (!users || users.length === 0) {
      throw new Error('ユーザーが見つかりません');
    }

    // FCMトークンの取得
    const tokens = users
      .filter(user => {
        // 通知設定の確認
        const notificationType = data.type || 'system';
        if (
          user.settings && 
          user.settings.notifications && 
          user.settings.notifications[notificationType] === false
        ) {
          console.log(`ユーザー ${user._id} は ${notificationType} 通知をオフにしています`);
          return false;
        }
        return user.fcmToken;
      })
      .map(user => user.fcmToken);
    
    if (tokens.length === 0) {
      console.log('有効なFCMトークンがありません');
      return;
    }

    // 通知メッセージの作成
    const message = {
      notification: {
        title,
        body
      },
      data: {
        ...data,
        click_action: 'FLUTTER_NOTIFICATION_CLICK'
      },
      tokens
    };

    // 通知の送信
    const response = await admin.messaging().sendMulticast(message);
    console.log('マルチキャスト通知送信成功:', response);
    
    return response;
  } catch (error) {
    console.error('マルチキャスト通知送信エラー:', error);
    throw error;
  }
};

// ピン作成通知
const sendPinCreationNotification = async (pin) => {
  try {
    // ピン作成者にポイント付与
    await addPoints(
      pin.creatorId,
      20,
      'ピン作成ボーナス',
      pin._id
    );

    // 近くのユーザーに通知
    const nearbyUsers = await User.find({
      _id: { $ne: pin.creatorId }, // 作成者以外
      'location.coordinates': {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: pin.location.coordinates
          },
          $maxDistance: 5000 // 5km以内
        }
      },
      'verificationStatus.isStudentIdVerified': true // 学生証認証済みのみ
    }).select('_id');

    if (nearbyUsers.length > 0) {
      const nearbyUserIds = nearbyUsers.map(user => user._id);
      
      await sendMulticastPushNotification(
        nearbyUserIds,
        '新しいピンが作成されました',
        `${pin.title} - ${pin.description.substring(0, 50)}...`,
        {
          type: 'pins',
          pinId: pin._id.toString(),
          action: 'view_pin'
        }
      );
    }
  } catch (error) {
    console.error('ピン作成通知エラー:', error);
  }
};

// ピンリクエスト通知
const sendPinRequestNotification = async (pin, request) => {
  try {
    // ピン作成者に通知
    await sendPushNotification(
      pin.creatorId,
      'ピンリクエストが届きました',
      `あなたのピン「${pin.title}」にリクエストが届きました`,
      {
        type: 'requests',
        pinId: pin._id.toString(),
        requestId: request._id.toString(),
        action: 'view_request'
      }
    );
  } catch (error) {
    console.error('ピンリクエスト通知エラー:', error);
  }
};

// ピンリクエスト応答通知
const sendPinRequestResponseNotification = async (pin, request, status) => {
  try {
    // リクエスト送信者に通知
    await sendPushNotification(
      request.userId,
      `ピンリクエストが${status === 'approved' ? '承認' : '拒否'}されました`,
      `「${pin.title}」へのリクエストが${status === 'approved' ? '承認' : '拒否'}されました`,
      {
        type: 'requests',
        pinId: pin._id.toString(),
        status,
        action: 'view_pin'
      }
    );

    // 承認の場合はポイント付与
    if (status === 'approved') {
      // ピン作成者にポイント付与
      await addPoints(
        pin.creatorId,
        10,
        'ピンリクエスト承認ボーナス',
        request.userId
      );
      
      // リクエスト送信者にポイント付与
      await addPoints(
        request.userId,
        5,
        'ピン参加ボーナス',
        pin._id
      );
    }
  } catch (error) {
    console.error('ピンリクエスト応答通知エラー:', error);
  }
};

// チャットメッセージ通知
const sendChatMessageNotification = async (chatRoom, message, sender) => {
  try {
    // 送信者以外の参加者に通知
    const recipients = chatRoom.participants.filter(
      p => p.toString() !== sender._id.toString()
    );

    if (recipients.length > 0) {
      await sendMulticastPushNotification(
        recipients,
        `${sender.name}からのメッセージ`,
        message.text.length > 50 ? `${message.text.substring(0, 50)}...` : message.text,
        {
          type: 'messages',
          chatId: chatRoom._id.toString(),
          messageId: message._id.toString(),
          senderId: sender._id.toString(),
          action: 'view_chat'
        }
      );
    }
  } catch (error) {
    console.error('チャットメッセージ通知エラー:', error);
  }
};

// 学生証認証完了通知
const sendStudentVerificationNotification = async (userId) => {
  try {
    // ユーザーに通知
    await sendPushNotification(
      userId,
      '学生証認証が完了しました',
      '学生証認証が完了し、100ポイントが付与されました',
      {
        type: 'system',
        action: 'view_points'
      }
    );

    // ポイント付与
    await addPoints(
      userId,
      100,
      '学生証認証ボーナス',
      null
    );
  } catch (error) {
    console.error('学生証認証通知エラー:', error);
  }
};

// 招待ボーナス通知
const sendInviteRewardNotification = async (inviterId, inviteeId, inviteeName) => {
  try {
    // 招待者に通知
    await sendPushNotification(
      inviterId,
      '招待ボーナスが付与されました',
      `${inviteeName}さんがあなたの招待コードを使用し、100ポイントが付与されました`,
      {
        type: 'system',
        action: 'view_points'
      }
    );

    // 被招待者に通知
    await sendPushNotification(
      inviteeId,
      '招待ボーナスが付与されました',
      '招待コードの適用により、50ポイントが付与されました',
      {
        type: 'system',
        action: 'view_points'
      }
    );
  } catch (error) {
    console.error('招待ボーナス通知エラー:', error);
  }
};

module.exports = {
  sendPushNotification,
  sendMulticastPushNotification,
  sendPinCreationNotification,
  sendPinRequestNotification,
  sendPinRequestResponseNotification,
  sendChatMessageNotification,
  sendStudentVerificationNotification,
  sendInviteRewardNotification
};
