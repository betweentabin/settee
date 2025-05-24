import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';

// Auth Screens
import SplashScreen from '../screens/auth/SplashScreen';
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import NameInputScreen from '../screens/auth/NameInputScreen';
import IdInputScreen from '../screens/auth/IdInputScreen';
import BirthDateScreen from '../screens/auth/BirthDateScreen';
import EmailInputScreen from '../screens/auth/EmailInputScreen';
import PasswordInputScreen from '../screens/auth/PasswordInputScreen';
import ProfilePhotoScreen from '../screens/auth/ProfilePhotoScreen';
import StudentVerificationScreen from '../screens/auth/StudentVerificationScreen';
import TutorialScreen from '../screens/auth/TutorialScreen';
import CompletionScreen from '../screens/auth/CompletionScreen';

// Main Screens
import HomeScreen from '../screens/main/HomeScreen';
import CreatePinScreen from '../screens/main/CreatePinScreen';
import ChatListScreen from '../screens/main/ChatListScreen';
import ProfileScreen from '../screens/main/ProfileScreen';
import SettingsScreen from '../screens/main/SettingsScreen';
import PinDetailScreen from '../screens/main/PinDetailScreen';
import SendRequestScreen from '../screens/main/SendRequestScreen';
import ChatRoomScreen from '../screens/main/ChatRoomScreen';
import PointsScreen from '../screens/main/PointsScreen';
import InviteFriendsScreen from '../screens/main/InviteFriendsScreen';
import SubscriptionScreen from '../screens/main/SubscriptionScreen';
import AccountScreen from '../screens/main/AccountScreen';

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
      <Stack.Screen name="Tutorial" component={TutorialScreen} />
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
      <Stack.Screen name="Subscription" component={SubscriptionScreen} />
      <Stack.Screen name="Settings" component={SettingsScreen} />
      <Stack.Screen name="Account" component={AccountScreen} />
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
