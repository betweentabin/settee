import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Share, Alert } from 'react-native';
import { useTheme } from './ThemeContext';

const InviteFriendsScreen = ({ navigation }) => {
  const { colors } = useTheme();
  const [inviteCode, setInviteCode] = useState('SETTEE123456');
  const [copied, setCopied] = useState(false);

  const handleCopyCode = () => {
    // 実際のアプリではクリップボードにコピーする処理を実装
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShareInvite = async () => {
    try {
      const result = await Share.share({
        message: `Setteeで学生同士の出会いを見つけよう！このコードを使って登録すると、お互いにポイントがもらえます: ${inviteCode}\nhttps://settee.app/invite/${inviteCode}`,
      });
      
      if (result.action === Share.sharedAction) {
        if (result.activityType) {
          // shared with activity type of result.activityType
        } else {
          // shared
        }
      } else if (result.action === Share.dismissedAction) {
        // dismissed
      }
    } catch (error) {
      Alert.alert('エラー', error.message);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>
            友達を招待
          </Text>
        </View>
        
        <View style={[styles.inviteCard, { backgroundColor: colors.card }]}>
          <Text style={[styles.inviteTitle, { color: colors.text }]}>
            友達を招待してポイントをゲット！
          </Text>
          
          <Text style={[styles.inviteDescription, { color: colors.textSecondary }]}>
            あなたの招待コードを使って友達が登録すると、あなたと友達の両方に50ポイントをプレゼント！
          </Text>
          
          <View style={styles.codeContainer}>
            <Text style={[styles.codeLabel, { color: colors.textSecondary }]}>
              あなたの招待コード
            </Text>
            
            <View style={[styles.codeInputContainer, { borderColor: colors.border }]}>
              <TextInput
                style={[styles.codeInput, { color: colors.text }]}
                value={inviteCode}
                editable={false}
              />
              
              <TouchableOpacity
                style={[styles.copyButton, { backgroundColor: colors.primary }]}
                onPress={handleCopyCode}
              >
                <Text style={styles.copyButtonText}>
                  {copied ? 'コピー済み' : 'コピー'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
          
          <TouchableOpacity
            style={[styles.shareButton, { backgroundColor: colors.primary }]}
            onPress={handleShareInvite}
          >
            <Text style={styles.shareButtonText}>
              友達に招待を送る
            </Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.stepsContainer}>
          <Text style={[styles.stepsTitle, { color: colors.text }]}>
            招待の流れ
          </Text>
          
          <View style={styles.stepItem}>
            <View style={[styles.stepNumber, { backgroundColor: colors.primary }]}>
              <Text style={styles.stepNumberText}>1</Text>
            </View>
            <View style={styles.stepContent}>
              <Text style={[styles.stepTitle, { color: colors.text }]}>
                招待コードをシェア
              </Text>
              <Text style={[styles.stepDescription, { color: colors.textSecondary }]}>
                友達に招待コードをシェアしましょう
              </Text>
            </View>
          </View>
          
          <View style={styles.stepItem}>
            <View style={[styles.stepNumber, { backgroundColor: colors.primary }]}>
              <Text style={styles.stepNumberText}>2</Text>
            </View>
            <View style={styles.stepContent}>
              <Text style={[styles.stepTitle, { color: colors.text }]}>
                友達が登録
              </Text>
              <Text style={[styles.stepDescription, { color: colors.textSecondary }]}>
                友達が招待コードを使って登録します
              </Text>
            </View>
          </View>
          
          <View style={styles.stepItem}>
            <View style={[styles.stepNumber, { backgroundColor: colors.primary }]}>
              <Text style={styles.stepNumberText}>3</Text>
            </View>
            <View style={styles.stepContent}>
              <Text style={[styles.stepTitle, { color: colors.text }]}>
                ポイントゲット
              </Text>
              <Text style={[styles.stepDescription, { color: colors.textSecondary }]}>
                あなたと友達の両方に50ポイントをプレゼント
              </Text>
            </View>
          </View>
        </View>
        
        <View style={[styles.bonusCard, { backgroundColor: colors.card }]}>
          <Text style={[styles.bonusTitle, { color: colors.text }]}>
            招待特典
          </Text>
          
          <View style={styles.bonusItem}>
            <Text style={[styles.bonusAmount, { color: colors.primary }]}>
              50ポイント
            </Text>
            <Text style={[styles.bonusDescription, { color: colors.textSecondary }]}>
              友達1人の登録につき
            </Text>
          </View>
          
          <View style={styles.bonusItem}>
            <Text style={[styles.bonusAmount, { color: colors.primary }]}>
              100ポイント
            </Text>
            <Text style={[styles.bonusDescription, { color: colors.textSecondary }]}>
              友達が学生証認証を完了すると追加
            </Text>
          </View>
          
          <View style={styles.bonusItem}>
            <Text style={[styles.bonusAmount, { color: colors.primary }]}>
              無制限
            </Text>
            <Text style={[styles.bonusDescription, { color: colors.textSecondary }]}>
              招待できる友達の数に制限はありません
            </Text>
          </View>
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
    padding: 20,
  },
  header: {
    marginTop: 50,
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  inviteCard: {
    borderRadius: 15,
    padding: 20,
    marginBottom: 30,
  },
  inviteTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  inviteDescription: {
    fontSize: 16,
    marginBottom: 20,
    lineHeight: 22,
  },
  codeContainer: {
    marginBottom: 20,
  },
  codeLabel: {
    fontSize: 14,
    marginBottom: 8,
  },
  codeInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 10,
    overflow: 'hidden',
  },
  codeInput: {
    flex: 1,
    height: 50,
    paddingHorizontal: 15,
    fontSize: 16,
    fontWeight: 'bold',
  },
  copyButton: {
    height: 50,
    paddingHorizontal: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  copyButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  shareButton: {
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  shareButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  stepsContainer: {
    marginBottom: 30,
  },
  stepsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  stepItem: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  stepNumber: {
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  stepNumberText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 5,
  },
  stepDescription: {
    fontSize: 14,
  },
  bonusCard: {
    borderRadius: 15,
    padding: 20,
    marginBottom: 30,
  },
  bonusTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  bonusItem: {
    marginBottom: 15,
  },
  bonusAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  bonusDescription: {
    fontSize: 14,
  },
});

export default InviteFriendsScreen;
