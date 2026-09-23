import React, { useState } from 'react';
import {
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
  StyleSheet,
  Text,
} from 'react-native';
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
import { MASTER_SUBCONTRACT_AGREEMENT } from '../constants/legalContent';

type Props = NativeStackScreenProps<AuthStackParamList, 'MasterSubcontractorAgreement'>;

const TOTAL_STEPS = 6;
const SCROLL_END_TOLERANCE = 20;

const [agreementTitle, ...agreementBodyParts] = MASTER_SUBCONTRACT_AGREEMENT.split('\n\n');
const agreementBody = agreementBodyParts.join('\n\n');

export function MasterSubcontractorAgreementScreen({ navigation, route }: Props): React.JSX.Element {
  const [hasReadAgreement, setHasReadAgreement] = useState(false);

  const handleAgreementScroll = (event: NativeSyntheticEvent<NativeScrollEvent>): void => {
    if (hasReadAgreement) {
      return;
    }
    const { contentOffset, layoutMeasurement, contentSize } = event.nativeEvent;
    const isAtBottom =
      contentOffset.y + layoutMeasurement.height >= contentSize.height - SCROLL_END_TOLERANCE;
    if (isAtBottom) {
      setHasReadAgreement(true);
    }
  };

  const handleContinue = (): void => {
    if (!hasReadAgreement) {
      return;
    }
    navigation.navigate('AcceptPolicyTerms', route.params);
  };

  return (
    <AuthScreenLayout withKeyboardAvoiding>
      <AuthHeader />

      <RegistrationProgress totalSteps={TOTAL_STEPS} currentStep={6} />

      <AuthCard>
        <AuthCardHeader
          icon={<DocumentIcon size={18} color={welcomeColors.accent} />}
          title="Master Subcontractor Agreement"
          subtitle="Sign Master Subcontract Agreement"
        />

        <ScrollView
          style={styles.agreementBox}
          contentContainerStyle={styles.agreementContent}
          onScroll={handleAgreementScroll}
          scrollEventThrottle={16}
          nestedScrollEnabled
        >
          <Text style={styles.agreementTitle}>{agreementTitle}</Text>
          <Text style={styles.agreementBody}>{agreementBody}</Text>
        </ScrollView>

        <AuthPrimaryButton
          title="Continue"
          onPress={handleContinue}
          disabled={!hasReadAgreement}
          style={styles.continueButton}
        />
      </AuthCard>
    </AuthScreenLayout>
  );
}

const styles = StyleSheet.create({
  agreementBox: {
    height: 360,
    borderWidth: 1,
    borderColor: welcomeColors.inputBorder,
    borderRadius: radius.md,
    backgroundColor: welcomeColors.inputBackground,
    marginBottom: 14,
  },
  agreementContent: {
    padding: 14,
  },
  agreementTitle: {
    fontFamily: fontFamily.bold,
    fontWeight: '700',
    fontSize: 12,
    color: welcomeColors.textPrimary,
    textAlign: 'center',
    textDecorationLine: 'underline',
    marginBottom: 12,
  },
  agreementBody: {
    fontFamily: fontFamily.regular,
    fontWeight: '400',
    fontSize: 11,
    lineHeight: 17,
    color: welcomeColors.textPrimary,
    textAlign: 'justify',
  },
  continueButton: {
    marginTop: 4,
  },
});
