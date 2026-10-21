import React, { useState } from 'react';
import { Alert, Keyboard, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AuthCard } from '../components/AuthCard';
import { DateInput } from '../components/DateInput';
import { HomeHeader } from '../components/HomeHeader';
import { KeyboardAwareScrollView } from '../components/KeyboardAwareScrollView';
import { LoginInput } from '../components/LoginInput';
import { ChevronRightIcon } from '../assets/icons';
import { fontFamily, radius, welcomeColors } from '../theme';
import { AuthStackParamList } from '../navigation/types';
import { useSubcontractorSession } from '../context/SubcontractorSessionContext';
import { useBlockBackWhile } from '../hooks/useBlockBackWhile';
import { NEW_CHANGE_ORDER_STATUS, createChangeOrder } from '../services/changeOrderService';
import { MAX_CURRENCY_AMOUNT, parseCurrencyInput, sanitizeCurrencyInput } from '../utils/currencyInput';
import { todayDateString } from '../utils/dateValidation';
import { formatCurrency } from '../utils/formatCurrency';

type Props = NativeStackScreenProps<AuthStackParamList, 'AddChangeOrder'>;

const DESCRIPTION_MAX_LENGTH = 1000;
const SPECIAL_INSTRUCTIONS_MAX_LENGTH = 1000;

/**
 * "Add Change Order" on a signed purchase order: its date of issue, amount,
 * description and any special instructions. A new change order is always a
 * Draft; the backend assigns its number, takes the general contractor from
 * the purchase order and submits it for approval.
 */
export function AddChangeOrderScreen({ navigation, route }: Props): React.JSX.Element {
  const { poId, poName, opportunityId } = route.params;
  const company = useSubcontractorSession().company;
  const [dateOfIssue, setDateOfIssue] = useState(todayDateString);
  const [amountText, setAmountText] = useState('');
  const [description, setDescription] = useState('');
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  // Leaving mid-save would lose the result.
  useBlockBackWhile(isSaving);

  const handleSave = async (): Promise<void> => {
    if (isSaving) {
      return;
    }
    if (!dateOfIssue) {
      Alert.alert('Missing date of issue', 'Please select the date of issue.');
      return;
    }
    if (!amountText.trim()) {
      Alert.alert('Missing amount', 'Please enter the change order amount.');
      return;
    }
    const amount = parseCurrencyInput(amountText);
    if (amount === null) {
      Alert.alert(
        'Invalid amount',
        `Please enter an amount greater than $0 and up to ${formatCurrency(MAX_CURRENCY_AMOUNT, true)}.`,
      );
      return;
    }
    if (!description.trim()) {
      Alert.alert('Missing description', 'Please describe the change order.');
      return;
    }
    if (!company) {
      Alert.alert('Unable to create change order', 'Your account could not be found. Please log in again.');
      return;
    }

    Keyboard.dismiss();
    setIsSaving(true);
    try {
      const created = await createChangeOrder(company.accountId, {
        poId,
        opportunityId,
        amount,
        description,
        dateOfIssue,
        specialInstructions,
      });
      // The purchase order reloads when it's shown again, so the change order appears in its table.
      navigation.goBack();
      Alert.alert(
        created.changeOrderNumber ? `Change order ${created.changeOrderNumber} created` : 'Change order created',
        created.message,
      );
    } catch (error) {
      setIsSaving(false);
      Alert.alert('Unable to create change order', error instanceof Error ? error.message : 'Please try again.');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <HomeHeader />
      <KeyboardAwareScrollView contentContainerStyle={styles.container}>
        <View>
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
              Add Change Order
            </Text>
          </View>
          {!!company?.name && <Text style={styles.companyName}>{company.name}</Text>}
          <Text style={styles.poName}>{poName}</Text>
        </View>

        <AuthCard>
          {/* Fixed: a new change order is always a Draft. */}
          <LoginInput
            label="Status"
            placeholder={NEW_CHANGE_ORDER_STATUS}
            value={NEW_CHANGE_ORDER_STATUS}
            onChangeText={() => undefined}
            editable={false}
          />
          <DateInput
            label="Date of Issue"
            required
            placeholder="Select date of issue"
            value={dateOfIssue}
            onChange={setDateOfIssue}
            disabled={isSaving}
          />
          <LoginInput
            label="Change Order Amount"
            required
            placeholder="Enter amount"
            value={amountText}
            onChangeText={(text) => setAmountText(sanitizeCurrencyInput(text))}
            keyboardType="decimal-pad"
            editable={!isSaving}
          />
          <LoginInput
            label="Description"
            required
            placeholder="Describe the change order"
            value={description}
            onChangeText={setDescription}
            autoCapitalize="sentences"
            maxLength={DESCRIPTION_MAX_LENGTH}
            multiline
            editable={!isSaving}
          />
          <LoginInput
            label="Special Instructions"
            placeholder="Add any special instructions (optional)"
            value={specialInstructions}
            onChangeText={setSpecialInstructions}
            autoCapitalize="sentences"
            maxLength={SPECIAL_INSTRUCTIONS_MAX_LENGTH}
            multiline
            editable={!isSaving}
          />

          {/* collapsable={false}: see LoginInput. */}
          <View style={styles.buttons} collapsable={false}>
            <Pressable
              onPress={() => navigation.goBack()}
              disabled={isSaving}
              style={({ pressed }) => [styles.button, styles.cancelButton, (pressed || isSaving) && styles.pressed]}
              accessibilityRole="button"
              accessibilityState={{ disabled: isSaving }}
            >
              <Text style={styles.cancelText}>Cancel</Text>
            </Pressable>
            <Pressable
              onPress={handleSave}
              disabled={isSaving}
              style={({ pressed }) => [styles.button, styles.saveButton, (pressed || isSaving) && styles.pressed]}
              accessibilityRole="button"
              accessibilityState={{ disabled: isSaving, busy: isSaving }}
            >
              <Text style={styles.saveText}>{isSaving ? 'Creating…' : 'Create Change Order'}</Text>
            </Pressable>
          </View>
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
  // The chevron points right; turned around it's the back arrow from the reference.
  backButton: {
    transform: [{ rotate: '180deg' }],
  },
  title: {
    flex: 1,
    fontFamily: fontFamily.bold,
    fontWeight: '700',
    fontSize: 20,
    color: welcomeColors.textPrimary,
  },
  companyName: {
    fontFamily: fontFamily.medium,
    fontWeight: '500',
    fontSize: 13,
    color: welcomeColors.textPrimary,
    marginTop: 6,
  },
  poName: {
    fontFamily: fontFamily.regular,
    fontWeight: '400',
    fontSize: 12,
    color: welcomeColors.textSecondary,
    marginTop: 2,
  },
  buttons: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    flex: 1,
    height: 46,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    borderWidth: 1,
    borderColor: welcomeColors.loginButton,
    backgroundColor: welcomeColors.cardBackground,
  },
  saveButton: {
    backgroundColor: welcomeColors.loginButton,
  },
  cancelText: {
    fontFamily: fontFamily.semiBold,
    fontWeight: '600',
    fontSize: 14,
    color: welcomeColors.textPrimary,
  },
  saveText: {
    fontFamily: fontFamily.semiBold,
    fontWeight: '600',
    fontSize: 14,
    color: welcomeColors.cardBackground,
  },
  pressed: {
    opacity: 0.85,
  },
});
