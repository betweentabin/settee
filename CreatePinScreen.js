import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { useLocation } from '../../contexts/LocationContext';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import DateTimePicker from '@react-native-community/datetimepicker';

const CreatePinScreen = ({ navigation }) => {
  const { colors } = useTheme();
  const { location } = useLocation();
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date());
  const [time, setTime] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [pinLocation, setPinLocation] = useState(
    location ? {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
    } : null
  );

  const handleCreatePin = () => {
    if (!title.trim()) {
      Alert.alert('エラー', 'タイトルを入力してください');
      return;
    }
    
    if (!pinLocation) {
      Alert.alert('エラー', 'ピンを立てる位置を選択してください');
      return;
    }
    
    // 日付と時間を結合
    const dateTime = new Date(date);
    dateTime.setHours(time.getHours());
    dateTime.setMinutes(time.getMinutes());
    
    // 現在時刻より過去の場合はエラー
    if (dateTime < new Date()) {
      Alert.alert('エラー', '過去の日時は選択できません');
      return;
    }
    
    // 1週間以上先の場合はエラー
    const oneWeekLater = new Date();
    oneWeekLater.setDate(oneWeekLater.getDate() + 7);
    if (dateTime > oneWeekLater) {
      Alert.alert('エラー', '1週間以内の日時を選択してください');
      return;
    }
    
    // ピンデータを作成
    const pinData = {
      title,
      description,
      dateTime: dateTime.toISOString(),
      location: pinLocation,
      isToday: dateTime.toDateString() === new Date().toDateString(),
    };
    
    // 実際のアプリではここでAPIリクエストを行う
    console.log('Creating pin:', pinData);
    
    // 成功したらホーム画面に戻る
    Alert.alert('成功', 'ピンを立てました', [
      {
        text: 'OK',
        onPress: () => navigation.goBack()
      }
    ]);
  };
  
  const onMapPress = (e) => {
    setPinLocation(e.nativeEvent.coordinate);
  };
  
  const onDateChange = (event, selectedDate) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setDate(selectedDate);
    }
  };
  
  const onTimeChange = (event, selectedTime) => {
    setShowTimePicker(false);
    if (selectedTime) {
      setTime(selectedTime);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <Text style={[styles.title, { color: colors.text }]}>
          ピンを立てる
        </Text>
        
        <View style={styles.formContainer}>
          <View style={styles.inputContainer}>
            <Text style={[styles.label, { color: colors.text }]}>タイトル</Text>
            <TextInput
              style={[styles.input, { 
                backgroundColor: colors.card, 
                color: colors.text,
                borderColor: colors.border 
              }]}
              placeholder="タイトルを入力"
              placeholderTextColor={colors.textSecondary}
              value={title}
              onChangeText={setTitle}
            />
          </View>
          
          <View style={styles.inputContainer}>
            <Text style={[styles.label, { color: colors.text }]}>説明</Text>
            <TextInput
              style={[styles.textArea, { 
                backgroundColor: colors.card, 
                color: colors.text,
                borderColor: colors.border 
              }]}
              placeholder="詳細を入力（任意）"
              placeholderTextColor={colors.textSecondary}
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>
          
          <View style={styles.dateTimeContainer}>
            <View style={styles.dateContainer}>
              <Text style={[styles.label, { color: colors.text }]}>日付</Text>
              <TouchableOpacity
                style={[styles.dateButton, { 
                  backgroundColor: colors.card,
                  borderColor: colors.border 
                }]}
                onPress={() => setShowDatePicker(true)}
              >
                <Text style={[styles.dateButtonText, { color: colors.text }]}>
                  {date.toLocaleDateString('ja-JP')}
                </Text>
              </TouchableOpacity>
              
              {showDatePicker && (
                <DateTimePicker
                  value={date}
                  mode="date"
                  display="default"
                  onChange={onDateChange}
                  minimumDate={new Date()}
                  maximumDate={new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)} // 1週間後
                />
              )}
            </View>
            
            <View style={styles.timeContainer}>
              <Text style={[styles.label, { color: colors.text }]}>時間</Text>
              <TouchableOpacity
                style={[styles.dateButton, { 
                  backgroundColor: colors.card,
                  borderColor: colors.border 
                }]}
                onPress={() => setShowTimePicker(true)}
              >
                <Text style={[styles.dateButtonText, { color: colors.text }]}>
                  {time.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })}
                </Text>
              </TouchableOpacity>
              
              {showTimePicker && (
                <DateTimePicker
                  value={time}
                  mode="time"
                  display="default"
                  onChange={onTimeChange}
                />
              )}
            </View>
          </View>
          
          <View style={styles.mapContainer}>
            <Text style={[styles.label, { color: colors.text }]}>場所</Text>
            <Text style={[styles.sublabel, { color: colors.textSecondary }]}>
              地図をタップして場所を選択
            </Text>
            
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
                onPress={onMapPress}
              >
                {pinLocation && (
                  <Marker
                    coordinate={pinLocation}
                    title="ピンの位置"
                    pinColor="#FF4081"
                  />
                )}
              </MapView>
            ) : (
              <View style={[styles.mapPlaceholder, { backgroundColor: colors.card }]}>
                <Text style={[styles.mapPlaceholderText, { color: colors.textSecondary }]}>
                  位置情報を取得中...
                </Text>
              </View>
            )}
          </View>
        </View>
      </ScrollView>
      
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button, { 
            backgroundColor: colors.primary,
            opacity: (!title.trim() || !pinLocation) ? 0.7 : 1 
          }]}
          onPress={handleCreatePin}
          disabled={!title.trim() || !pinLocation}
        >
          <Text style={styles.buttonText}>ピンを立てる</Text>
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
    marginBottom: 20,
    marginTop: 10,
  },
  formContainer: {
    width: '100%',
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  sublabel: {
    fontSize: 14,
    marginBottom: 8,
  },
  input: {
    height: 50,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 15,
    fontSize: 16,
  },
  textArea: {
    height: 100,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 15,
    paddingTop: 10,
    fontSize: 16,
  },
  dateTimeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  dateContainer: {
    width: '48%',
  },
  timeContainer: {
    width: '48%',
  },
  dateButton: {
    height: 50,
    borderRadius: 10,
    borderWidth: 1,
    justifyContent: 'center',
    paddingHorizontal: 15,
  },
  dateButtonText: {
    fontSize: 16,
  },
  mapContainer: {
    marginBottom: 20,
  },
  map: {
    height: 200,
    borderRadius: 10,
    marginTop: 10,
  },
  mapPlaceholder: {
    height: 200,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  mapPlaceholderText: {
    fontSize: 16,
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

export default CreatePinScreen;
