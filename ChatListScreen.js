import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';

const ChatListScreen = ({ navigation }) => {
  const { colors } = useTheme();
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // チャットリストを取得（実際のアプリではAPIから取得）
    const fetchChats = async () => {
      try {
        // 仮のチャットデータ
        const dummyChats = [
          {
            id: '1',
            pinId: '101',
            pinTitle: '一緒にランチしませんか？',
            participants: [
              {
                id: 'user1',
                name: '田中さん',
                profileImage: null
              },
              {
                id: 'user2',
                name: '佐藤さん',
                profileImage: null
              }
            ],
            lastMessage: {
              text: 'こんにちは！何時に集合しますか？',
              senderId: 'user2',
              timestamp: new Date(Date.now() - 3600000).toISOString() // 1時間前
            },
            unreadCount: 2,
            createdAt: new Date(Date.now() - 86400000).toISOString() // 1日前
          },
          {
            id: '2',
            pinId: '102',
            pinTitle: '図書館で勉強会',
            participants: [
              {
                id: 'user1',
                name: '田中さん',
                profileImage: null
              },
              {
                id: 'user3',
                name: '鈴木さん',
                profileImage: null
              }
            ],
            lastMessage: {
              text: '明日の勉強会、何を持っていけばいいですか？',
              senderId: 'user3',
              timestamp: new Date(Date.now() - 7200000).toISOString() // 2時間前
            },
            unreadCount: 0,
            createdAt: new Date(Date.now() - 172800000).toISOString() // 2日前
          },
          {
            id: '3',
            pinId: '103',
            pinTitle: 'カフェでおしゃべり',
            participants: [
              {
                id: 'user1',
                name: '田中さん',
                profileImage: null
              },
              {
                id: 'user4',
                name: '高橋さん',
                profileImage: null
              }
            ],
            lastMessage: {
              text: 'おすすめのカフェがあります！',
              senderId: 'user1',
              timestamp: new Date(Date.now() - 43200000).toISOString() // 12時間前
            },
            unreadCount: 0,
            createdAt: new Date(Date.now() - 259200000).toISOString() // 3日前
          }
        ];
        
        setChats(dummyChats);
      } catch (error) {
        console.error('Error fetching chats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchChats();
  }, []);

  const getOtherParticipant = (chat) => {
    // 自分以外の参加者を取得（仮に自分のIDをuser1とする）
    return chat.participants.find(p => p.id !== 'user1');
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      // 今日の場合は時間を表示
      return date.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' });
    } else if (diffDays === 1) {
      return '昨日';
    } else if (diffDays < 7) {
      // 1週間以内の場合は曜日を表示
      const days = ['日', '月', '火', '水', '木', '金', '土'];
      return days[date.getDay()] + '曜日';
    } else {
      // それ以外は日付を表示
      return date.toLocaleDateString('ja-JP', { month: 'numeric', day: 'numeric' });
    }
  };

  const renderChatItem = ({ item }) => {
    const otherParticipant = getOtherParticipant(item);
    
    return (
      <TouchableOpacity
        style={[styles.chatItem, { backgroundColor: colors.background }]}
        onPress={() => navigation.navigate('ChatRoom', { chatId: item.id, pinTitle: item.pinTitle })}
      >
        <View style={[styles.profileImageContainer, { backgroundColor: colors.card }]}>
          {otherParticipant.profileImage ? (
            <Image source={{ uri: otherParticipant.profileImage }} style={styles.profileImage} />
          ) : (
            <Text style={[styles.profileInitial, { color: colors.primary }]}>
              {otherParticipant.name.charAt(0)}
            </Text>
          )}
        </View>
        
        <View style={styles.chatInfo}>
          <View style={styles.chatHeader}>
            <Text style={[styles.participantName, { color: colors.text }]}>
              {otherParticipant.name}
            </Text>
            <Text style={[styles.timestamp, { color: colors.textSecondary }]}>
              {formatTime(item.lastMessage.timestamp)}
            </Text>
          </View>
          
          <Text style={[styles.pinTitle, { color: colors.textSecondary }]}>
            {item.pinTitle}
          </Text>
          
          <View style={styles.messageContainer}>
            <Text 
              style={[styles.lastMessage, { 
                color: item.unreadCount > 0 ? colors.text : colors.textSecondary,
                fontWeight: item.unreadCount > 0 ? '600' : 'normal'
              }]}
              numberOfLines={1}
            >
              {item.lastMessage.text}
            </Text>
            
            {item.unreadCount > 0 && (
              <View style={[styles.unreadBadge, { backgroundColor: colors.primary }]}>
                <Text style={styles.unreadCount}>{item.unreadCount}</Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>チャット</Text>
      </View>
      
      {loading ? (
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            チャットを読み込み中...
          </Text>
        </View>
      ) : chats.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            チャットがありません
          </Text>
          <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>
            ピンにリクエストを送ってチャットを始めましょう
          </Text>
          <TouchableOpacity
            style={[styles.exploreButton, { backgroundColor: colors.primary }]}
            onPress={() => navigation.navigate('Home')}
          >
            <Text style={styles.exploreButtonText}>ピンを探す</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={chats}
          renderItem={renderChatItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.chatList}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 15,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  emptySubtext: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 30,
  },
  exploreButton: {
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 25,
  },
  exploreButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  chatList: {
    paddingHorizontal: 20,
  },
  chatItem: {
    flexDirection: 'row',
    paddingVertical: 15,
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  profileImageContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  profileImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  profileInitial: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  chatInfo: {
    flex: 1,
  },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  participantName: {
    fontSize: 16,
    fontWeight: '600',
  },
  timestamp: {
    fontSize: 12,
  },
  pinTitle: {
    fontSize: 14,
    marginBottom: 5,
  },
  messageContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  lastMessage: {
    fontSize: 14,
    flex: 1,
  },
  unreadBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
  },
  unreadCount: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
});

export default ChatListScreen;
