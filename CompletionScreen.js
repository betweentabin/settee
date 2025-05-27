import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Animated } from 'react-native';
import { useTheme } from './ThemeContext';
import { useAuth } from './AuthContext';

const CompletionScreen = ({ navigation, route }) => {
  const { colors } = useTheme();
  const { register } = useAuth();
  const { userData } = route.params;
  const [loading, setLoading] = useState(true);
  
  // アニメーション用の値
  const checkmarkScale = new Animated.Value(0);
  const fadeIn = new Animated.Value(0);
  
  useEffect(() => {
    // 登録処理を実行
    const completeRegistration = async () => {
      try {
        setLoading(true);
        // 実際のアプリではここでAPIリクエストを行う
        await register(userData);
        
        // 登録成功後、アニメーションを開始
        startAnimations();
      } catch (error) {
        console.error('Registration error:', error);
        // エラー処理
      } finally {
        setLoading(false);
      }
    };
    
    completeRegistration();
  }, []);
  
  const startAnimations = () => {
    // チェックマークのアニメーション
    Animated.spring(checkmarkScale, {
      toValue: 1,
      friction: 5,
      tension: 40,
      useNativeDriver: true,
    }).start();
    
    // テキストのフェードインアニメーション
    Animated.timing(fadeIn, {
      toValue: 1,
      duration: 800,
      delay: 400,
      useNativeDriver: true,
    }).start();
  };
  
  const handleContinue = () => {
    // メイン画面に遷移
    // AuthContextによって自動的にメイン画面に遷移するため、
    // ここでは特に何もする必要がない
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.contentContainer}>
        <Animated.View 
          style={[
            styles.checkmarkContainer, 
            { 
              backgroundColor: colors.primary,
              transform: [{ scale: checkmarkScale }] 
            }
          ]}
        >
          <Text style={styles.checkmark}>✓</Text>
        </Animated.View>
        
        <Animated.View style={{ opacity: fadeIn }}>
          <Text style={[styles.title, { color: colors.text }]}>
            登録完了！
          </Text>
          
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            {userData.name}さん、Setteeへようこそ！
          </Text>
          
          <Text style={[styles.description, { color: colors.textSecondary }]}>
            これからSetteeを使って、新しい出会いを見つけましょう。
          </Text>
        </Animated.View>
      </View>

      <Animated.View style={[styles.buttonContainer, { opacity: fadeIn }]}>
        <TouchableOpacity
          style={[styles.button, { backgroundColor: colors.primary }]}
          onPress={handleContinue}
        >
          <Text style={styles.buttonText}>始める</Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'space-between',
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkmarkContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 40,
  },
  checkmark: {
    color: 'white',
    fontSize: 60,
    fontWeight: 'bold',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  subtitle: {
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 10,
  },
  description: {
    fontSize: 16,
    textAlign: 'center',
    paddingHorizontal: 20,
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

export default CompletionScreen;
