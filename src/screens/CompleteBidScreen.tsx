import React, { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AuthCard } from '../components/AuthCard';
import { HomeHeader } from '../components/HomeHeader';
import { ScreenTitleBar } from '../components/ScreenTitleBar';
import { CheckCircleIcon } from '../assets/icons';
import { fontFamily, radius, toneColors, welcomeColors } from '../theme';
import { AuthStackParamList } from '../navigation/types';
import { useSubcontractorSession } from '../context/SubcontractorSessionContext';
import { useBlockBackWhile } from '../hooks/useBlockBackWhile';
import { completeBid } from '../services/bidService';

type Props = NativeStackScreenProps<AuthStackParamList, 'CompleteBid'>;

/** "Mark Bid as Complete" on Bid Details: confirms, then completes the bid and goes back to it. */
export function CompleteBidScreen({ navigation, route }: Props): React.JSX.Element {
  const { bidId, bidNumber } = route.params;
  const accountId = useSubcontractorSession().company?.accountId;
  const [isCompleting, setIsCompleting] = useState(false);
  // Leaving mid-request would lose the result (and goBack would then pop Bid Details instead).
  useBlockBackWhile(isCompleting);

  const handleComplete = async (): Promise<void> => {
    if (!accountId) {
      Alert.alert('Unable to complete bid', 'Your account could not be found. Please log in again.');
      return;
    }
    setIsCompleting(true);
    try {
      await completeBid(accountId, bidId);
      // Bid Details reloads when it's shown again and shows the bid as completed.
      navigation.goBack();
      Alert.alert('Bid completed', `${bidNumber} has been marked as complete.`);
    } catch (error) {
      setIsCompleting(false);
      Alert.alert('Unable to complete bid', error instanceof Error ? error.message : 'Please try again.');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <HomeHeader />
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <ScreenTitleBar
          title="Mark Bid as Complete"
          onBackPress={() => navigation.goBack()}
          backDisabled={isCompleting}
        />
        <AuthCard style={styles.card}>
          <View style={styles.iconHalo}>
            <CheckCircleIcon size={40} color={toneColors.success.foreground} />
          </View>
          <Text style={styles.title} accessibilityRole="header">
            Mark Bid as Complete?
          </Text>
          <Text style={styles.message}>
            Are you sure you want to mark {bidNumber} as complete? You will not be able to make changes after
            completion.
          </Text>

          <View style={styles.buttons}>
            <Pressable
              onPress={() => navigation.goBack()}
              disabled={isCompleting}
              style={({ pressed }) => [styles.button, styles.cancelButton, pressed && styles.pressed]}
              accessibilityRole="button"
              accessibilityState={{ disabled: isCompleting }}
            >
              <Text style={styles.cancelText}>Cancel</Text>
            </Pressable>
            <Pressable
              onPress={handleComplete}
              disabled={isCompleting}
              style={({ pressed }) => [styles.button, styles.confirmButton, (pressed || isCompleting) && styles.pressed]}
              accessibilityRole="button"
              accessibilityState={{ disabled: isCompleting, busy: isCompleting }}
            >
              {isCompleting ? (
                <ActivityIndicator color={welcomeColors.cardBackground} />
              ) : (
                <Text style={styles.confirmText}>Yes, Complete</Text>
              )}
            </Pressable>
          </View>
        </AuthCard>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: welcomeColors.background,
  },
  // Same page padding as the Home screen.
  container: {
    flexGrow: 1,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 24,
    gap: 12,
  },
  card: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  iconHalo: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: toneColors.success.background,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    fontFamily: fontFamily.bold,
    fontWeight: '700',
    fontSize: 18,
    color: welcomeColors.textPrimary,
    textAlign: 'center',
    marginBottom: 8,
  },
  message: {
    fontFamily: fontFamily.regular,
    fontWeight: '400',
    fontSize: 13,
    lineHeight: 19,
    color: welcomeColors.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
  },
  buttons: {
    flexDirection: 'row',
    gap: 12,
    alignSelf: 'stretch',
  },
  button: {
    flex: 1,
    height: 44,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    borderWidth: 1,
    borderColor: welcomeColors.inputBorder,
    backgroundColor: welcomeColors.cardBackground,
  },
  confirmButton: {
    backgroundColor: welcomeColors.loginButton,
  },
  cancelText: {
    fontFamily: fontFamily.semiBold,
    fontWeight: '600',
    fontSize: 14,
    color: welcomeColors.textPrimary,
  },
  confirmText: {
    fontFamily: fontFamily.semiBold,
    fontWeight: '600',
    fontSize: 14,
    color: welcomeColors.cardBackground,
  },
  pressed: {
    opacity: 0.85,
  },
});
