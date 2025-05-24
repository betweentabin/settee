import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';

const RegisterScreen = ({ navigation }) => {
  const { colors } = useTheme();
  const [currentStep, setCurrentStep] = useState(0);

  const tutorialSteps = [
    {
      title: 'Setteeとは？',
      description: '学生限定アプリ',
      subtext: 'これからの人生は面白い',
    },
    {
      title: '学生同士で繋がれる！出会える！',
      description: '最短30分！学生同士で出会える',
    },
    {
      title: 'Setteeポイント機能',
      description: 'Setteeポイントを貯めて機能解放やアイテムと交換しよう！',
    },
    {
      title: 'キャンパスチャット自動参加！',
      description: 'オープンチャットで自分のキャンパス情報が知れる！探せる！',
    }
  ];

  const handleNext = () => {
    if (currentStep < tutorialSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      navigation.navigate('NameInput');
    }
  };

  const handleSkip = () => {
    navigation.navigate('NameInput');
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.stepIndicatorContainer}>
          {tutorialSteps.map((_, index) => (
            <View
              key={index}
              style={[
                styles.stepDot,
                {
                  backgroundColor: index === currentStep ? colors.primary : colors.border,
                }
              ]}
            />
          ))}
        </View>

        <View style={styles.contentContainer}>
          <Image
            source={require('../../assets/tutorial_placeholder.png')}
            style={styles.image}
            resizeMode="contain"
          />

          <Text style={[styles.title, { color: colors.text }]}>
            {tutorialSteps[currentStep].title}
          </Text>
          
          <Text style={[styles.description, { color: colors.textSecondary }]}>
            {tutorialSteps[currentStep].description}
          </Text>
          
          {tutorialSteps[currentStep].subtext && (
            <Text style={[styles.subtext, { color: colors.textSecondary }]}>
              {tutorialSteps[currentStep].subtext}
            </Text>
          )}
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.skipButton]}
            onPress={handleSkip}
          >
            <Text style={[styles.skipButtonText, { color: colors.textSecondary }]}>
              スキップ
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.nextButton, { backgroundColor: colors.primary }]}
            onPress={handleNext}
          >
            <Text style={styles.nextButtonText}>
              {currentStep === tutorialSteps.length - 1 ? "Let's start!" : "次へ"}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    padding: 20,
    justifyContent: 'space-between',
  },
  stepIndicatorContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 40,
    marginBottom: 20,
  },
  stepDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginHorizontal: 5,
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  image: {
    width: '80%',
    height: 200,
    marginBottom: 30,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 15,
  },
  description: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 10,
    paddingHorizontal: 20,
  },
  subtext: {
    fontSize: 14,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 30,
  },
  skipButton: {
    padding: 10,
  },
  skipButtonText: {
    fontSize: 16,
  },
  nextButton: {
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 25,
  },
  nextButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default RegisterScreen;
