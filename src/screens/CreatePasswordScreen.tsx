import React, { useState } from 'react';
import { Alert, StyleSheet } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AuthCard } from '../components/AuthCard';
import { AuthCardHeader } from '../components/AuthCardHeader';
import { AuthHeader } from '../components/AuthHeader';
import { AuthPrimaryButton } from '../components/AuthPrimaryButton';
import { AuthScreenLayout } from '../components/AuthScreenLayout';
import { LoginInput } from '../components/LoginInput';
import { RegistrationProgress } from '../components/RegistrationProgress';
import { PasswordRequirements } from '../components/PasswordRequirements';
import { EyeIcon, LockIcon } from '../assets/icons';
import { welcomeColors } from '../theme';
import { AuthStackParamList } from '../navigation/types';
import { saveRegistrationSignature } from '../services/registrationSignatureStore';
import { toUserSignature } from '../utils/signature';
import { submitSubcontractorRegistration } from '../services/subcontractorRegistrationService';
import { validateNewPassword } from '../utils/passwordValidation';

type Props = NativeStackScreenProps<AuthStackParamList, 'CreatePassword'>;

const TOTAL_STEPS = 6;

export function CreatePasswordScreen({ navigation, route }: Props): React.JSX.Element {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleContinue = async (): Promise<void> => {
    const validationError = validateNewPassword(password, confirmPassword);
    if (validationError) {
      Alert.alert(validationError.title, validationError.message);
      return;
    }

    // Note: password/confirmPassword are sent to the registration API (it
    // requires both) but are never logged or included in the local
    // console-log registration object.
    setIsSubmitting(true);
    try {
      await submitSubcontractorRegistration(route.params, password, confirmPassword);
      // Kept on this device so the signature can be reused to sign after logging in. Not
      // being able to keep it only means signing starts empty, so it never fails registration.
      await saveRegistrationSignature(route.params.identity.email, toUserSignature(route.params.signature)).catch((error) =>
        console.error('Failed to save the registration signature:', error),
      );
      navigation.reset({
        index: 0,
        routes: [{ name: 'RegistrationComplete' }],
      });
    } catch {
      Alert.alert(
        'Unable to complete registration',
        'Something went wrong while submitting your registration. Please try again.',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthScreenLayout withKeyboardAvoiding>
      <AuthHeader />

      <RegistrationProgress totalSteps={TOTAL_STEPS} currentStep={6} />

      <AuthCard>
        <AuthCardHeader
          icon={<LockIcon width={20} height={13} color={welcomeColors.accent} />}
          title="Create Password"
          subtitle="Set a secure password for your account."
        />

        <LoginInput
          label="Enter Password"
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
          label="Re-Enter Password"
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
          title={isSubmitting ? 'Submitting...' : 'Continue'}
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
