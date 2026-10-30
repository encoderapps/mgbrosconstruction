import React, { useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AuthCard } from '../components/AuthCard';
import { AuthPrimaryButton } from '../components/AuthPrimaryButton';
import { HomeHeader } from '../components/HomeHeader';
import { KeyboardAwareScrollView } from '../components/KeyboardAwareScrollView';
import { LoginInput } from '../components/LoginInput';
import { ScreenTitleBar } from '../components/ScreenTitleBar';
import { SelectInput } from '../components/SelectInput';
import { AlertCircleIcon, CardIcon, LockIcon } from '../assets/icons';
import { fontFamily, radius, toneColors, welcomeColors } from '../theme';
import { AuthStackParamList } from '../navigation/types';
import { ACH_ACCOUNT_TYPES } from '../constants/paymentSettings';
import { useSubcontractorSession } from '../context/SubcontractorSessionContext';
import { useBlockBackWhile } from '../hooks/useBlockBackWhile';
import { saveAchInfo } from '../services/paymentSettingsService';
import { AchAccountType } from '../types/paymentSettings';
import {
  ACCOUNT_NUMBER_MAX_LENGTH,
  ACCOUNT_NUMBER_MIN_LENGTH,
  digitsOnly,
  isValidAccountNumber,
  isValidRoutingNumber,
  ROUTING_NUMBER_LENGTH,
} from '../utils/bankAccount';

type Props = NativeStackScreenProps<AuthStackParamList, 'AchInformation'>;

const BANK_NAME_MAX_LENGTH = 80;

