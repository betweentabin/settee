import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useTheme } from './ThemeContext';

const SendRequestScreen = ({ navigation, route }) => {
  const { colors } = useTheme();
  const { pinId } = route.params;
  const [message, setMessage] = useState('');

  const handleSendRequest = () => {
    if (!message.trim()) {
      Alert.alert('エラー', 'メッセージを入力してください');
      return;
    }
    
    // 実際のアプリではここでAPIリクエストを行う
    console.log('Sending request for pin:', pinId, 'with message:', message);
    
    // 成功したらアラートを表示してホーム画面に戻る
    Alert.alert('成功', 'リクエストを送信しました', [
      {
        text: 'OK',
        onPress: () => {
          navigation.navigate('Home');
        }
      }
    ]);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <Text style={[styles.title, { color: colors.text }]}>
          リクエストを送る
        </Text>
        
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          ピンの作成者にメッセージを送りましょう
        </Text>
        
        <View style={styles.formContainer}>
          <Text style={[styles.label, { color: colors.text }]}>メッセージ</Text>
          <TextInput
            style={[styles.textArea, { 
              backgroundColor: colors.card, 
              color: colors.text,
              borderColor: colors.border 
            }]}
            placeholder="自己紹介や参加理由などを書いてみましょう"
            placeholderTextColor={colors.textSecondary}
            value={message}
            onChangeText={setMessage}
            multiline
            numberOfLines={6}
            textAlignVertical="top"
          />
          
          <Text style={[styles.helperText, { color: colors.textSecondary }]}>
            ※相手に良い印象を与えるメッセージを心がけましょう
          </Text>
        </View>
        
        <View style={styles.infoContainer}>
          <Text style={[styles.infoTitle, { color: colors.text }]}>
            リクエスト送信後の流れ
          </Text>
          
          <View style={styles.infoItem}>
            <View style={[styles.infoNumber, { backgroundColor: colors.primary }]}>
              <Text style={styles.infoNumberText}>1</Text>
            </View>
            <Text style={[styles.infoText, { color: colors.text }]}>
              ピン作成者があなたのリクエストを確認します
            </Text>
          </View>
          
          <View style={styles.infoItem}>
            <View style={[styles.infoNumber, { backgroundColor: colors.primary }]}>
              <Text style={styles.infoNumberText}>2</Text>
            </View>
            <Text style={[styles.infoText, { color: colors.text }]}>
              承認されるとチャットが開始できます
            </Text>
          </View>
          
          <View style={styles.infoItem}>
            <View style={[styles.infoNumber, { backgroundColor: colors.primary }]}>
              <Text style={styles.infoNumberText}>3</Text>
            </View>
            <Text style={[styles.infoText, { color: colors.text }]}>
              チャットで詳細を決めて、実際に会いましょう！
            </Text>
          </View>
        </View>
      </ScrollView>
      
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button, { 
            backgroundColor: colors.primary,
            opacity: !message.trim() ? 0.7 : 1 
          }]}
          onPress={handleSendRequest}
          disabled={!message.trim()}
        >
          <Text style={styles.buttonText}>リクエストを送信</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContainer: {
    padding: 20,
    paddingBottom: 100,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    marginTop: 10,
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 30,
  },
  formContainer: {
    width: '100%',
    marginBottom: 30,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  textArea: {
    height: 150,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 15,
    paddingTop: 10,
    fontSize: 16,
  },
  helperText: {
    fontSize: 12,
    marginTop: 8,
  },
  infoContainer: {
    marginBottom: 20,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 15,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  infoNumber: {
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  infoNumberText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  infoText: {
    fontSize: 16,
    flex: 1,
  },
  buttonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    backgroundColor: 'rgba(0,0,0,0.05)',
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

export default SendRequestScreen;
