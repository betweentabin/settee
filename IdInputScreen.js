import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useTheme } from './ThemeContext';

const IdInputScreen = ({ navigation, route }) => {
  const { colors } = useTheme();
  const { name } = route.params;
  const [userId, setUserId] = useState('');

  const handleNext = () => {
    if (!userId.trim()) {
      Alert.alert('エラー', 'IDを入力してください');
      return;
    }
    
    // 次の画面に名前とIDを渡して遷移
    navigation.navigate('BirthDate', { name, userId });
  };

  return (
    <ScrollView 
      contentContainerStyle={[styles.container, { backgroundColor: colors.background }]}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.contentContainer}>
        <Text style={[styles.title, { color: colors.text }]}>
          あなたのIDを決めてください
        </Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          世界でひとつのオリジナルIDになります
        </Text>
        
        <View style={styles.inputContainer}>
          <TextInput
            style={[styles.input, { 
              backgroundColor: colors.card, 
              color: colors.text,
              borderColor: colors.border 
            }]}
            placeholder="IDを入力"
            placeholderTextColor={colors.textSecondary}
            value={userId}
            onChangeText={setUserId}
            autoCapitalize="none"
            autoCorrect={false}
            autoFocus
          />
          <Text style={[styles.helperText, { color: colors.textSecondary }]}>
            ※IDは英数字とアンダースコアのみ使用できます
          </Text>
        </View>
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button, { 
            backgroundColor: colors.primary,
            opacity: !userId.trim() ? 0.7 : 1 
          }]}
          onPress={handleNext}
          disabled={!userId.trim()}
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
  helperText: {
    fontSize: 12,
    marginTop: 5,
    marginLeft: 5,
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

export default IdInputScreen;
