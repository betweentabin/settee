import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, FlatList, Image, KeyboardAvoidingView, Platform } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import io from 'socket.io-client';

const ChatRoomScreen = ({ navigation, route }) => {
  const { colors } = useTheme();
  const { user } = useAuth();
  const { chatId, pinTitle } = route.params;
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const [otherUser, setOtherUser] = useState(null);
  const flatListRef = useRef(null);
  
  // 実際のアプリではSocket.IOの接続を行う
  // const socketRef = useRef(null);

  useEffect(() => {
    // チャットデータを取得（実際のアプリではAPIから取得）
    const fetchChatData = async () => {
      try {
        // 仮のチャットデータ
        const dummyOtherUser = {
          id: 'user2',
          name: '佐藤さん',
          profileImage: null
        };
        
        const dummyMessages = [
          {
            id: '1',
            text: 'こんにちは！ピンを見て連絡しました。',
            senderId: 'user2',
            timestamp: new Date(Date.now() - 3600000).toISOString() // 1時間前
          },
          {
            id: '2',
            text: 'はじめまして！リクエストありがとうございます。',
            senderId: 'user1',
            timestamp: new Date(Date.now() - 3540000).toISOString() // 59分前
          },
          {
            id: '3',
            text: '何時頃に集合できますか？',
            senderId: 'user1',
            timestamp: new Date(Date.now() - 3480000).toISOString() // 58分前
          },
          {
            id: '4',
            text: '13時頃はどうでしょうか？',
            senderId: 'user2',
            timestamp: new Date(Date.now() - 3420000).toISOString() // 57分前
          },
          {
            id: '5',
            text: '13時で大丈夫です！場所はどこがいいですか？',
            senderId: 'user1',
            timestamp: new Date(Date.now() - 3360000).toISOString() // 56分前
          },
          {
            id: '6',
            text: '学食の入り口で待ち合わせしましょう！',
            senderId: 'user2',
            timestamp: new Date(Date.now() - 3300000).toISOString() // 55分前
          },
          {
            id: '7',
            text: 'わかりました！13時に学食の入り口で会いましょう。',
            senderId: 'user1',
            timestamp: new Date(Date.now() - 3240000).toISOString() // 54分前
          },
          {
            id: '8',
            text: 'こんにちは！何時に集合しますか？',
            senderId: 'user2',
            timestamp: new Date(Date.now() - 3600000).toISOString() // 1時間前
          }
        ];
        
        setOtherUser(dummyOtherUser);
        setMessages(dummyMessages);
      } catch (error) {
        console.error('Error fetching chat data:', error);
      } finally {
        setLoading(false);
      }
    };

    // Socket.IO接続の設定（実際のアプリで実装）
    // const setupSocket = () => {
    //   socketRef.current = io('https://api.settee.example.com');
    //   
    //   socketRef.current.emit('join_chat', { chatId, userId: user.id });
    //   
    //   socketRef.current.on('new_message', (newMessage) => {
    //     setMessages(prevMessages => [...prevMessages, newMessage]);
    //   });
    //   
    //   return () => {
    //     socketRef.current.disconnect();
    //   };
    // };

    fetchChatData();
    // setupSocket();
    
    // ヘッダーの設定
    navigation.setOptions({
      title: pinTitle || 'チャット',
      headerRight: () => (
        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => navigation.navigate('PinDetail', { pinId: '101' })}
        >
          <Text style={{ color: colors.primary }}>詳細</Text>
        </TouchableOpacity>
      )
    });
  }, [chatId, navigation, pinTitle]);

  useEffect(() => {
    // メッセージが更新されたら一番下にスクロール
    if (flatListRef.current && messages.length > 0) {
      flatListRef.current.scrollToEnd({ animated: true });
    }
  }, [messages]);

  const handleSendMessage = () => {
    if (!inputText.trim()) return;
    
    // 新しいメッセージを作成
    const newMessage = {
      id: Date.now().toString(),
      text: inputText.trim(),
      senderId: user.id,
      timestamp: new Date().toISOString()
    };
    
    // メッセージリストに追加
    setMessages(prevMessages => [...prevMessages, newMessage]);
    
    // 入力フィールドをクリア
    setInputText('');
    
    // 実際のアプリではSocket.IOでメッセージを送信
    // socketRef.current.emit('send_message', {
    //   chatId,
    //   message: newMessage
    // });
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString('ja-JP', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const renderMessageItem = ({ item, index }) => {
    const isCurrentUser = item.senderId === 'user1'; // 仮に自分のIDをuser1とする
    const showAvatar = index === 0 || messages[index - 1].senderId !== item.senderId;
    
    return (
      <View style={[
        styles.messageContainer,
        isCurrentUser ? styles.currentUserMessage : styles.otherUserMessage
      ]}>
        {!isCurrentUser && showAvatar && (
          <View style={[styles.avatarContainer, { backgroundColor: colors.card }]}>
            {otherUser?.profileImage ? (
              <Image source={{ uri: otherUser.profileImage }} style={styles.avatar} />
            ) : (
              <Text style={[styles.avatarText, { color: colors.primary }]}>
                {otherUser?.name.charAt(0)}
              </Text>
            )}
          </View>
        )}
        
        <View style={[
          styles.messageBubble,
          isCurrentUser 
            ? [styles.currentUserBubble, { backgroundColor: colors.primary }]
            : [styles.otherUserBubble, { backgroundColor: colors.card }]
        ]}>
          <Text style={[
            styles.messageText,
            { color: isCurrentUser ? 'white' : colors.text }
          ]}>
            {item.text}
          </Text>
        </View>
        
        <Text style={[styles.messageTime, { color: colors.textSecondary }]}>
          {formatTime(item.timestamp)}
        </Text>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : null}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      {loading ? (
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            チャットを読み込み中...
          </Text>
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessageItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.messageList}
          showsVerticalScrollIndicator={false}
        />
      )}
      
      <View style={[styles.inputContainer, { backgroundColor: colors.card }]}>
        <TextInput
          style={[styles.input, { color: colors.text }]}
          placeholder="メッセージを入力..."
          placeholderTextColor={colors.textSecondary}
          value={inputText}
          onChangeText={setInputText}
          multiline
        />
        
        <TouchableOpacity
          style={[styles.sendButton, { 
            backgroundColor: colors.primary,
            opacity: !inputText.trim() ? 0.7 : 1 
          }]}
          onPress={handleSendMessage}
          disabled={!inputText.trim()}
        >
          <Text style={styles.sendButtonText}>送信</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerButton: {
    paddingHorizontal: 15,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
  },
  messageList: {
    padding: 15,
    paddingBottom: 20,
  },
  messageContainer: {
    marginBottom: 15,
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  currentUserMessage: {
    justifyContent: 'flex-end',
  },
  otherUserMessage: {
    justifyContent: 'flex-start',
  },
  avatarContainer: {
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  avatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
  },
  avatarText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  messageBubble: {
    maxWidth: '70%',
    borderRadius: 18,
    paddingHorizontal: 15,
    paddingVertical: 10,
  },
  currentUserBubble: {
    borderBottomRightRadius: 5,
  },
  otherUserBubble: {
    borderBottomLeftRadius: 5,
  },
  messageText: {
    fontSize: 16,
  },
  messageTime: {
    fontSize: 12,
    marginHorizontal: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 100,
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 8,
    fontSize: 16,
  },
  sendButton: {
    marginLeft: 10,
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 20,
  },
  sendButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default ChatRoomScreen;
