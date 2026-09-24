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
import { PasswordResetNotAvailableError, resetPassword } from '../../services/forgotPasswordService';

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
      await resetPassword(email, resetCode, password);
      navigation.reset({
        index: 0,
        routes: [{ name: 'SubcontractorLogin' }, { name: 'PasswordResetSuccess' }],
      });
    } catch (error) {
      if (error instanceof PasswordResetNotAvailableError) {
        Alert.alert(
          'Password reset unavailable',
          'Password reset is not available yet. Please try again later.',
        );
        return;
      }
      // TODO: Once the reset API contract is known, map its invalid, expired
      // and already-used code responses here (and send the user back to
      // VerifyResetCode for those).
      Alert.alert('Unable to reset password', 'Unable to reset your password. Please try again.');
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
