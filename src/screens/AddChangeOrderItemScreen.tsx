import React, { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AuthCard } from '../components/AuthCard';
import { AuthPrimaryButton } from '../components/AuthPrimaryButton';
import { HomeHeader } from '../components/HomeHeader';
import { KeyboardAwareScrollView } from '../components/KeyboardAwareScrollView';
import { LoginInput } from '../components/LoginInput';
import { ChevronRightIcon } from '../assets/icons';
import { fontFamily, welcomeColors } from '../theme';
import { AuthStackParamList } from '../navigation/types';
import { useSubcontractorSession } from '../context/SubcontractorSessionContext';
import { useBlockBackWhile } from '../hooks/useBlockBackWhile';
import { addChangeOrderItem } from '../services/changeOrderService';
import { lineItemAmount } from '../utils/changeOrder';
import { MAX_CURRENCY_AMOUNT, parseCurrencyInput, sanitizeCurrencyInput } from '../utils/currencyInput';
import { formatCurrency } from '../utils/formatCurrency';

type Props = NativeStackScreenProps<AuthStackParamList, 'AddChangeOrderItem'>;

const DESCRIPTION_MAX_LENGTH = 255;
/** Room for MAX_CURRENCY_AMOUNT as typed: "99999999.99". */
const NUMBER_MAX_LENGTH = 11;

/** "+ Add Line Item" on a change order: description, quantity and unit price. Back on save. */
export function AddChangeOrderItemScreen({ navigation, route }: Props): React.JSX.Element {
  const { poId, changeOrder } = route.params;
  const accountId = useSubcontractorSession().company?.accountId;
  const [description, setDescription] = useState('');
  const [quantityText, setQuantityText] = useState('1');
  const [unitPriceText, setUnitPriceText] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  // Leaving mid-save would lose the result (and goBack would then pop the change order instead).
  useBlockBackWhile(isSaving);

  // Quantities follow the same rules as money: positive, at most 2 decimals.
  const quantity = parseCurrencyInput(quantityText);
  const unitPrice = parseCurrencyInput(unitPriceText);
  const amount = quantity !== null && unitPrice !== null ? lineItemAmount(quantity, unitPrice) : null;

  const handleSave = async (): Promise<void> => {
    if (!description.trim()) {
      Alert.alert('Missing description', 'Please enter a description for this line item.');
      return;
    }
    if (quantity === null) {
      Alert.alert('Invalid quantity', 'Please enter a quantity greater than 0, with at most 2 decimal places.');
      return;
    }
    if (unitPrice === null) {
      Alert.alert(
        'Invalid unit price',
        `Please enter a unit price greater than $0 and no more than ${formatCurrency(MAX_CURRENCY_AMOUNT, true)}.`,
      );
      return;
    }
    if (amount === null || amount > MAX_CURRENCY_AMOUNT) {
      Alert.alert('Amount too large', `The line item's amount can't be more than ${formatCurrency(MAX_CURRENCY_AMOUNT, true)}.`);
      return;
    }
    if (!accountId) {
      Alert.alert('Unable to save line item', 'Your account could not be found. Please log in again.');
      return;
    }

    setIsSaving(true);
    try {
      await addChangeOrderItem(accountId, poId, changeOrder, { description: description.trim(), quantity, unitPrice });
      // The change order screen reloads when it's shown again, so the new item appears there.
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
        <View style={styles.titleRow}>
          <Pressable
            onPress={() => navigation.goBack()}
            disabled={isSaving}
            hitSlop={10}
            style={styles.backButton}
            accessibilityRole="button"
            accessibilityLabel="Back"
            accessibilityState={{ disabled: isSaving }}
          >
            <ChevronRightIcon size={18} color={welcomeColors.textPrimary} />
          </Pressable>
          <Text style={styles.title} accessibilityRole="header">
            Add Line Item
          </Text>
          <Text style={styles.subtitle}>{changeOrder.name}</Text>
        </View>

        <AuthCard>
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
            label="Quantity"
            required
            placeholder="Enter quantity"
            value={quantityText}
            onChangeText={(text) => setQuantityText(sanitizeCurrencyInput(text))}
            keyboardType="decimal-pad"
            maxLength={NUMBER_MAX_LENGTH}
            editable={!isSaving}
          />
          <LoginInput
            label="Unit Price"
            required
            placeholder="Enter unit price"
            value={unitPriceText}
            onChangeText={(text) => setUnitPriceText(sanitizeCurrencyInput(text))}
            keyboardType="decimal-pad"
            leftIcon={<Text style={styles.currencySymbol}>$</Text>}
            maxLength={NUMBER_MAX_LENGTH}
            editable={!isSaving}
          />
          <View style={styles.amountRow}>
            <Text style={styles.amountLabel}>Amount</Text>
            <Text style={styles.amountValue}>{amount === null ? '—' : formatCurrency(amount, true)}</Text>
          </View>
          <AuthPrimaryButton
            title={isSaving ? 'Saving…' : 'Save Line Item'}
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
    paddingTop: 16,
    paddingBottom: 24,
    gap: 14,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  // The chevron points right; turned around it's a back arrow.
  backButton: {
    transform: [{ rotate: '180deg' }],
  },
  title: {
    flex: 1,
    fontFamily: fontFamily.bold,
    fontWeight: '700',
    fontSize: 18,
    color: welcomeColors.textPrimary,
  },
  subtitle: {
    fontFamily: fontFamily.semiBold,
    fontWeight: '600',
    fontSize: 13,
    color: welcomeColors.accent,
  },
  currencySymbol: {
    fontFamily: fontFamily.semiBold,
    fontWeight: '600',
    fontSize: 14,
    color: welcomeColors.textPrimary,
  },
  amountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  amountLabel: {
    fontFamily: fontFamily.semiBold,
    fontWeight: '600',
    fontSize: 12,
    color: welcomeColors.textSecondary,
  },
  amountValue: {
    fontFamily: fontFamily.bold,
    fontWeight: '700',
    fontSize: 15,
    color: welcomeColors.textPrimary,
  },
});
