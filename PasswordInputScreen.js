import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useTheme } from './ThemeContext';

const PasswordInputScreen = ({ navigation, route }) => {
  const { colors } = useTheme();
  const { name, userId, birthDate, email } = route.params;
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleNext = () => {
    if (!password.trim() || !confirmPassword.trim()) {
      Alert.alert('エラー', 'パスワードを入力してください');
      return;
    }
    
    if (password !== confirmPassword) {
      Alert.alert('エラー', 'パスワードが一致しません');
      return;
    }
    
    if (password.length < 8) {
      Alert.alert('エラー', 'パスワードは8文字以上で設定してください');
      return;
    }
    
    // 次の画面に情報を渡して遷移
    navigation.navigate('ProfilePhoto', { 
      name, 
      userId, 
      birthDate,
      email,
      password
    });
  };

  return (
    <ScrollView 
      contentContainerStyle={[styles.container, { backgroundColor: colors.background }]}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.contentContainer}>
        <Text style={[styles.title, { color: colors.text }]}>
          ログイン時のパスワードが必要です
        </Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          8文字以上で設定してください
        </Text>
        
        <View style={styles.inputContainer}>
          <TextInput
            style={[styles.input, { 
              backgroundColor: colors.card, 
              color: colors.text,
              borderColor: colors.border 
            }]}
            placeholder="パスワードを入力"
            placeholderTextColor={colors.textSecondary}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoFocus
          />
        </View>
        
        <View style={styles.inputContainer}>
          <TextInput
            style={[styles.input, { 
              backgroundColor: colors.card, 
              color: colors.text,
              borderColor: colors.border 
            }]}
            placeholder="パスワードを再入力"
            placeholderTextColor={colors.textSecondary}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
          />
        </View>
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button, { 
            backgroundColor: colors.primary,
            opacity: (!password.trim() || !confirmPassword.trim()) ? 0.7 : 1 
          }]}
          onPress={handleNext}
          disabled={!password.trim() || !confirmPassword.trim()}
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

export default PasswordInputScreen;
