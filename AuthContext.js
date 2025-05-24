import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // 起動時に保存されたユーザー情報を確認
    const loadUserFromStorage = async () => {
      try {
        const userJson = await AsyncStorage.getItem('user');
        if (userJson) {
          setUser(JSON.parse(userJson));
        }
      } catch (e) {
        setError('ユーザー情報の読み込みに失敗しました');
      } finally {
        setLoading(false);
      }
    };

    loadUserFromStorage();
  }, []);

  const login = async (email, password) => {
    try {
      setLoading(true);
      // 実際のAPIリクエストはここに実装
      // 仮のユーザーデータ
      const userData = {
        id: '123456',
        name: 'テストユーザー',
        email: email,
        profileImage: null,
        verificationStatus: {
          isEmailVerified: true,
          isStudentIdVerified: false
        },
        points: 100
      };
      
      await AsyncStorage.setItem('user', JSON.stringify(userData));
      setUser(userData);
      return userData;
    } catch (e) {
      setError('ログインに失敗しました');
      throw e;
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData) => {
    try {
      setLoading(true);
      // 実際のAPIリクエストはここに実装
      // 仮の登録処理
      const newUser = {
        id: Math.random().toString(36).substr(2, 9),
        ...userData,
        verificationStatus: {
          isEmailVerified: false,
          isStudentIdVerified: false
        },
        points: 0
      };
      
      await AsyncStorage.setItem('user', JSON.stringify(newUser));
      setUser(newUser);
      return newUser;
    } catch (e) {
      setError('アカウント登録に失敗しました');
      throw e;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await AsyncStorage.removeItem('user');
      setUser(null);
    } catch (e) {
      setError('ログアウトに失敗しました');
    }
  };

  const updateProfile = async (profileData) => {
    try {
      setLoading(true);
      // 実際のAPIリクエストはここに実装
      const updatedUser = { ...user, ...profileData };
      await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
      setUser(updatedUser);
      return updatedUser;
    } catch (e) {
      setError('プロフィール更新に失敗しました');
      throw e;
    } finally {
      setLoading(false);
    }
  };

  const verifyStudentId = async (studentIdImages, faceImage) => {
    try {
      setLoading(true);
      // 実際のAPIリクエストはここに実装
      const updatedUser = { 
        ...user, 
        verificationStatus: {
          ...user.verificationStatus,
          isStudentIdVerified: true,
          studentIdImages,
          faceImage,
          verificationDate: new Date().toISOString()
        } 
      };
      await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
      setUser(updatedUser);
      return updatedUser;
    } catch (e) {
      setError('学生証認証に失敗しました');
      throw e;
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      loading, 
      error, 
      login, 
      register, 
      logout, 
      updateProfile,
      verifyStudentId
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
