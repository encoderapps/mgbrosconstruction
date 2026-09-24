import React, { useState } from 'react';
import { Alert, StyleSheet } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AuthCard } from '../../components/AuthCard';
import { AuthCardHeader } from '../../components/AuthCardHeader';
import { AuthHeader } from '../../components/AuthHeader';
import { AuthPrimaryButton } from '../../components/AuthPrimaryButton';
import { AuthScreenLayout } from '../../components/AuthScreenLayout';
import { LoginInput } from '../../components/LoginInput';
import { PasswordRequirements } from '../../components/PasswordRequirements';
import { EyeIcon, LockIcon } from '../../assets/icons';
import { welcomeColors } from '../../theme';
import { AuthStackParamList } from '../../navigation/types';
import { validateNewPassword } from '../../utils/passwordValidation';
import { getResetRequestErrorMessage, resetPassword } from '../../services/forgotPasswordService';

type Props = NativeStackScreenProps<AuthStackParamList, 'ChangePassword'>;

export function ChangePasswordScreen({ navigation, route }: Props): React.JSX.Element {
  const { email, resetCode } = route.params;
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleContinue = async (): Promise<void> => {
    if (isSubmitting) {
      return;
    }
    const validationError = validateNewPassword(password, confirmPassword);
    if (validationError) {
      Alert.alert(validationError.title, validationError.message);
      return;
    }

    // Never log the password or reset code.
    setIsSubmitting(true);
    try {
      const result = await resetPassword(resetCode, password, confirmPassword);
      if (result?.success === true) {
        navigation.reset({
          index: 0,
          routes: [{ name: 'SubcontractorLogin' }, { name: 'PasswordResetSuccess' }],
        });
        return;
      }

      // A rejected code (invalid, expired or already used) can't be fixed on
      // this screen, so offer to go back and request a new one.
      const message = result?.message?.trim();
      if (message && /token|code|expired/i.test(message)) {
        Alert.alert('Unable to reset password', message, [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Resend Code',
            onPress: () => navigation.popTo('VerifyResetCode', { email }),
          },
        ]);
        return;
      }
      Alert.alert(
        'Unable to reset password',
        message || 'Unable to reset your password. Please try again.',
      );
    } catch (error) {
      Alert.alert(
        'Unable to reset password',
        getResetRequestErrorMessage(error, 'Unable to reset your password. Please try again.'),
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthScreenLayout withKeyboardAvoiding>
      <AuthHeader />

      <AuthCard>
        <AuthCardHeader
          icon={<LockIcon width={20} height={13} color={welcomeColors.accent} />}
          title="Change Password"
          subtitle="Set a new password for your account."
        />

        <LoginInput
          label="New Password"
          placeholder="Enter Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry={!showPassword}
          leftIcon={<LockIcon width={22} height={14} color={welcomeColors.inputPlaceholder} />}
          rightIcon={
            <EyeIcon width={20} height={14} color={welcomeColors.inputPlaceholder} visible={showPassword} />
          }
          onRightIconPress={() => setShowPassword((prev) => !prev)}
        />

        <LoginInput
          label="Confirm Password"
          placeholder="Re-Enter Password"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry={!showConfirmPassword}
          leftIcon={<LockIcon width={22} height={14} color={welcomeColors.inputPlaceholder} />}
          rightIcon={
            <EyeIcon
              width={20}
              height={14}
              color={welcomeColors.inputPlaceholder}
              visible={showConfirmPassword}
            />
          }
          onRightIconPress={() => setShowConfirmPassword((prev) => !prev)}
        />

        <PasswordRequirements />

        <AuthPrimaryButton
          title={isSubmitting ? 'Updating Password...' : 'Continue'}
          onPress={handleContinue}
          disabled={isSubmitting}
          style={styles.continueButton}
        />
      </AuthCard>
    </AuthScreenLayout>
  );
}

const styles = StyleSheet.create({
  continueButton: {
    marginTop: 4,
  },
});
