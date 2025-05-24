import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView, Alert } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import * as ImagePicker from 'expo-image-picker';

const ProfilePhotoScreen = ({ navigation, route }) => {
  const { colors } = useTheme();
  const { name, userId, birthDate, email, password } = route.params;
  const [image, setImage] = useState(null);

  const pickImage = async () => {
    // カメラロールへのアクセス許可を取得
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert('エラー', 'カメラロールへのアクセス許可が必要です');
      return;
    }
    
    // 画像選択ダイアログを表示
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    
    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };
  
  const takePhoto = async () => {
    // カメラへのアクセス許可を取得
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert('エラー', 'カメラへのアクセス許可が必要です');
      return;
    }
    
    // カメラを起動
    let result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    
    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  const handleNext = () => {
    // 次の画面に情報を渡して遷移
    navigation.navigate('StudentVerification', { 
      name, 
      userId, 
      birthDate,
      email,
      password,
      profileImage: image
    });
  };
  
  const handleSkip = () => {
    // プロフィール画像なしで次の画面に遷移
    navigation.navigate('StudentVerification', { 
      name, 
      userId, 
      birthDate,
      email,
      password,
      profileImage: null
    });
  };

  return (
    <ScrollView 
      contentContainerStyle={[styles.container, { backgroundColor: colors.background }]}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.contentContainer}>
        <Text style={[styles.title, { color: colors.text }]}>
          プロフィール写真を
        </Text>
        <Text style={[styles.subtitle, { color: colors.text }]}>
          設定してください
        </Text>
        
        <View style={styles.imageContainer}>
          {image ? (
            <Image
              source={{ uri: image }}
              style={styles.profileImage}
            />
          ) : (
            <View style={[styles.placeholderImage, { backgroundColor: colors.card }]} />
          )}
        </View>
        
        <View style={styles.buttonGroup}>
          <TouchableOpacity
            style={[styles.photoButton, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={takePhoto}
          >
            <Text style={[styles.photoButtonText, { color: colors.primary }]}>カメラ</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.photoButton, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={pickImage}
          >
            <Text style={[styles.photoButtonText, { color: colors.primary }]}>アルバム</Text>
          </TouchableOpacity>
        </View>
        
        <TouchableOpacity
          style={styles.skipButton}
          onPress={handleSkip}
        >
          <Text style={[styles.skipButtonText, { color: colors.textSecondary }]}>
            後で設定する
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.nextButtonContainer}>
        <TouchableOpacity
          style={[styles.nextButton, { 
            backgroundColor: colors.primary,
            opacity: !image ? 0.7 : 1 
          }]}
          onPress={handleNext}
          disabled={!image}
        >
          <Text style={styles.nextButtonText}>次へ</Text>
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
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 40,
    textAlign: 'center',
  },
  imageContainer: {
    marginBottom: 30,
  },
  profileImage: {
    width: 150,
    height: 150,
    borderRadius: 75,
  },
  placeholderImage: {
    width: 150,
    height: 150,
    borderRadius: 75,
  },
  buttonGroup: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 20,
  },
  photoButton: {
    width: '48%',
    height: 50,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  photoButtonText: {
    fontSize: 16,
    fontWeight: '600',
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

export default ProfilePhotoScreen;
