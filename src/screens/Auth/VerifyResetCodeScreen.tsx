import React, { useEffect, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AuthCard } from '../../components/AuthCard';
import { AuthCardHeader } from '../../components/AuthCardHeader';
import { AuthHeader } from '../../components/AuthHeader';
import { AuthPrimaryButton } from '../../components/AuthPrimaryButton';
import { AuthScreenLayout } from '../../components/AuthScreenLayout';
import { LoginInput } from '../../components/LoginInput';
import { ShieldIcon } from '../../assets/icons';
import { colors, fontFamily, radius, welcomeColors } from '../../theme';
import { AuthStackParamList } from '../../navigation/types';
import {
  getResetRequestErrorMessage,
  requestPasswordResetCode,
} from '../../services/forgotPasswordService';

type Props = NativeStackScreenProps<AuthStackParamList, 'VerifyResetCode'>;

// Display-only countdown. The backend enforces the real 15-minute expiry, so
// a code can still be rejected as expired before this reaches zero.
const RESET_CODE_TTL_MS = 15 * 60 * 1000;

function formatRemaining(ms: number): string {
  const totalSeconds = Math.max(0, Math.ceil(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

export function VerifyResetCodeScreen({ navigation, route }: Props): React.JSX.Element {
  const { email } = route.params;
  const [resetCode, setResetCode] = useState('');
  const [expiresAt, setExpiresAt] = useState(() => Date.now() + RESET_CODE_TTL_MS);
  const [remainingMs, setRemainingMs] = useState(RESET_CODE_TTL_MS);
  const [isResending, setIsResending] = useState(false);

  // Derive the remaining time from a fixed deadline rather than decrementing
  // a counter, so the timer stays accurate if the app is backgrounded.
  useEffect(() => {
    const tick = (): void => setRemainingMs(Math.max(0, expiresAt - Date.now()));
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [expiresAt]);

  const isExpired = remainingMs <= 0;

  const handleContinue = (): void => {
    if (isExpired) {
      return;
    }
    const trimmedCode = resetCode.trim();
    if (!trimmedCode) {
      Alert.alert('Missing reset code', 'Please enter the reset code sent to your email.');
      return;
    }

    // The backend has no separate verification step: it validates the code
    // as the `token` of the RESET_PASSWORD request on the next screen.
    navigation.navigate('ChangePassword', { email, resetCode: trimmedCode });
  };

  const handleResendCode = async (): Promise<void> => {
    if (isResending) {
      return;
    }
    setIsResending(true);
    try {
      const result = await requestPasswordResetCode(email);
      if (result?.success !== true) {
        Alert.alert('Unable to resend code', 'We could not process your request. Please try again.');
        return;
      }
      setResetCode('');
      setExpiresAt(Date.now() + RESET_CODE_TTL_MS);
      Alert.alert('Code sent', 'New reset code sent to your email.');
    } catch (error) {
      Alert.alert('Unable to resend code', getResetRequestErrorMessage(error));
    } finally {
      setIsResending(false);
    }
  };

  return (
    <AuthScreenLayout withKeyboardAvoiding>
      <AuthHeader />

      <AuthCard>
        <AuthCardHeader
          icon={<ShieldIcon size={16} color={welcomeColors.accent} />}
          title="Verify Reset Code"
          subtitle="Enter the code sent to your email."
        />

        <View style={styles.infoBox}>
          <Text style={styles.infoText}>
            If an account exists for <Text style={styles.infoEmail}>{email}</Text>, a password reset
            code has been sent. Check your email for the reset code.
          </Text>
        </View>

        <LoginInput
          label="Reset Code"
          placeholder="Enter reset code"
          value={resetCode}
          onChangeText={setResetCode}
          autoCapitalize="none"
        />

        <Text style={[styles.timerText, isExpired && styles.expiredText]}>
          {isExpired ? 'Reset code expired.' : `Code expires in ${formatRemaining(remainingMs)}`}
        </Text>

        <AuthPrimaryButton
          title="Continue"
          onPress={handleContinue}
          disabled={isExpired || isResending}
          style={styles.continueButton}
        />

        <Pressable onPress={handleResendCode} disabled={isResending} hitSlop={8}>
          <Text style={[styles.resendText, isResending && styles.resendTextDisabled]}>
            {isResending ? 'Sending...' : 'Resend Code'}
          </Text>
        </Pressable>
      </AuthCard>
    </AuthScreenLayout>
  );
}

const styles = StyleSheet.create({
  infoBox: {
    backgroundColor: '#F8F5F2',
    borderWidth: 1,
    borderColor: welcomeColors.cardBorder,
    borderRadius: radius.md,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 16,
  },
  infoText: {
    fontFamily: fontFamily.regular,
    fontWeight: '400',
    fontSize: 12,
    lineHeight: 18,
    color: welcomeColors.textSecondary,
    textAlign: 'center',
  },
  infoEmail: {
    fontFamily: fontFamily.semiBold,
    fontWeight: '600',
    color: welcomeColors.textPrimary,
  },
  timerText: {
    fontFamily: fontFamily.medium,
    fontWeight: '500',
    fontSize: 11,
    lineHeight: 16,
    color: welcomeColors.textSecondary,
    textAlign: 'center',
    marginBottom: 14,
  },
  expiredText: {
    color: colors.error,
  },
  continueButton: {
    marginBottom: 14,
  },
  resendText: {
    fontFamily: fontFamily.semiBold,
    fontWeight: '600',
    fontSize: 12,
    lineHeight: 18,
    color: welcomeColors.link,
    textAlign: 'center',
  },
  resendTextDisabled: {
    opacity: 0.6,
  },
});
