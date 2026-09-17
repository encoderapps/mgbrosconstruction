import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AuthCard } from '../components/AuthCard';
import { AuthHeader } from '../components/AuthHeader';
import { AuthPrimaryButton } from '../components/AuthPrimaryButton';
import { AuthScreenLayout } from '../components/AuthScreenLayout';
import { LockIcon } from '../assets/icons';
import { fontFamily, welcomeColors } from '../theme';
import { AuthStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<AuthStackParamList, 'IdentityVerificationComplete'>;

export function IdentityVerificationCompleteScreen({ navigation, route }: Props): React.JSX.Element {
  const handleContinue = (): void => {
    navigation.navigate('CompanyDetails', { identity: route.params.identity });
  };

  return (
    <AuthScreenLayout>
      <AuthHeader />

      <AuthCard style={styles.card}>
        <View style={styles.successIconWrapper}>
          <Svg width={32} height={32} viewBox="0 0 24 24" fill="none">
            <Path
              d="M4.8 12.5L9.6 17.3L19.2 6.7"
              stroke={welcomeColors.registerGreen}
              strokeWidth={2.4}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </Svg>
        </View>

        <Text style={styles.title}>Identity Verification Complete</Text>
        <Text style={styles.description}>
          Thank you! Your identity has been verified successfully via Plaid. Your subcontractor profile
          has been updated, and your onboarding step is complete.
        </Text>

        <View style={styles.securedRow}>
          <LockIcon width={14} height={9} color={welcomeColors.textSecondary} />
          <Text style={styles.securedText}>Secured and encrypted connection</Text>
        </View>

        <AuthPrimaryButton title="Continue" onPress={handleContinue} style={styles.continueButton} />
      </AuthCard>
    </AuthScreenLayout>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 20,
    alignItems: 'center',
  },
  successIconWrapper: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(46, 125, 50, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    fontFamily: fontFamily.bold,
    fontWeight: '700',
    fontSize: 16,
    lineHeight: 22,
    color: welcomeColors.textPrimary,
    textAlign: 'center',
    marginBottom: 8,
  },
  description: {
    fontFamily: fontFamily.regular,
    fontWeight: '400',
    fontSize: 11,
    lineHeight: 16,
    color: welcomeColors.textSecondary,
    textAlign: 'center',
    marginBottom: 12,
  },
  securedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 20,
  },
  securedText: {
    fontFamily: fontFamily.regular,
    fontWeight: '400',
    fontSize: 10,
    lineHeight: 14,
    color: welcomeColors.textSecondary,
  },
  continueButton: {
    width: '100%',
  },
});
