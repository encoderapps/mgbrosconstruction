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
import { EMPTY_VALUE } from '../constants/display';
import { useSubcontractorSession } from '../context/SubcontractorSessionContext';
import { useBlockBackWhile } from '../hooks/useBlockBackWhile';
import { createPurchaseOrderInvoice, parseInvoiceAmount } from '../services/purchaseOrderInvoiceService';
import { NEW_INVOICE_STATUS } from '../types/purchaseOrderInvoice';
import { startOfToday } from '../utils/dateValidation';

type Props = NativeStackScreenProps<AuthStackParamList, 'AddPurchaseOrderInvoice'>;

const VENDOR_INVOICE_NUMBER_MAX_LENGTH = 40;
const AMOUNT_MAX_LENGTH = 15;

/**
 * "Add Invoice" on a signed purchase order: amount, the subcontractor's invoice
 * number and due date, with the PO, the account and the status (always Draft)
 * shown read-only. Salesforce assigns the invoice number (INV-…).
 */
export function AddPurchaseOrderInvoiceScreen({ navigation, route }: Props): React.JSX.Element {
  const { poId, poName } = route.params;
  const company = useSubcontractorSession().company;
  const [amount, setAmount] = useState('');
  const [vendorInvoiceNumber, setVendorInvoiceNumber] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  // Leaving mid-save would lose the result.
  useBlockBackWhile(isSaving);

  const handleSave = async (): Promise<void> => {
    if (parseInvoiceAmount(amount) === null) {
      Alert.alert('Invalid amount', 'Please enter an amount greater than 0, e.g. 150 or 150.75.');
      return;
    }
    if (!vendorInvoiceNumber.trim()) {
      Alert.alert('Missing vendor invoice number', 'Please enter your invoice number.');
      return;
    }
    if (!dueDate) {
      Alert.alert('Missing due date', 'Please select the due date.');
      return;
    }
    if (!company) {
      Alert.alert('Unable to create invoice', 'Your account could not be found. Please log in again.');
      return;
    }

    Keyboard.dismiss();
    setIsSaving(true);
    try {
      const invoice = await createPurchaseOrderInvoice(company.accountId, {
        poId,
        amount,
        vendorInvoiceNumber,
        dueDate,
      });
      // The purchase order reloads when it's shown again, so the invoice appears in its table.
      navigation.goBack();
      Alert.alert(
        'Invoice created',
        invoice.invoiceNumber
          ? `Invoice ${invoice.invoiceNumber} has been added to ${poName}.`
          : `The invoice has been added to ${poName}.`,
      );
    } catch (error) {
      setIsSaving(false);
      Alert.alert('Unable to create invoice', error instanceof Error ? error.message : 'Please try again.');
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
              Add Invoice
            </Text>
          </View>
        </View>

        <AuthCard>
          <LoginInput
            label="Amount"
            required
            placeholder="Enter amount, e.g. 150.00"
            value={amount}
            onChangeText={setAmount}
            keyboardType="decimal-pad"
            maxLength={AMOUNT_MAX_LENGTH}
            editable={!isSaving}
          />
          <LoginInput
            label="Vendor Invoice Number"
            required
            placeholder="Enter vendor invoice number"
            value={vendorInvoiceNumber}
            onChangeText={setVendorInvoiceNumber}
            autoCapitalize="characters"
            maxLength={VENDOR_INVOICE_NUMBER_MAX_LENGTH}
            editable={!isSaving}
          />
          <DateInput
            label="Due Date"
            required
            placeholder="Select due date"
            value={dueDate}
            onChange={setDueDate}
            minimumDate={startOfToday()}
            disabled={isSaving}
          />
          {/* Read-only: set by the PO and the account, and every new invoice starts as a Draft. */}
          <ReadOnlyField label="Purchase Order" value={poName} />
          <ReadOnlyField label="Account" value={company?.name ?? ''} />
          <ReadOnlyField label="Status" value={NEW_INVOICE_STATUS} />

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
              <Text style={styles.saveText}>{isSaving ? 'Saving…' : 'Save Invoice'}</Text>
            </Pressable>
          </View>
        </AuthCard>
      </KeyboardAwareScrollView>
    </SafeAreaView>
  );
}

function ReadOnlyField({ label, value }: { label: string; value: string }): React.JSX.Element {
  return (
    <View style={styles.readOnlyField}>
      <Text style={styles.readOnlyLabel}>{label}</Text>
      <View style={styles.readOnlyBox}>
        <Text style={styles.readOnlyValue} numberOfLines={1}>
          {value.trim() || EMPTY_VALUE}
        </Text>
      </View>
    </View>
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
  readOnlyField: {
    marginBottom: 14,
  },
  // Same label and box as LoginInput, greyed out.
  readOnlyLabel: {
    fontFamily: fontFamily.semiBold,
    fontWeight: '600',
    fontSize: 11,
    lineHeight: 16.5,
    color: welcomeColors.textPrimary,
    marginBottom: 6,
  },
  readOnlyBox: {
    height: 44,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: welcomeColors.inputBorder,
    backgroundColor: welcomeColors.background,
    paddingHorizontal: 12,
    justifyContent: 'center',
  },
  readOnlyValue: {
    fontFamily: fontFamily.regular,
    fontWeight: '400',
    fontSize: 12,
    color: welcomeColors.textSecondary,
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