/** Payment Settings → the + by ACH Info: the company's bank details, saved and turned into an ACH form. */
export function AchInformationScreen({ navigation, route }: Props): React.JSX.Element {
  const existing = route.params?.existing;
  const company = useSubcontractorSession().company;
  const [bankName, setBankName] = useState(existing?.bankName ?? '');
  const [accountType, setAccountType] = useState<AchAccountType>(existing?.accountType ?? 'Checking');
  const [accountNumber, setAccountNumber] = useState(existing?.accountNumber ?? '');
  const [routingNumber, setRoutingNumber] = useState(existing?.routingNumber ?? '');
  const [confirmAccountNumber, setConfirmAccountNumber] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  // Leaving mid-save would lose the result.
  useBlockBackWhile(isSaving);

  /** The first problem with the form, as an alert's title and message; null when it's ready to save. */
  const findProblem = (): [string, string] | null => {
    if (!bankName.trim()) {
      return ['Missing bank name', 'Please enter the name of your bank.'];
    }
    if (!isValidAccountNumber(accountNumber)) {
      return [
        'Invalid account number',
        `Please enter your account number: ${ACCOUNT_NUMBER_MIN_LENGTH}–${ACCOUNT_NUMBER_MAX_LENGTH} digits.`,
      ];
    }
    // if (!isValidRoutingNumber(routingNumber)) {
    //   return [
    //     'Invalid routing number',
    //     'Please check your routing number: it is the 9-digit number at the bottom left of your checks.',
    //   ];
    // }
    if (confirmAccountNumber !== accountNumber) {
      return ['Account numbers don’t match', 'Please re-enter your account number to confirm it.'];
    }
    return null;
  };

  const handleSave = async (): Promise<void> => {
    const problem = findProblem();
    if (problem) {
      Alert.alert(...problem);
      return;
    }
    if (!company) {
      Alert.alert('Unable to save', 'Your account could not be found. Please log in again.');
      return;
    }

    setIsSaving(true);
    try {
      const ach = await saveAchInfo(company.accountId, company.name, {
        bankName,
        accountType,
        accountNumber,
        routingNumber,
      });
      // Replace this form, so Back from the confirmation returns to Payment Settings.
      navigation.replace('AchFormGenerated', { ach });
    } catch (error) {
      setIsSaving(false);
      Alert.alert('Unable to save', error instanceof Error ? error.message : 'Please try again.');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <HomeHeader />
      <KeyboardAwareScrollView contentContainerStyle={styles.container}>
        <ScreenTitleBar title="ACH Information" onBackPress={() => navigation.goBack()} backDisabled={isSaving} />

        <AuthCard>
          <View style={styles.notice}>
            <AlertCircleIcon size={15} color={toneColors.success.foreground} />
            <Text style={styles.noticeText}>
              Please enter your bank details below. This information will be used to generate your ACH form.
            </Text>
          </View>

          <View style={styles.sectionHeader}>
            <CardIcon size={16} color={welcomeColors.accent} />
            <Text style={styles.sectionTitle}>Bank Information</Text>
          </View>

          <LoginInput
            label="Bank Name"
            required
            placeholder="Enter bank name"
            value={bankName}
            onChangeText={setBankName}
            autoCapitalize="words"
            maxLength={BANK_NAME_MAX_LENGTH}
            editable={!isSaving}
          />
          {/* collapsable={false}: toggling pointerEvents mustn't flatten/unflatten this view (Fabric crash on Android). */}
          <View pointerEvents={isSaving ? 'none' : 'auto'} collapsable={false}>
            <SelectInput
              label="Account Type"
              required
              placeholder="Select account type"
              value={accountType}
              options={[...ACH_ACCOUNT_TYPES]}
              onSelect={(value) => setAccountType(value as AchAccountType)}
            />
          </View>
          <LoginInput
            label="Account Number"
            required
            placeholder="Enter account number"
            value={accountNumber}
            onChangeText={(text) => setAccountNumber(digitsOnly(text, ACCOUNT_NUMBER_MAX_LENGTH))}
            keyboardType="number-pad"
            editable={!isSaving}
          />
          <LoginInput
            label="Routing Number"
            required
            placeholder="Enter 9-digit routing number"
            value={routingNumber}
            onChangeText={(text) => setRoutingNumber(digitsOnly(text, ROUTING_NUMBER_LENGTH))}
            keyboardType="number-pad"
            editable={!isSaving}
          />
          <LoginInput
            label="Confirm Account Number"
            required
            placeholder="Re-enter account number"
            value={confirmAccountNumber}
            onChangeText={(text) => setConfirmAccountNumber(digitsOnly(text, ACCOUNT_NUMBER_MAX_LENGTH))}
            keyboardType="number-pad"
            editable={!isSaving}
          />

          <View style={styles.secureNote}>
            <LockIcon width={18} height={12} color={welcomeColors.textSecondary} />
            <Text style={styles.secureText}>
              Your information is secure and will only be used for payment processing.
            </Text>
          </View>

          <AuthPrimaryButton
            title={isSaving ? 'Saving…' : 'Save & Generate ACH Form'}
            onPress={handleSave}
            disabled={isSaving}
          />
        </AuthCard>
      </KeyboardAwareScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: welcomeColors.background,
  },
  // Same page padding as the Home screen.
  container: {
    flexGrow: 1,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 24,
    gap: 12,
  },
  notice: {
    flexDirection: 'row',
    gap: 8,
    backgroundColor: toneColors.success.background,
    borderWidth: 1,
    borderColor: toneColors.success.border,
    borderRadius: radius.sm,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 14,
  },
  noticeText: {
    flex: 1,
    fontFamily: fontFamily.regular,
    fontWeight: '400',
    fontSize: 12,
    lineHeight: 17,
    color: welcomeColors.textSecondary,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  sectionTitle: {
    fontFamily: fontFamily.semiBold,
    fontWeight: '600',
    fontSize: 14,
    color: welcomeColors.textPrimary,
  },
  secureNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
    marginBottom: 16,
  },
  secureText: {
    flex: 1,
    fontFamily: fontFamily.regular,
    fontWeight: '400',
    fontSize: 11,
    lineHeight: 16,
    color: welcomeColors.textSecondary,
  },
});
