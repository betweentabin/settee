import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView, Alert } from 'react-native';
import { useTheme } from './ThemeContext';
import * as ImagePicker from 'expo-image-picker';

const StudentVerificationScreen = ({ navigation, route }) => {
  const { colors } = useTheme();
  const { name, userId, birthDate, email, password, profileImage } = route.params;
  const [frontImage, setFrontImage] = useState(null);
  const [backImage, setBackImage] = useState(null);
  const [faceImage, setFaceImage] = useState(null);

  const pickImage = async (setter) => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert('エラー', 'カメラロールへのアクセス許可が必要です');
      return;
    }
    
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });
    
    if (!result.canceled) {
      setter(result.assets[0].uri);
    }
  };
  
  const takePhoto = async (setter) => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert('エラー', 'カメラへのアクセス許可が必要です');
      return;
    }
    
    let result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });
    
    if (!result.canceled) {
      setter(result.assets[0].uri);
    }
  };

  const handleNext = () => {
    // 学生証画像が揃っているか確認
    if (!frontImage || !backImage || !faceImage) {
      Alert.alert('確認', '学生証の画像が不足しています。後で提出することもできますが、一部機能が制限される場合があります。続行しますか？', [
        {
          text: 'キャンセル',
          style: 'cancel'
        },
        {
          text: '続行',
          onPress: () => proceedToRegistration()
        }
      ]);
    } else {
      proceedToRegistration();
    }
  };
  
  const proceedToRegistration = () => {
    // 登録処理を行い、完了画面に遷移
    // 実際のアプリでは、ここでAPIリクエストを行う
    
    // 登録情報をまとめる
    const userData = {
      name,
      userId,
      birthDate,
      email,
      password,
      profileImage,
      verification: {
        frontImage,
        backImage,
        faceImage,
        isVerified: false // 初期状態は未認証
      }
    };
    
    // 完了画面に遷移
    navigation.navigate('Completion', { userData });
  };
  
  const handleSkip = () => {
    // 学生証認証をスキップして次の画面に遷移
    proceedToRegistration();
  };

  return (
    <ScrollView 
      contentContainerStyle={[styles.container, { backgroundColor: colors.background }]}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.contentContainer}>
        <Text style={[styles.title, { color: colors.text }]}>
          学生証の提出
        </Text>
        
        <View style={styles.verificationContainer}>
          <View style={styles.verificationItem}>
            <View style={[styles.verificationImageContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
              {frontImage ? (
                <Image source={{ uri: frontImage }} style={styles.verificationImage} />
              ) : (
                <Text style={[styles.verificationPlaceholder, { color: colors.textSecondary }]}>
                  表面・裏面を撮影
                </Text>
              )}
            </View>
            <TouchableOpacity
              style={[styles.verificationButton, { backgroundColor: colors.primary }]}
              onPress={() => takePhoto(setFrontImage)}
            >
              <Text style={styles.verificationButtonText}>撮影する</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.verificationItem}>
            <View style={[styles.verificationImageContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
              {backImage ? (
                <Image source={{ uri: backImage }} style={styles.verificationImage} />
              ) : (
                <Text style={[styles.verificationPlaceholder, { color: colors.textSecondary }]}>
                  カードの裏面を撮影
                </Text>
              )}
            </View>
            <TouchableOpacity
              style={[styles.verificationButton, { backgroundColor: colors.primary }]}
              onPress={() => takePhoto(setBackImage)}
            >
              <Text style={styles.verificationButtonText}>撮影する</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.verificationItem}>
            <View style={[styles.verificationImageContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
              {faceImage ? (
                <Image source={{ uri: faceImage }} style={styles.verificationImage} />
              ) : (
                <Text style={[styles.verificationPlaceholder, { color: colors.textSecondary }]}>
                  顔の写真を撮影
                </Text>
              )}
            </View>
            <TouchableOpacity
              style={[styles.verificationButton, { backgroundColor: colors.primary }]}
              onPress={() => takePhoto(setFaceImage)}
            >
              <Text style={styles.verificationButtonText}>撮影する</Text>
            </TouchableOpacity>
          </View>
        </View>
        
        <Text style={[styles.note, { color: colors.textSecondary }]}>
          ※提出していただいた画像は本人確認にのみ使用し、厳重に管理します
        </Text>
        
        <TouchableOpacity
          style={styles.skipButton}
          onPress={handleSkip}
        >
          <Text style={[styles.skipButtonText, { color: colors.textSecondary }]}>
            後で提出する
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.nextButtonContainer}>
        <TouchableOpacity
          style={[styles.nextButton, { 
            backgroundColor: colors.primary,
            opacity: (!frontImage || !backImage || !faceImage) ? 0.7 : 1 
          }]}
          onPress={handleNext}
        >
          <Text style={styles.nextButtonText}>
            {(!frontImage || !backImage || !faceImage) ? '後で提出して続ける' : '提出して続ける'}
          </Text>
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
    marginTop: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 30,
    textAlign: 'center',
  },
  verificationContainer: {
    width: '100%',
    marginBottom: 20,
  },
  verificationItem: {
    marginBottom: 20,
  },
  verificationImageContainer: {
    width: '100%',
    height: 150,
    borderRadius: 10,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
    overflow: 'hidden',
  },
  verificationImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  verificationPlaceholder: {
    fontSize: 16,
  },
  verificationButton: {
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  verificationButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  note: {
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 20,
  },
  skipButton: {
    marginTop: 10,
  },
  skipButtonText: {
    fontSize: 16,
  },
  nextButtonContainer: {
    width: '100%',
    marginBottom: 30,
  },
  nextButton: {
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  nextButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default StudentVerificationScreen;
