import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = 'http://localhost:5000/api';

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
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'ログインに失敗しました');
      }

      const userDataWithToken = { ...data.user, token: data.token };
      await AsyncStorage.setItem('user', JSON.stringify(userDataWithToken));
      setUser(userDataWithToken);
      return userDataWithToken;
    } catch (e) {
      setError(e.message || 'ログイン処理中にエラーが発生しました');
      throw e;
    } finally {
      setLoading(false);
    }
  };

  const register = async (registrationData) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(registrationData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'アカウント登録に失敗しました');
      }

      // Assuming backend returns user and token like login
      const newUserWithToken = { ...data.user, token: data.token };
      await AsyncStorage.setItem('user', JSON.stringify(newUserWithToken));
      setUser(newUserWithToken);
      return newUserWithToken;
    } catch (e) {
      setError(e.message || 'アカウント登録処理中にエラーが発生しました');
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
