import React, { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AuthCard } from '../components/AuthCard';
import { AuthCardHeader } from '../components/AuthCardHeader';
import { AuthHeader } from '../components/AuthHeader';
import { AuthPrimaryButton } from '../components/AuthPrimaryButton';
import { AuthScreenLayout } from '../components/AuthScreenLayout';
import { LoginInput } from '../components/LoginInput';
import { RegisterBenefit } from '../components/RegisterBenefit';
import { SecurityInfo } from '../components/SecurityInfo';
import { EyeIcon, LockIcon, LoginIcon, MailIcon, UserIcon } from '../assets/icons';
import { fontFamily, radius, welcomeColors } from '../theme';
import { AuthStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<AuthStackParamList, 'SubcontractorLogin'>;

const REGISTER_BENEFITS = [
  'Manage bids and projects',
  'Submit and track documents',
  'View invoices and payments',
  'Stay updated on opportunities',
];

export function SubcontractorLoginScreen({ navigation }: Props): React.JSX.Element {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = (): void => {
    if (!email.trim()) {
      Alert.alert('Missing email', 'Please enter your email address.');
      return;
    }
    if (!password) {
      Alert.alert('Missing password', 'Please enter your password.');
      return;
    }
    // TODO: call the Subcontractor authentication API (Node.js / Express backend)
  };

  const handleRegister = (): void => {
    navigation.navigate('RegisterSubcontractor');
  };

  const handleForgotPassword = (): void => {
    navigation.navigate('ForgotPassword');
  };

  return (
    <AuthScreenLayout withKeyboardAvoiding>
      <AuthHeader />

      <AuthCard>
        <AuthCardHeader
          icon={<LoginIcon size={18} color={welcomeColors.accent} />}
          title="Login"
          subtitle="Enter your credentials to access your account."
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

        <LoginInput
          label="Password"
          placeholder="Enter your password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry={!showPassword}
          leftIcon={<LockIcon width={22} height={14} color={welcomeColors.inputPlaceholder} />}
          rightIcon={
            <EyeIcon width={20} height={14} color={welcomeColors.inputPlaceholder} visible={showPassword} />
          }
          onRightIconPress={() => setShowPassword((prev) => !prev)}
        />

        <Pressable onPress={handleForgotPassword} style={styles.forgotPasswordWrapper} hitSlop={8}>
          <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
        </Pressable>

        <AuthPrimaryButton title="Login" onPress={handleLogin} />
      </AuthCard>

      <View style={styles.dividerRow}>
        <View style={styles.dividerLine} />
        <Text style={styles.dividerLabel}>OR</Text>
        <View style={styles.dividerLine} />
      </View>

      <AuthCard>
        <AuthCardHeader
          icon={<UserIcon size={18} color={welcomeColors.accent} />}
          title="Register"
          subtitle="Create a new subcontractor account."
        />

        <View style={styles.benefitsList}>
          {REGISTER_BENEFITS.map((benefit) => (
            <RegisterBenefit key={benefit} text={benefit} />
          ))}
        </View>

        <Pressable
          onPress={handleRegister}
          style={({ pressed }) => [styles.registerButton, pressed && styles.buttonPressed]}
        >
          <Text style={styles.registerButtonText}>Register as Subcontractor</Text>
        </Pressable>
      </AuthCard>

      <SecurityInfo />
    </AuthScreenLayout>
  );
}

const styles = StyleSheet.create({
  forgotPasswordWrapper: {
    alignSelf: 'flex-end',
    marginBottom: 16,
  },
  forgotPasswordText: {
    fontFamily: fontFamily.semiBold,
    fontWeight: '600',
    fontSize: 11,
    lineHeight: 16.5,
    color: welcomeColors.link,
    textAlign: 'center',
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: welcomeColors.divider,
  },
  dividerLabel: {
    fontFamily: fontFamily.regular,
    fontWeight: '400',
    fontSize: 12,
    lineHeight: 18,
    letterSpacing: 1.2,
    color: welcomeColors.textSecondary,
    textAlign: 'center',
    marginHorizontal: 12,
  },
  benefitsList: {
    marginBottom: 16,
  },
  registerButton: {
    backgroundColor: welcomeColors.cardBackground,
    borderWidth: 1,
    borderColor: welcomeColors.registerGreen,
    borderRadius: radius.md,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonPressed: {
    opacity: 0.85,
  },
  registerButtonText: {
    fontFamily: fontFamily.semiBold,
    fontWeight: '600',
    fontSize: 13,
    lineHeight: 19.5,
    color: welcomeColors.registerGreen,
    textAlign: 'center',
  },
});
