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
import { fontFamily, welcomeColors } from '../theme';
import { AuthStackParamList } from '../navigation/types';
import {
  DEFAULT_OPERATING_TIME_TYPE,
  formatOperatingTimeType,
  OPERATING_TIME_TYPES,
} from '../constants/bidLineItems';
import { useSubcontractorSession } from '../context/SubcontractorSessionContext';
import { useBlockBackWhile } from '../hooks/useBlockBackWhile';
import { addBidLineItem } from '../services/bidService';
import { MAX_CURRENCY_AMOUNT, parseCurrencyInput, sanitizeCurrencyInput } from '../utils/currencyInput';
import { formatCurrency } from '../utils/formatCurrency';

type Props = NativeStackScreenProps<AuthStackParamList, 'AddBidLineItem'>;

const DESCRIPTION_MAX_LENGTH = 255;
/** Room for MAX_CURRENCY_AMOUNT as typed: "99999999.99". */
const AMOUNT_MAX_LENGTH = 11;
/** Whole units, up to 9999. */
const OPERATING_TIME_MAX_LENGTH = 4;

/**
 * "+ Add Line Item" on Bid Details: a description, the approximate operating
 * time (a number and its unit) and an amount, saved to the bid. Back on save.
 */
export function AddBidLineItemScreen({ navigation, route }: Props): React.JSX.Element {
  const { bidId, bidNumber } = route.params;
  const accountId = useSubcontractorSession().company?.accountId;
  const [description, setDescription] = useState('');
  const [operatingTimeText, setOperatingTimeText] = useState('');
  const [operatingTimeType, setOperatingTimeType] = useState(DEFAULT_OPERATING_TIME_TYPE);
  const [amountText, setAmountText] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  // Leaving mid-save would lose the result (and goBack would then pop Bid Details instead).
  useBlockBackWhile(isSaving);

  const handleSave = async (): Promise<void> => {
    if (!description.trim()) {
      Alert.alert('Missing description', 'Please enter a description for this line item.');
      return;
    }
    const operatingTime = Number(operatingTimeText);
    if (!operatingTimeText || operatingTime <= 0) {
      Alert.alert('Missing operating time', 'Please enter the approximate operating time (more than 0).');
      return;
    }
    const amount = parseCurrencyInput(amountText);
    if (amount === null) {
      Alert.alert(
        'Invalid amount',
        `Please enter an amount greater than $0 and no more than ${formatCurrency(MAX_CURRENCY_AMOUNT, true)}.`,
      );
      return;
    }
    if (!accountId) {
      Alert.alert('Unable to save line item', 'Your account could not be found. Please log in again.');
      return;
    }

    setIsSaving(true);
    try {
      await addBidLineItem(accountId, bidId, {
        description: description.trim(),
        amount,
        operatingTime,
        operatingTimeType,
      });
      // Bid Details reloads when it's shown again, so the new item appears there.
      navigation.goBack();
    } catch (error) {
      setIsSaving(false);
      Alert.alert('Unable to save line item', error instanceof Error ? error.message : 'Please try again.');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <HomeHeader />
      <KeyboardAwareScrollView contentContainerStyle={styles.container}>
        <AuthCard style={styles.card}>
          <Text style={styles.bidNumber}>{bidNumber}</Text>
          <ScreenTitleBar title="Add Line Item" onBackPress={() => navigation.goBack()} backDisabled={isSaving} />
          <LoginInput
            label="Description"
            required
            placeholder="Enter description"
            value={description}
            onChangeText={setDescription}
            autoCapitalize="sentences"
            maxLength={DESCRIPTION_MAX_LENGTH}
            editable={!isSaving}
          />
          <LoginInput
            label="Approximate Operating Time"
            required
            placeholder="Enter time, e.g. 5"
            value={operatingTimeText}
            onChangeText={(text) => setOperatingTimeText(text.replace(/\D/g, '').slice(0, OPERATING_TIME_MAX_LENGTH))}
            keyboardType="number-pad"
            editable={!isSaving}
          />
          {/* collapsable={false}: toggling pointerEvents mustn't flatten/unflatten this view (Fabric crash on Android). */}
          <View pointerEvents={isSaving ? 'none' : 'auto'} collapsable={false}>
            <SelectInput
              label="Operating Time Type"
              required
              placeholder="Select type"
              value={operatingTimeType}
              options={OPERATING_TIME_TYPES}
              formatOption={formatOperatingTimeType}
              onSelect={setOperatingTimeType}
              disabled={isSaving}
            />
          </View>
          <LoginInput
            label="Amount (Price)"
            required
            placeholder="Enter amount"
            value={amountText}
            onChangeText={(text) => setAmountText(sanitizeCurrencyInput(text))}
            keyboardType="decimal-pad"
            leftIcon={<Text style={styles.currencySymbol}>$</Text>}
            maxLength={AMOUNT_MAX_LENGTH}
            editable={!isSaving}
          />
          <AuthPrimaryButton
            title={isSaving ? 'Saving…' : 'Save Line Item'}
            onPress={handleSave}
            disabled={isSaving}
            style={styles.saveButton}
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
  card: {
    paddingTop: 12,
  },
  bidNumber: {
    fontFamily: fontFamily.semiBold,
    fontWeight: '600',
    fontSize: 12,
    color: welcomeColors.textSecondary,
    marginBottom: 12,
  },
  currencySymbol: {
    fontFamily: fontFamily.semiBold,
    fontWeight: '600',
    fontSize: 14,
    color: welcomeColors.textPrimary,
  },
  saveButton: {
    marginTop: 10,
  },
});
