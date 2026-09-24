import React, { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AuthCard } from '../../components/AuthCard';
import { AuthCardHeader } from '../../components/AuthCardHeader';
import { AuthHeader } from '../../components/AuthHeader';
import { AuthPrimaryButton } from '../../components/AuthPrimaryButton';
import { AuthScreenLayout } from '../../components/AuthScreenLayout';
import { LoginInput } from '../../components/LoginInput';
import { LockIcon, MailIcon } from '../../assets/icons';
import { fontFamily, radius, welcomeColors } from '../../theme';
import { AuthStackParamList } from '../../navigation/types';
import { isValidEmail } from '../../utils/formValidation';
import {
  getResetRequestErrorMessage,
  requestPasswordResetCode,
} from '../../services/forgotPasswordService';

type Props = NativeStackScreenProps<AuthStackParamList, 'ForgotPassword'>;

export function ForgotPasswordScreen({ navigation }: Props): React.JSX.Element {
  const [email, setEmail] = useState('');
  const [isSending, setIsSending] = useState(false);

  const handleResetPassword = async (): Promise<void> => {
    if (isSending) {
      return;
    }
    if (!email.trim()) {
      Alert.alert('Missing email', 'Please enter your email address.');
      return;
    }
    if (!isValidEmail(email)) {
      Alert.alert('Invalid email', 'Please enter a valid email address.');
      return;
    }

    const trimmedEmail = email.trim();
    setIsSending(true);
    try {
      const result = await requestPasswordResetCode(trimmedEmail);
      if (result?.success !== true) {
        Alert.alert('Unable to send reset code', 'We could not process your request. Please try again.');
        return;
      }
      navigation.navigate('VerifyResetCode', { email: trimmedEmail });
    } catch (error) {
      Alert.alert('Unable to send reset code', getResetRequestErrorMessage(error));
    } finally {
      setIsSending(false);
    }
  };

  const handleCancel = (): void => {
    navigation.goBack();
  };

  const handleRegister = (): void => {
    navigation.navigate('RegisterSubcontractor');
  };

  return (
    <AuthScreenLayout withKeyboardAvoiding>
      <AuthHeader />

      <AuthCard>
        <AuthCardHeader
          icon={<LockIcon width={20} height={13} color={welcomeColors.accent} />}
          title="Reset Your Password"
          subtitle="Enter your email to receive reset instructions."
        />

        <LoginInput
          label="Email"
          placeholder="Enter your email"
          value={email}
          onChangeText={setEmail}
          leftIcon={<MailIcon size={16} color={welcomeColors.inputPlaceholder} />}
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <AuthPrimaryButton
          title={isSending ? 'Sending...' : 'Continue'}
          onPress={handleResetPassword}
          disabled={isSending}
          style={styles.continueButton}
        />

        <Pressable
          onPress={handleCancel}
          style={({ pressed }) => [styles.cancelButton, pressed && styles.buttonPressed]}
        >
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </Pressable>
      </AuthCard>

      <Pressable onPress={handleRegister} hitSlop={8}>
        <Text style={styles.registerLink}>Register as Subcontractor</Text>
      </Pressable>
    </AuthScreenLayout>
  );
}

const styles = StyleSheet.create({
  continueButton: {
    marginBottom: 12,
  },
  buttonPressed: {
    opacity: 0.85,
  },
  cancelButton: {
    backgroundColor: welcomeColors.cardBackground,
    borderWidth: 1,
    borderColor: welcomeColors.inputBorder,
    borderRadius: radius.md,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    fontFamily: fontFamily.semiBold,
    fontWeight: '600',
    fontSize: 15,
    lineHeight: 22.5,
    color: welcomeColors.textPrimary,
    textAlign: 'center',
  },
  registerLink: {
    fontFamily: fontFamily.semiBold,
    fontWeight: '600',
    fontSize: 12,
    lineHeight: 18,
    color: welcomeColors.link,
    textAlign: 'center',
  },
});
