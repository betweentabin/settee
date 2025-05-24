import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';

const EmailInputScreen = ({ navigation, route }) => {
  const { colors } = useTheme();
  const { name, userId, birthDate } = route.params;
  const [email, setEmail] = useState('');

  const handleNext = () => {
    if (!email.trim()) {
      Alert.alert('エラー', 'メールアドレスを入力してください');
      return;
    }
    
    // 学校のメールアドレスかどうかの簡易チェック
    // 実際のアプリでは、より厳密な検証やAPIを使った検証が必要
    if (!email.includes('ac.jp') && !email.includes('edu')) {
      Alert.alert('エラー', '学校が発行しているメールアドレスを入力してください');
      return;
    }
    
    // 次の画面に情報を渡して遷移
    navigation.navigate('PasswordInput', { 
      name, 
      userId, 
      birthDate,
      email
    });
  };

  return (
    <ScrollView 
      contentContainerStyle={[styles.container, { backgroundColor: colors.background }]}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.contentContainer}>
        <Text style={[styles.title, { color: colors.text }]}>
          登録にはemailが必要です
        </Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          あなたのemailを教えてください
        </Text>
        
        <View style={styles.inputContainer}>
          <TextInput
            style={[styles.input, { 
              backgroundColor: colors.card, 
              color: colors.text,
              borderColor: colors.border 
            }]}
            placeholder="学校のメールアドレスを入力"
            placeholderTextColor={colors.textSecondary}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            autoFocus
          />
        </View>
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button, { 
            backgroundColor: colors.primary,
            opacity: !email.trim() ? 0.7 : 1 
          }]}
          onPress={handleNext}
          disabled={!email.trim()}
        >
          <Text style={styles.buttonText}>次へ</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 20,
    justifyContent: 'space-between',
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 60,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 40,
    textAlign: 'center',
  },
  inputContainer: {
    width: '100%',
    marginBottom: 20,
  },
  input: {
    height: 50,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 15,
    fontSize: 16,
    width: '100%',
  },
  buttonContainer: {
    width: '100%',
    marginBottom: 30,
  },
  button: {
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default EmailInputScreen;
