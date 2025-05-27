import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useTheme } from './ThemeContext';
import { useAuth } from './AuthContext';

// Auth Screens
import SplashScreen from './SplashScreen';
import LoginScreen from './LoginScreen';
import RegisterScreen from './RegisterScreen';
import NameInputScreen from './NameInputScreen';
import IdInputScreen from './IdInputScreen';
import BirthDateScreen from './BirthDateScreen';
import EmailInputScreen from './EmailInputScreen';
import PasswordInputScreen from './PasswordInputScreen';
import ProfilePhotoScreen from './ProfilePhotoScreen';
import StudentVerificationScreen from './StudentVerificationScreen';
import CompletionScreen from './CompletionScreen';

// Main Screens
import HomeScreen from './HomeScreen';
import CreatePinScreen from './CreatePinScreen';
import ChatListScreen from './ChatListScreen';
import ProfileScreen from './ProfileScreen';
import SettingsScreen from './SettingsScreen';
import PinDetailScreen from './PinDetailScreen';
import SendRequestScreen from './SendRequestScreen';
import ChatRoomScreen from './ChatRoomScreen';
import PointsScreen from './PointsScreen';
import InviteFriendsScreen from './InviteFriendsScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

const AuthNavigator = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Splash" component={SplashScreen} />
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
      <Stack.Screen name="NameInput" component={NameInputScreen} />
      <Stack.Screen name="IdInput" component={IdInputScreen} />
      <Stack.Screen name="BirthDate" component={BirthDateScreen} />
      <Stack.Screen name="EmailInput" component={EmailInputScreen} />
      <Stack.Screen name="PasswordInput" component={PasswordInputScreen} />
      <Stack.Screen name="ProfilePhoto" component={ProfilePhotoScreen} />
      <Stack.Screen name="StudentVerification" component={StudentVerificationScreen} />
      <Stack.Screen name="Completion" component={CompletionScreen} />
    </Stack.Navigator>
  );
};

const TabNavigator = () => {
  const { colors } = useTheme();
  
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.card,
          borderTopColor: colors.border,
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
      }}
    >
      <Tab.Screen 
        name="Home" 
        component={HomeScreen} 
        options={{
          tabBarLabel: 'ホーム',
          // tabBarIcon: ({ color, size }) => <Icon name="home" color={color} size={size} />
        }}
      />
      <Tab.Screen 
        name="CreatePin" 
        component={CreatePinScreen} 
        options={{
          tabBarLabel: 'ピン作成',
          // tabBarIcon: ({ color, size }) => <Icon name="add-circle" color={color} size={size} />
        }}
      />
      <Tab.Screen 
        name="ChatList" 
        component={ChatListScreen} 
        options={{
          tabBarLabel: 'チャット',
          // tabBarIcon: ({ color, size }) => <Icon name="chatbubbles" color={color} size={size} />
        }}
      />
      <Tab.Screen 
        name="Profile" 
        component={ProfileScreen} 
        options={{
          tabBarLabel: 'プロフィール',
          // tabBarIcon: ({ color, size }) => <Icon name="person" color={color} size={size} />
        }}
      />
    </Tab.Navigator>
  );
};

const MainNavigator = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="TabNavigator" component={TabNavigator} />
      <Stack.Screen name="PinDetail" component={PinDetailScreen} />
      <Stack.Screen name="SendRequest" component={SendRequestScreen} />
      <Stack.Screen name="ChatRoom" component={ChatRoomScreen} />
      <Stack.Screen name="Points" component={PointsScreen} />
      <Stack.Screen name="InviteFriends" component={InviteFriendsScreen} />
      <Stack.Screen name="Settings" component={SettingsScreen} />
    </Stack.Navigator>
  );
};

const AppNavigator = () => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <SplashScreen />;
  }
  
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {user ? (
        <Stack.Screen name="Main" component={MainNavigator} />
      ) : (
        <Stack.Screen name="Auth" component={AuthNavigator} />
      )}
    </Stack.Navigator>
  );
};

export default AppNavigator;
