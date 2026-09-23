import React, { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AuthCard } from '../components/AuthCard';
import { AuthCardHeader } from '../components/AuthCardHeader';
import { AuthHeader } from '../components/AuthHeader';
import { AuthPrimaryButton } from '../components/AuthPrimaryButton';
import { AuthScreenLayout } from '../components/AuthScreenLayout';
import { LoginInput } from '../components/LoginInput';
import { RegistrationProgress } from '../components/RegistrationProgress';
import { SecurityInfo } from '../components/SecurityInfo';
import { UserIcon } from '../assets/icons';
import { fontFamily, welcomeColors } from '../theme';
import { AuthStackParamList } from '../navigation/types';
import { checkExistingEmail } from '../services/checkExistingEmailService';
import { findMissingRequiredField, isValidEmail } from '../utils/formValidation';

type Props = NativeStackScreenProps<AuthStackParamList, 'RegisterSubcontractor'>;

const TOTAL_STEPS = 6;

export function RegisterSubcontractorScreen({ navigation }: Props): React.JSX.Element {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [homeAddress, setHomeAddress] = useState('');
  const [isCheckingEmail, setIsCheckingEmail] = useState(false);

  const handleContinue = async (): Promise<void> => {
    const missingField = findMissingRequiredField([
      { value: firstName, title: 'Missing first name', message: 'Please enter your first name.' },
      { value: lastName, title: 'Missing last name', message: 'Please enter your last name.' },
      { value: phone, title: 'Missing phone number', message: 'Please enter your phone number.' },
      { value: email, title: 'Missing email', message: 'Please enter your email address.' },
      { value: homeAddress, title: 'Missing address', message: 'Please enter your home address.' },
    ]);
    if (missingField) {
      Alert.alert(missingField.title, missingField.message);
      return;
    }
    if (!isValidEmail(email)) {
      Alert.alert('Invalid email', 'Please enter a valid email address.');
      return;
    }

    const identity = {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      phone: phone.trim(),
      email: email.trim(),
      homeAddress: homeAddress.trim(),
    };

    setIsCheckingEmail(true);
    try {
      const result = await checkExistingEmail(identity.email);
      if (!result.success) {
        navigation.navigate('EmailAlreadyInUse');
        return;
      }
      navigation.navigate('CompanyDetails', { identity });
    } catch {
      Alert.alert('Unable to verify email', 'Something went wrong while checking your email. Please try again.');
    } finally {
      setIsCheckingEmail(false);
    }
  };

  const handleWhyVerify = (): void => {
    navigation.navigate('WhyVerifyIdentity');
  };

  return (
    <AuthScreenLayout withKeyboardAvoiding>
      <AuthHeader />

      <RegistrationProgress totalSteps={TOTAL_STEPS} currentStep={1} />

      <AuthCard>
        <AuthCardHeader
          icon={<UserIcon size={18} color={welcomeColors.accent} />}
          title="Identity Verification"
          subtitle="Verify your identity securely via Plaid to continue."
        />

        <LoginInput
          label="First Name"
          placeholder="Enter first name"
          value={firstName}
          onChangeText={setFirstName}
          autoCapitalize="words"
        />

        <LoginInput
          label="Last Name"
          placeholder="Enter last name"
          value={lastName}
          onChangeText={setLastName}
          autoCapitalize="words"
        />

        <LoginInput
          label="Phone Number"
          placeholder="Enter phone number"
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
        />

        <LoginInput
          label="Email"
          placeholder="Enter email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <LoginInput
          label="Home Address"
          placeholder="Enter address"
          value={homeAddress}
          onChangeText={setHomeAddress}
          autoCapitalize="words"
        />

        <AuthPrimaryButton
          title={isCheckingEmail ? 'Checking...' : 'Continue'}
          onPress={handleContinue}
          disabled={isCheckingEmail}
          style={styles.continueButton}
        />

        <Pressable onPress={handleWhyVerify} hitSlop={8} style={styles.whyVerifyWrapper}>
          <Text style={styles.whyVerifyText}>Why do I need to verify my identity?</Text>
        </Pressable>
      </AuthCard>

      <SecurityInfo />
    </AuthScreenLayout>
  );
}

const styles = StyleSheet.create({
  continueButton: {
    marginTop: 4,
  },
  whyVerifyWrapper: {
    marginTop: 12,
  },
  whyVerifyText: {
    fontFamily: fontFamily.semiBold,
    fontWeight: '600',
    fontSize: 13,
    lineHeight: 13,
    letterSpacing: 0,
    color: welcomeColors.registerGreen,
    textAlign: 'center',
    textDecorationLine: 'underline',
    textDecorationStyle: 'solid',
    textDecorationColor: welcomeColors.registerGreen,
  },
});
