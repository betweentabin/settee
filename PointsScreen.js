import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { useTheme } from './ThemeContext';
import { useAuth } from './AuthContext';

const PointsScreen = ({ navigation }) => {
  const { colors } = useTheme();
  const { user } = useAuth();
  const [pointsHistory, setPointsHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // ポイント履歴を取得（実際のアプリではAPIから取得）
    const fetchPointsHistory = async () => {
      try {
        // 仮のポイント履歴データ
        const dummyHistory = [
          {
            id: '1',
            type: 'earn',
            amount: 50,
            description: '友達招待ボーナス',
            date: new Date(Date.now() - 86400000 * 2).toISOString() // 2日前
          },
          {
            id: '2',
            type: 'earn',
            amount: 10,
            description: 'ログインボーナス',
            date: new Date(Date.now() - 86400000).toISOString() // 1日前
          },
          {
            id: '3',
            type: 'spend',
            amount: 30,
            description: 'プロフィールバッジ購入',
            date: new Date(Date.now() - 43200000).toISOString() // 12時間前
          },
          {
            id: '4',
            type: 'earn',
            amount: 20,
            description: 'ピン作成ボーナス',
            date: new Date(Date.now() - 21600000).toISOString() // 6時間前
          },
          {
            id: '5',
            type: 'earn',
            amount: 10,
            description: 'ログインボーナス',
            date: new Date().toISOString() // 今日
          }
        ];
        
        setPointsHistory(dummyHistory);
      } catch (error) {
        console.error('Error fetching points history:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPointsHistory();
  }, []);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'numeric',
      day: 'numeric'
    });
  };

  const handleInviteFriends = () => {
    navigation.navigate('InviteFriends');
  };

  const handleSubscription = () => {
    navigation.navigate('Subscription');
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>
            Setteeポイント
          </Text>
        </View>
        
        <View style={[styles.pointsCard, { backgroundColor: colors.primary }]}>
          <Text style={styles.pointsLabel}>現在のポイント</Text>
          <Text style={styles.pointsValue}>{user?.points || 0}</Text>
          <Text style={styles.pointsUnit}>ポイント</Text>
        </View>
        
        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: colors.card }]}
            onPress={handleInviteFriends}
          >
            <Text style={[styles.actionButtonText, { color: colors.text }]}>
              友達を招待してポイントゲット
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: colors.card }]}
            onPress={handleSubscription}
          >
            <Text style={[styles.actionButtonText, { color: colors.text }]}>
              Premiumに登録してポイント2倍
            </Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.historyContainer}>
          <Text style={[styles.historyTitle, { color: colors.text }]}>
            ポイント履歴
          </Text>
          
          {loading ? (
            <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
              履歴を読み込み中...
            </Text>
          ) : pointsHistory.length === 0 ? (
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              ポイント履歴がありません
            </Text>
          ) : (
            pointsHistory.map(item => (
              <View 
                key={item.id}
                style={[styles.historyItem, { borderBottomColor: colors.border }]}
              >
                <View style={styles.historyItemLeft}>
                  <Text style={[styles.historyDescription, { color: colors.text }]}>
                    {item.description}
                  </Text>
                  <Text style={[styles.historyDate, { color: colors.textSecondary }]}>
                    {formatDate(item.date)}
                  </Text>
                </View>
                
                <Text style={[
                  styles.historyAmount,
                  { color: item.type === 'earn' ? colors.success : colors.error }
                ]}>
                  {item.type === 'earn' ? '+' : '-'}{item.amount}
                </Text>
              </View>
            ))
          )}
        </View>
        
        <View style={styles.infoContainer}>
          <Text style={[styles.infoTitle, { color: colors.text }]}>
            ポイントの獲得方法
          </Text>
          
          <View style={[styles.infoCard, { backgroundColor: colors.card }]}>
            <View style={styles.infoItem}>
              <Text style={[styles.infoItemTitle, { color: colors.text }]}>
                ログインボーナス
              </Text>
              <Text style={[styles.infoItemDescription, { color: colors.textSecondary }]}>
                毎日ログインで10ポイント
              </Text>
            </View>
            
            <View style={styles.infoItem}>
              <Text style={[styles.infoItemTitle, { color: colors.text }]}>
                ピン作成
              </Text>
              <Text style={[styles.infoItemDescription, { color: colors.textSecondary }]}>
                ピンを作成すると20ポイント
              </Text>
            </View>
            
            <View style={styles.infoItem}>
              <Text style={[styles.infoItemTitle, { color: colors.text }]}>
                友達招待
              </Text>
              <Text style={[styles.infoItemDescription, { color: colors.textSecondary }]}>
                友達が登録すると50ポイント
              </Text>
            </View>
            
            <View style={styles.infoItem}>
              <Text style={[styles.infoItemTitle, { color: colors.text }]}>
                Premium会員
              </Text>
              <Text style={[styles.infoItemDescription, { color: colors.textSecondary }]}>
                すべてのポイント獲得が2倍に
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContainer: {
    padding: 20,
  },
  header: {
    marginTop: 50,
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  pointsCard: {
    borderRadius: 15,
    padding: 20,
    alignItems: 'center',
    marginBottom: 20,
  },
  pointsLabel: {
    color: 'white',
    fontSize: 16,
    marginBottom: 10,
  },
  pointsValue: {
    color: 'white',
    fontSize: 48,
    fontWeight: 'bold',
  },
  pointsUnit: {
    color: 'white',
    fontSize: 16,
  },
  actionsContainer: {
    marginBottom: 30,
  },
  actionButton: {
    borderRadius: 10,
    padding: 15,
    alignItems: 'center',
    marginBottom: 10,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  historyContainer: {
    marginBottom: 30,
  },
  historyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  loadingText: {
    fontSize: 16,
    textAlign: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
    padding: 20,
  },
  historyItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
  },
  historyItemLeft: {
    flex: 1,
  },
  historyDescription: {
    fontSize: 16,
    marginBottom: 5,
  },
  historyDate: {
    fontSize: 14,
  },
  historyAmount: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  infoContainer: {
    marginBottom: 30,
  },
  infoTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  infoCard: {
    borderRadius: 15,
    padding: 15,
  },
  infoItem: {
    marginBottom: 15,
  },
  infoItemTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 5,
  },
  infoItemDescription: {
    fontSize: 14,
  },
});

export default PointsScreen;
