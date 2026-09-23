import React, { useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AuthCard } from '../components/AuthCard';
import { AuthCardHeader } from '../components/AuthCardHeader';
import { AuthHeader } from '../components/AuthHeader';
import { AuthPrimaryButton } from '../components/AuthPrimaryButton';
import { AuthScreenLayout } from '../components/AuthScreenLayout';
import { LoginInput } from '../components/LoginInput';
import { RegistrationProgress } from '../components/RegistrationProgress';
import { CheckCircleIcon, EyeIcon, LockIcon, ShieldIcon } from '../assets/icons';
import { fontFamily, radius, welcomeColors } from '../theme';
import { AuthStackParamList } from '../navigation/types';
import { submitSubcontractorRegistration } from '../services/subcontractorRegistrationService';

type Props = NativeStackScreenProps<AuthStackParamList, 'CreatePassword'>;

const TOTAL_STEPS = 6;

const PASSWORD_REQUIREMENTS = [
  'At least 12 characters long',
  'Includes uppercase and lowercase letters',
  'Includes at least one number',
  'Includes at least one special character (e.g., !, @, #)',
];

export function CreatePasswordScreen({ navigation, route }: Props): React.JSX.Element {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleContinue = async (): Promise<void> => {
    if (!password) {
      Alert.alert('Missing password', 'Please enter a password.');
      return;
    }

    const hasMinLength = password.length >= 12;
    const hasUppercase = /[A-Z]/.test(password);
    const hasLowercase = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecialCharacter = /[^A-Za-z0-9]/.test(password);

    if (!hasMinLength || !hasUppercase || !hasLowercase || !hasNumber || !hasSpecialCharacter) {
      Alert.alert(
        'Password does not meet requirements',
        'Please make sure your password meets all the listed requirements.',
      );
      return;
    }

    if (!confirmPassword) {
      Alert.alert('Missing confirmation', 'Please re-enter your password.');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Passwords do not match', 'Please make sure both passwords match.');
      return;
    }

    // Note: password/confirmPassword are sent to the registration API (it
    // requires both) but are never logged or included in the local
    // console-log registration object.
    setIsSubmitting(true);
    try {
      await submitSubcontractorRegistration(route.params, password, confirmPassword);
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

        <View style={styles.requirementsBox}>
          <View style={styles.requirementsHeader}>
            <ShieldIcon size={14} color={welcomeColors.accent} />
            <Text style={styles.requirementsTitle}>Requirements:</Text>
          </View>
          {PASSWORD_REQUIREMENTS.map((requirement) => (
            <View key={requirement} style={styles.requirementRow}>
              <CheckCircleIcon size={14} />
              <Text style={styles.requirementText}>{requirement}</Text>
            </View>
          ))}
        </View>

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
  requirementsBox: {
    backgroundColor: welcomeColors.iconWrapperBackground,
    borderWidth: 1,
    borderColor: welcomeColors.cardBorder,
    borderRadius: radius.md,
    padding: 12,
    marginBottom: 14,
  },
  requirementsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  requirementsTitle: {
    fontFamily: fontFamily.semiBold,
    fontWeight: '600',
    fontSize: 11,
    color: welcomeColors.textPrimary,
  },
  requirementRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  requirementText: {
    flex: 1,
    fontFamily: fontFamily.regular,
    fontWeight: '400',
    fontSize: 10.5,
    color: welcomeColors.textSecondary,
  },
  continueButton: {
    marginTop: 4,
  },
});
