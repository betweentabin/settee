import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useTheme } from './ThemeContext';

const BirthDateScreen = ({ navigation, route }) => {
  const { colors } = useTheme();
  const { name, userId } = route.params;
  const [year, setYear] = useState('');
  const [month, setMonth] = useState('');
  const [day, setDay] = useState('');

  const handleNext = () => {
    if (!year || !month || !day) {
      Alert.alert('エラー', '生年月日を入力してください');
      return;
    }
    
    // 簡易的な日付バリデーション
    const birthDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    const today = new Date();
    const minAge = new Date();
    minAge.setFullYear(today.getFullYear() - 18); // 18歳以上を想定
    
    if (isNaN(birthDate.getTime())) {
      Alert.alert('エラー', '有効な日付を入力してください');
      return;
    }
    
    if (birthDate > today) {
      Alert.alert('エラー', '未来の日付は入力できません');
      return;
    }
    
    if (birthDate > minAge) {
      Alert.alert('確認', '18歳未満の方は保護者の同意が必要です。続行しますか？', [
        {
          text: 'キャンセル',
          style: 'cancel'
        },
        {
          text: '続行',
          onPress: () => proceedToNext(birthDate)
        }
      ]);
    } else {
      proceedToNext(birthDate);
    }
  };
  
  const proceedToNext = (birthDate) => {
    // 次の画面に名前、ID、生年月日を渡して遷移
    navigation.navigate('EmailInput', { 
      name, 
      userId, 
      birthDate: birthDate.toISOString() 
    });
  };

  return (
    <ScrollView 
      contentContainerStyle={[styles.container, { backgroundColor: colors.background }]}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.contentContainer}>
        <Text style={[styles.title, { color: colors.text }]}>
          こんにちは、はるまさん
        </Text>
        <Text style={[styles.subtitle, { color: colors.text }]}>
          次は生年月日を教えてください
        </Text>
        
        <View style={styles.dateContainer}>
          <View style={styles.dateInputGroup}>
            <View style={[styles.dateInputContainer, { width: '30%' }]}>
              <TextInput
                style={[styles.dateInput, { 
                  backgroundColor: colors.card, 
                  color: colors.text,
                  borderColor: colors.border 
                }]}
                placeholder="年"
                placeholderTextColor={colors.textSecondary}
                value={year}
                onChangeText={setYear}
                keyboardType="number-pad"
                maxLength={4}
              />
              <Text style={[styles.dateLabel, { color: colors.text }]}>年</Text>
            </View>
            
            <View style={[styles.dateInputContainer, { width: '20%' }]}>
              <TextInput
                style={[styles.dateInput, { 
                  backgroundColor: colors.card, 
                  color: colors.text,
                  borderColor: colors.border 
                }]}
                placeholder="月"
                placeholderTextColor={colors.textSecondary}
                value={month}
                onChangeText={setMonth}
                keyboardType="number-pad"
                maxLength={2}
              />
              <Text style={[styles.dateLabel, { color: colors.text }]}>月</Text>
            </View>
            
            <View style={[styles.dateInputContainer, { width: '20%' }]}>
              <TextInput
                style={[styles.dateInput, { 
                  backgroundColor: colors.card, 
                  color: colors.text,
                  borderColor: colors.border 
                }]}
                placeholder="日"
                placeholderTextColor={colors.textSecondary}
                value={day}
                onChangeText={setDay}
                keyboardType="number-pad"
                maxLength={2}
              />
              <Text style={[styles.dateLabel, { color: colors.text }]}>日</Text>
            </View>
          </View>
          
          <TouchableOpacity style={styles.skipButton}>
            <Text style={[styles.skipButtonText, { color: colors.primary }]}>
              スキップ
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button, { 
            backgroundColor: colors.primary,
            opacity: (!year || !month || !day) ? 0.7 : 1 
          }]}
          onPress={handleNext}
          disabled={!year || !month || !day}
        >
          <Text style={styles.buttonText}>次へ</Text>
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
    fontSize: 18,
    marginBottom: 40,
    textAlign: 'center',
  },
  dateContainer: {
    width: '100%',
    marginBottom: 20,
  },
  dateInputGroup: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  dateInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateInput: {
    height: 50,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 15,
    fontSize: 16,
    flex: 1,
  },
  dateLabel: {
    fontSize: 16,
    marginLeft: 5,
  },
  skipButton: {
    alignSelf: 'center',
    marginTop: 15,
  },
  skipButtonText: {
    fontSize: 16,
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

export default BirthDateScreen;
