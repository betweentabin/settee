import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';

const ProfileScreen = ({ navigation }) => {
  const { colors } = useTheme();
  const { user, logout } = useAuth();
  const [stats, setStats] = useState({
    totalPins: 0,
    activePins: 0,
    completedPins: 0,
    totalChats: 0
  });

  useEffect(() => {
    // ユーザー統計を取得（実際のアプリではAPIから取得）
    const fetchUserStats = async () => {
      // 仮のデータ
      setStats({
        totalPins: 5,
        activePins: 2,
        completedPins: 3,
        totalChats: 8
      });
    };

    fetchUserStats();
  }, []);

  const handleEditProfile = () => {
    navigation.navigate('Settings');
  };

  const handlePointsPress = () => {
    navigation.navigate('Points');
  };

  const handleInviteFriends = () => {
    navigation.navigate('InviteFriends');
  };

  const handleSubscription = () => {
    navigation.navigate('Subscription');
  };

  const handleLogout = async () => {
    await logout();
    // AuthContextによって自動的にログイン画面に遷移
  };

  return (
    <ScrollView 
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.contentContainer}
    >
      <View style={styles.header}>
        <View style={styles.profileSection}>
          <View style={[styles.profileImageContainer, { backgroundColor: colors.card }]}>
            {user?.profileImage ? (
              <Image source={{ uri: user.profileImage }} style={styles.profileImage} />
            ) : (
              <Text style={[styles.profileInitial, { color: colors.primary }]}>
                {user?.name?.charAt(0) || 'U'}
              </Text>
            )}
          </View>
          
          <View style={styles.profileInfo}>
            <Text style={[styles.userName, { color: colors.text }]}>
              {user?.name || 'ユーザー'}
            </Text>
            <Text style={[styles.userId, { color: colors.textSecondary }]}>
              @{user?.userId || 'user_id'}
            </Text>
            
            <TouchableOpacity
              style={[styles.editButton, { borderColor: colors.primary }]}
              onPress={handleEditProfile}
            >
              <Text style={[styles.editButtonText, { color: colors.primary }]}>
                プロフィール編集
              </Text>
            </TouchableOpacity>
          </View>
        </View>
        
        <View style={[styles.pointsCard, { backgroundColor: colors.primary }]}>
          <View style={styles.pointsInfo}>
            <Text style={styles.pointsLabel}>Setteeポイント</Text>
            <Text style={styles.pointsValue}>{user?.points || 0} pt</Text>
          </View>
          
          <TouchableOpacity
            style={styles.pointsButton}
            onPress={handlePointsPress}
          >
            <Text style={styles.pointsButtonText}>詳細</Text>
          </TouchableOpacity>
        </View>
      </View>
      
      <View style={styles.statsContainer}>
        <View style={[styles.statsCard, { backgroundColor: colors.card }]}>
          <Text style={[styles.statsTitle, { color: colors.text }]}>
            アクティビティ
          </Text>
          
          <View style={styles.statsGrid}>
            <View style={styles.statsItem}>
              <Text style={[styles.statsValue, { color: colors.text }]}>
                {stats.totalPins}
              </Text>
              <Text style={[styles.statsLabel, { color: colors.textSecondary }]}>
                作成したピン
              </Text>
            </View>
            
            <View style={styles.statsItem}>
              <Text style={[styles.statsValue, { color: colors.text }]}>
                {stats.activePins}
              </Text>
              <Text style={[styles.statsLabel, { color: colors.textSecondary }]}>
                アクティブなピン
              </Text>
            </View>
            
            <View style={styles.statsItem}>
              <Text style={[styles.statsValue, { color: colors.text }]}>
                {stats.completedPins}
              </Text>
              <Text style={[styles.statsLabel, { color: colors.textSecondary }]}>
                完了したピン
              </Text>
            </View>
            
            <View style={styles.statsItem}>
              <Text style={[styles.statsValue, { color: colors.text }]}>
                {stats.totalChats}
              </Text>
              <Text style={[styles.statsLabel, { color: colors.textSecondary }]}>
                チャット数
              </Text>
            </View>
          </View>
        </View>
      </View>
      
      <View style={styles.menuContainer}>
        <TouchableOpacity
          style={[styles.menuItem, { backgroundColor: colors.card }]}
          onPress={handleInviteFriends}
        >
          <Text style={[styles.menuItemText, { color: colors.text }]}>
            友達を招待する
          </Text>
          <Text style={[styles.menuItemSubtext, { color: colors.textSecondary }]}>
            招待するとポイントがもらえます
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.menuItem, { backgroundColor: colors.card }]}
          onPress={handleSubscription}
        >
          <Text style={[styles.menuItemText, { color: colors.text }]}>
            Settee Premiumに登録
          </Text>
          <Text style={[styles.menuItemSubtext, { color: colors.textSecondary }]}>
            より多くの機能を利用できます
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.menuItem, { backgroundColor: colors.card }]}
          onPress={() => navigation.navigate('Settings')}
        >
          <Text style={[styles.menuItemText, { color: colors.text }]}>
            設定
          </Text>
          <Text style={[styles.menuItemSubtext, { color: colors.textSecondary }]}>
            アカウント設定、通知、プライバシー
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.logoutButton, { borderColor: colors.error }]}
          onPress={handleLogout}
        >
          <Text style={[styles.logoutButtonText, { color: colors.error }]}>
            ログアウト
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
  },
  header: {
    marginTop: 40,
    marginBottom: 20,
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  profileImageContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 20,
  },
  profileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  profileInitial: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  profileInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  userId: {
    fontSize: 16,
    marginBottom: 10,
  },
  editButton: {
    alignSelf: 'flex-start',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 15,
    borderWidth: 1,
  },
  editButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  pointsCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderRadius: 15,
    padding: 15,
  },
  pointsInfo: {
    flex: 1,
  },
  pointsLabel: {
    color: 'white',
    fontSize: 14,
    marginBottom: 5,
  },
  pointsValue: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
  },
  pointsButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 15,
  },
  pointsButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },
  statsContainer: {
    marginBottom: 20,
  },
  statsCard: {
    borderRadius: 15,
    padding: 15,
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statsItem: {
    width: '48%',
    marginBottom: 15,
  },
  statsValue: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  statsLabel: {
    fontSize: 14,
  },
  menuContainer: {
    marginBottom: 30,
  },
  menuItem: {
    borderRadius: 15,
    padding: 15,
    marginBottom: 10,
  },
  menuItemText: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 5,
  },
  menuItemSubtext: {
    fontSize: 14,
  },
  logoutButton: {
    borderWidth: 1,
    borderRadius: 15,
    padding: 15,
    alignItems: 'center',
    marginTop: 10,
  },
  logoutButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ProfileScreen;
