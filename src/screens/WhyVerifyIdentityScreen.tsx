import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AuthCard } from '../components/AuthCard';
import { AuthHeader } from '../components/AuthHeader';
import { AuthScreenLayout } from '../components/AuthScreenLayout';
import { RegisterBenefit } from '../components/RegisterBenefit';
import { SecurityInfo } from '../components/SecurityInfo';
import { fontFamily, welcomeColors } from '../theme';
import { AuthStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<AuthStackParamList, 'WhyVerifyIdentity'>;

const REASONS = [
  'MG Bros Construction uses identity verification to protect you and ensure secure access to the Subcontractor Portal.',
  'Verification helps us confirm that only authorized subcontractors can access project details, submit invoices, and manage their accounts.',
  'Your identity is verified securely through Plaid — your personal information is encrypted and never stored by MG Bros.',
  'This one-time process helps prevent fraud and unauthorized access to sensitive construction project data.',
];

export function WhyVerifyIdentityScreen(_props: Props): React.JSX.Element {
  return (
    <AuthScreenLayout>
      <AuthHeader />

      <AuthCard>
        <Text style={styles.title}>Why Do I Need to Verify My Identity?</Text>

        <View style={styles.benefitsList}>
          {REASONS.map((reason) => (
            <RegisterBenefit key={reason} text={reason} />
          ))}
        </View>
      </AuthCard>

      <View style={styles.spacer} />

      <SecurityInfo />
    </AuthScreenLayout>
  );
}

const styles = StyleSheet.create({
  title: {
    fontFamily: fontFamily.bold,
    fontWeight: '700',
    fontSize: 16,
    lineHeight: 22,
    color: welcomeColors.registerGreen,
    textAlign: 'center',
    marginBottom: 16,
  },
  benefitsList: {
    gap: 4,
  },
  spacer: {
    flex: 1,
  },
});
