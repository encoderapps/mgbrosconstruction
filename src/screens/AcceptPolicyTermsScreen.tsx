import React from 'react';
import { ScrollView, StyleSheet, Text } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AuthCard } from '../components/AuthCard';
import { AuthCardHeader } from '../components/AuthCardHeader';
import { AuthHeader } from '../components/AuthHeader';
import { AuthPrimaryButton } from '../components/AuthPrimaryButton';
import { AuthScreenLayout } from '../components/AuthScreenLayout';
import { RegistrationProgress } from '../components/RegistrationProgress';
import { DocumentIcon } from '../assets/icons';
import { fontFamily, radius, welcomeColors } from '../theme';
import { AuthStackParamList } from '../navigation/types';
import { ACCEPT_POLICY_TERMS_SECTIONS } from '../constants/legalContent';
import { buildRegistrationData, findMissingRegistrationFields } from '../utils/registrationData';

type Props = NativeStackScreenProps<AuthStackParamList, 'AcceptPolicyTerms'>;

const TOTAL_STEPS = 6;

export function AcceptPolicyTermsScreen({ navigation, route }: Props): React.JSX.Element {
  const handleAccept = (): void => {
    const registrationData = buildRegistrationData(route.params);
    const missingFields = findMissingRegistrationFields(registrationData);
    if (missingFields.length > 0) {
      console.warn('Registration data is incomplete:', missingFields);
    }

    console.log('========== COMPLETE REGISTRATION DATA ==========');
    console.log(JSON.stringify(registrationData, null, 2));
    console.log('================================================');

    navigation.navigate('CreatePassword', route.params);
  };

  return (
    <AuthScreenLayout withKeyboardAvoiding>
      <AuthHeader />

      <RegistrationProgress totalSteps={TOTAL_STEPS} currentStep={6} />

      <AuthCard>
        <AuthCardHeader
          icon={<DocumentIcon size={18} color={welcomeColors.accent} />}
          title="Accept Policy Terms"
          subtitle="Please read and accept the terms below."
        />

        <ScrollView
          style={styles.termsBox}
          contentContainerStyle={styles.termsContent}
          nestedScrollEnabled
        >
          {ACCEPT_POLICY_TERMS_SECTIONS.map((section) => (
            <React.Fragment key={section.title}>
              <Text style={styles.sectionTitle}>{section.title}</Text>
              <Text style={styles.sectionBody}>{section.body}</Text>
            </React.Fragment>
          ))}
        </ScrollView>

        <AuthPrimaryButton title="Accept" onPress={handleAccept} style={styles.acceptButton} />
      </AuthCard>
    </AuthScreenLayout>
  );
}

const styles = StyleSheet.create({
  termsBox: {
    height: 360,
    borderWidth: 1,
    borderColor: welcomeColors.inputBorder,
    borderRadius: radius.md,
    backgroundColor: welcomeColors.inputBackground,
    marginBottom: 14,
  },
  termsContent: {
    padding: 14,
  },
  sectionTitle: {
    fontFamily: fontFamily.semiBold,
    fontWeight: '600',
    fontSize: 12,
    color: welcomeColors.textPrimary,
    marginBottom: 4,
  },
  sectionBody: {
    fontFamily: fontFamily.regular,
    fontWeight: '400',
    fontSize: 11,
    lineHeight: 16,
    color: welcomeColors.textSecondary,
    marginBottom: 12,
  },
  acceptButton: {
    marginTop: 4,
  },
});
