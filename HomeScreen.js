import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../contexts/ThemeContext';
import { useLocation } from '../../contexts/LocationContext';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';

const API_BASE_URL = 'http://localhost:5000/api'; // Temporary: Should be in a shared config

const HomeScreen = () => {
  const { colors } = useTheme();
  const { location, getCurrentLocation, errorMsg: locationErrorMsg } = useLocation();
  const [pins, setPins] = useState([]);
  const [loadingPins, setLoadingPins] = useState(true);
  const [pinsError, setPinsError] = useState(null);
  const navigation = useNavigation();

  useEffect(() => {
    // 位置情報を取得
    const fetchLocation = async () => {
      await getCurrentLocation();
    };

    // ピンデータを取得
    const fetchPins = async () => {
      setLoadingPins(true);
      setPinsError(null);
      try {
        const response = await fetch(`${API_BASE_URL}/pins`);
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'ピンの取得に失敗しました');
        }
        const data = await response.json();
        setPins(data);
      } catch (error) {
        console.error('Error fetching pins:', error);
        setPinsError(error.message || 'ピンの読み込み中にエラーが発生しました');
      } finally {
        setLoadingPins(false);
      }
    };

    fetchLocation();
    fetchPins();
  }, [getCurrentLocation]); // Added getCurrentLocation to dependency array

  const renderPinItem = ({ item }) => (
    <TouchableOpacity
      style={[styles.pinItem, { backgroundColor: colors.card }]}
      onPress={() => navigation.navigate('PinDetail', { pinId: item._id })} // Assuming pin ID from backend is _id
    >
      {item.isToday && (
        <View style={styles.todayBadge}>
          <Text style={styles.todayBadgeText}>今日！</Text>
        </View>
      )}
      
      <View style={styles.pinHeader}>
        <Text style={[styles.pinTitle, { color: colors.text }]}>{item.title}</Text>
        <Text style={[styles.pinCreator, { color: colors.textSecondary }]}>
          by {item.creatorName}
        </Text>
      </View>
      
      <Text style={[styles.pinDescription, { color: colors.textSecondary }]}>
        {item.description}
      </Text>
      
      <View style={styles.pinFooter}>
        <Text style={[styles.pinLocation, { color: colors.textSecondary }]}>
          📍 {item.location.address}
        </Text>
        
        <Text style={[styles.pinDateTime, { color: colors.textSecondary }]}>
          🕒 {new Date(item.dateTime).toLocaleString('ja-JP', { 
            month: 'numeric', 
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })}
        </Text>
        
        <Text style={[styles.pinParticipants, { color: colors.textSecondary }]}>
          👥 参加者: {item.participants}人
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {location ? (
        <MapView
          style={styles.map}
          provider={PROVIDER_GOOGLE}
          initialRegion={{
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          }}
        >
          {/* 現在地のマーカー */}
          <Marker
            coordinate={{
              latitude: location.coords.latitude,
              longitude: location.coords.longitude,
            }}
            title="現在地"
            pinColor="#6200EE"
          />
          
          {/* ピンのマーカー */}
          {pins.map(pin => (
            <Marker
              key={pin.id}
              coordinate={{
                latitude: pin.location.latitude,
                longitude: pin.location.longitude,
              }}
              title={pin.title}
              description={pin.description}
              pinColor={pin.isToday ? "#FF4081" : "#03DAC6"}
            />
          ))}
        </MapView>
      ) : (
        <View style={[styles.loadingContainer, { backgroundColor: colors.card }]}>
          <Text style={[styles.loadingText, { color: colors.text }]}>
            {locationErrorMsg || '位置情報を取得中...'}
          </Text>
        </View>
      )}
      
      <View style={styles.pinListContainer}>
        <Text style={[styles.pinListTitle, { color: colors.text }]}>
          近くのピン
        </Text>
        
        {loadingPins ? (
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            ピンを読み込み中...
          </Text>
        ) : pinsError ? (
          <Text style={[styles.errorText, { color: colors.error }]}>
            {pinsError}
          </Text>
        ) : (
          <FlatList
            data={pins}
            renderItem={renderPinItem}
            keyExtractor={item => item._id} // Assuming pin ID from backend is _id
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.pinList}
            ListEmptyComponent={
              <Text style={[styles.emptyListText, { color: colors.textSecondary }]}>
                近くにピンはありません。
              </Text>
            }
          />
        )}
      </View>
      
      <TouchableOpacity
        style={[styles.createPinButton, { backgroundColor: colors.primary }]}
        onPress={() => navigation.navigate('CreatePin')}
      >
        <Text style={styles.createPinButtonText}>ピンを立てる</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    marginHorizontal: 20,
  },
  emptyListText: {
    fontSize: 14,
    textAlign: 'center',
    fontStyle: 'italic',
    paddingHorizontal: 20,
  },
  pinListContainer: {
    position: 'absolute',
    bottom: 100,
    left: 0,
    right: 0,
    paddingVertical: 15,
  },
  pinListTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 20,
    marginBottom: 10,
  },
  pinList: {
    paddingHorizontal: 10,
  },
  pinItem: {
    width: 280,
    borderRadius: 15,
    padding: 15,
    marginHorizontal: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  todayBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: '#FF4081',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  todayBadgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  pinHeader: {
    marginBottom: 10,
  },
  pinTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  pinCreator: {
    fontSize: 12,
  },
  pinDescription: {
    fontSize: 14,
    marginBottom: 10,
  },
  pinFooter: {
    marginTop: 5,
  },
  pinLocation: {
    fontSize: 12,
    marginBottom: 3,
  },
  pinDateTime: {
    fontSize: 12,
    marginBottom: 3,
  },
  pinParticipants: {
    fontSize: 12,
  },
  createPinButton: {
    position: 'absolute',
    bottom: 20,
    alignSelf: 'center',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  createPinButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default HomeScreen;
