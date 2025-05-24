import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';

const SettingsScreen = ({ navigation }) => {
  const { colors, theme, toggleTheme } = useTheme();
  const { user } = useAuth();
  const [notifications, setNotifications] = useState({
    messages: true,
    requests: true,
    pins: true,
    system: true
  });

  const handleToggleNotification = (type) => {
    setNotifications(prev => ({
      ...prev,
      [type]: !prev[type]
    }));
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>
            設定
          </Text>
        </View>
        
        <View style={styles.sectionContainer}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            アカウント
          </Text>
          
          <TouchableOpacity
            style={[styles.settingItem, { backgroundColor: colors.card }]}
            onPress={() => navigation.navigate('Account')}
          >
            <Text style={[styles.settingLabel, { color: colors.text }]}>
              アカウント情報
            </Text>
            <Text style={[styles.settingValue, { color: colors.textSecondary }]}>
              {user?.email || 'メールアドレス未設定'}
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.settingItem, { backgroundColor: colors.card }]}
            onPress={() => navigation.navigate('StudentVerification')}
          >
            <Text style={[styles.settingLabel, { color: colors.text }]}>
              学生証認証
            </Text>
            <Text style={[styles.settingValue, { color: colors.textSecondary }]}>
              {user?.verificationStatus?.isStudentIdVerified ? '認証済み' : '未認証'}
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.settingItem, { backgroundColor: colors.card }]}
            onPress={() => navigation.navigate('Subscription')}
          >
            <Text style={[styles.settingLabel, { color: colors.text }]}>
              プレミアム会員
            </Text>
            <Text style={[styles.settingValue, { color: colors.textSecondary }]}>
              未登録
            </Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.sectionContainer}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            通知
          </Text>
          
          <View style={[styles.settingItem, { backgroundColor: colors.card }]}>
            <Text style={[styles.settingLabel, { color: colors.text }]}>
              メッセージ通知
            </Text>
            <Switch
              value={notifications.messages}
              onValueChange={() => handleToggleNotification('messages')}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor="white"
            />
          </View>
          
          <View style={[styles.settingItem, { backgroundColor: colors.card }]}>
            <Text style={[styles.settingLabel, { color: colors.text }]}>
              リクエスト通知
            </Text>
            <Switch
              value={notifications.requests}
              onValueChange={() => handleToggleNotification('requests')}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor="white"
            />
          </View>
          
          <View style={[styles.settingItem, { backgroundColor: colors.card }]}>
            <Text style={[styles.settingLabel, { color: colors.text }]}>
              ピン通知
            </Text>
            <Switch
              value={notifications.pins}
              onValueChange={() => handleToggleNotification('pins')}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor="white"
            />
          </View>
          
          <View style={[styles.settingItem, { backgroundColor: colors.card }]}>
            <Text style={[styles.settingLabel, { color: colors.text }]}>
              システム通知
            </Text>
            <Switch
              value={notifications.system}
              onValueChange={() => handleToggleNotification('system')}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor="white"
            />
          </View>
        </View>
        
        <View style={styles.sectionContainer}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            アプリ設定
          </Text>
          
          <View style={[styles.settingItem, { backgroundColor: colors.card }]}>
            <Text style={[styles.settingLabel, { color: colors.text }]}>
              ダークモード
            </Text>
            <Switch
              value={theme === 'dark'}
              onValueChange={toggleTheme}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor="white"
            />
          </View>
          
          <TouchableOpacity
            style={[styles.settingItem, { backgroundColor: colors.card }]}
            onPress={() => {/* 言語設定 */}}
          >
            <Text style={[styles.settingLabel, { color: colors.text }]}>
              言語
            </Text>
            <Text style={[styles.settingValue, { color: colors.textSecondary }]}>
              日本語
            </Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.sectionContainer}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            サポート
          </Text>
          
          <TouchableOpacity
            style={[styles.settingItem, { backgroundColor: colors.card }]}
            onPress={() => {/* ヘルプセンター */}}
          >
            <Text style={[styles.settingLabel, { color: colors.text }]}>
              ヘルプセンター
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.settingItem, { backgroundColor: colors.card }]}
            onPress={() => {/* 利用規約 */}}
          >
            <Text style={[styles.settingLabel, { color: colors.text }]}>
              利用規約
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.settingItem, { backgroundColor: colors.card }]}
            onPress={() => {/* プライバシーポリシー */}}
          >
            <Text style={[styles.settingLabel, { color: colors.text }]}>
              プライバシーポリシー
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.settingItem, { backgroundColor: colors.card }]}
            onPress={() => {/* お問い合わせ */}}
          >
            <Text style={[styles.settingLabel, { color: colors.text }]}>
              お問い合わせ
            </Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.versionContainer}>
          <Text style={[styles.versionText, { color: colors.textSecondary }]}>
            バージョン 1.0.0
          </Text>
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
  sectionContainer: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
  },
  settingLabel: {
    fontSize: 16,
  },
  settingValue: {
    fontSize: 14,
  },
  versionContainer: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 40,
  },
  versionText: {
    fontSize: 14,
  },
});

export default SettingsScreen;
