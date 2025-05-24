import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, Alert } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';

const PinDetailScreen = ({ navigation, route }) => {
  const { colors } = useTheme();
  const { pinId } = route.params;
  const [pin, setPin] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // ピンの詳細データを取得（実際のアプリではAPIから取得）
    const fetchPinDetail = async () => {
      try {
        // 仮のピンデータ
        const dummyPin = {
          id: pinId,
          creatorId: 'user1',
          creatorName: '田中さん',
          creatorImage: null,
          title: '一緒にランチしませんか？',
          description: '学食で一緒にランチしましょう！新しいメニューが出たらしいので、ぜひ一緒に食べに行きましょう。初めての方も大歓迎です！',
          location: {
            latitude: 35.6812,
            longitude: 139.7671,
            address: '東京都千代田区'
          },
          dateTime: new Date().toISOString(),
          isToday: true,
          status: 'active',
          participants: [],
          requests: [],
          createdAt: new Date().toISOString()
        };
        
        setPin(dummyPin);
      } catch (error) {
        console.error('Error fetching pin detail:', error);
        Alert.alert('エラー', 'ピン情報の取得に失敗しました');
      } finally {
        setLoading(false);
      }
    };

    fetchPinDetail();
  }, [pinId]);

  const handleSendRequest = () => {
    navigation.navigate('SendRequest', { pinId: pin.id });
  };

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <Text style={[styles.loadingText, { color: colors.text }]}>
          読み込み中...
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {pin.isToday && (
          <View style={styles.todayBadge}>
            <Text style={styles.todayBadgeText}>今日！</Text>
          </View>
        )}
        
        <Text style={[styles.title, { color: colors.text }]}>
          {pin.title}
        </Text>
        
        <View style={styles.creatorContainer}>
          <View style={[styles.creatorImageContainer, { backgroundColor: colors.card }]}>
            {pin.creatorImage ? (
              <Image source={{ uri: pin.creatorImage }} style={styles.creatorImage} />
            ) : (
              <Text style={[styles.creatorInitial, { color: colors.primary }]}>
                {pin.creatorName.charAt(0)}
              </Text>
            )}
          </View>
          <Text style={[styles.creatorName, { color: colors.textSecondary }]}>
            {pin.creatorName}
          </Text>
        </View>
        
        <View style={[styles.infoContainer, { backgroundColor: colors.card }]}>
          <View style={styles.infoItem}>
            <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>
              日時
            </Text>
            <Text style={[styles.infoValue, { color: colors.text }]}>
              {new Date(pin.dateTime).toLocaleString('ja-JP', { 
                year: 'numeric',
                month: 'numeric', 
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </Text>
          </View>
          
          <View style={styles.infoItem}>
            <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>
              場所
            </Text>
            <Text style={[styles.infoValue, { color: colors.text }]}>
              {pin.location.address}
            </Text>
          </View>
          
          <View style={styles.infoItem}>
            <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>
              参加者
            </Text>
            <Text style={[styles.infoValue, { color: colors.text }]}>
              {pin.participants.length}人
            </Text>
          </View>
        </View>
        
        <View style={styles.descriptionContainer}>
          <Text style={[styles.descriptionLabel, { color: colors.text }]}>
            詳細
          </Text>
          <Text style={[styles.description, { color: colors.text }]}>
            {pin.description || 'No description provided.'}
          </Text>
        </View>
        
        <View style={styles.mapContainer}>
          <Text style={[styles.mapLabel, { color: colors.text }]}>
            場所
          </Text>
          <MapView
            style={styles.map}
            provider={PROVIDER_GOOGLE}
            initialRegion={{
              latitude: pin.location.latitude,
              longitude: pin.location.longitude,
              latitudeDelta: 0.01,
              longitudeDelta: 0.01,
            }}
            scrollEnabled={false}
            zoomEnabled={false}
          >
            <Marker
              coordinate={{
                latitude: pin.location.latitude,
                longitude: pin.location.longitude,
              }}
              title={pin.title}
              pinColor="#FF4081"
            />
          </MapView>
        </View>
      </ScrollView>
      
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button, { backgroundColor: colors.primary }]}
          onPress={handleSendRequest}
        >
          <Text style={styles.buttonText}>リクエストを送る</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
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
  scrollContainer: {
    padding: 20,
    paddingBottom: 100,
  },
  todayBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#FF4081',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    marginBottom: 10,
  },
  todayBadgeText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  creatorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  creatorImageContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  creatorImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  creatorInitial: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  creatorName: {
    fontSize: 16,
  },
  infoContainer: {
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
  },
  infoItem: {
    marginBottom: 10,
  },
  infoLabel: {
    fontSize: 14,
    marginBottom: 5,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '500',
  },
  descriptionContainer: {
    marginBottom: 20,
  },
  descriptionLabel: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 10,
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
  },
  mapContainer: {
    marginBottom: 20,
  },
  mapLabel: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 10,
  },
  map: {
    height: 200,
    borderRadius: 10,
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

export default PinDetailScreen;
