import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Alert, BackHandler, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { HomeHeader } from '../components/HomeHeader';
import { KeyboardAwareScrollView } from '../components/KeyboardAwareScrollView';
import { PAYMENT_TERM_COLUMN_WIDTHS, PaymentTermEditorRow } from '../components/PaymentTermEditorRow';
import { AlertCircleIcon, CheckCircleIcon, PlusIcon } from '../assets/icons';
import { PAYMENT_TERM_DESCRIPTION_OPTIONS } from '../constants/paymentTermOptions';
import { fontFamily, portalColors, radius, toneColors, welcomeColors } from '../theme';
import { AuthStackParamList } from '../navigation/types';
import { useSubcontractorSession } from '../context/SubcontractorSessionContext';
import { modifyPaymentTerms } from '../services/paymentTermsService';
import { PaymentTermUpdate, PurchaseOrderPaymentTerm } from '../types/purchaseOrder';
import {
  PaymentTermDraft,
  calculatePaymentTermAmounts,
  formatPercentage,
  isFullPercentage,
  parsePercentage,
  sanitizePercentageInput,
  sumDraftPercentages,
  validatePaymentTermDrafts,
  withCalculatedAmounts,
  withEvenPercentages,
} from '../utils/paymentTerms';

type Props = NativeStackScreenProps<AuthStackParamList, 'ModifyPaymentTerms'>;

function toDraft(term: PurchaseOrderPaymentTerm, index: number): PaymentTermDraft {
  return {
    key: `existing-${index}`,
    description: term.description,
    percentageText: term.percentage === null ? '' : String(term.percentage),
  };
}

/**
 * Opened from Modify on the PO review screen. Edits a copy of the PO's payment
 * terms: Cancel discards it without calling the API; Save sends it and hands
 * the saved terms back to the review screen.
 */
export function ModifyPaymentTermsScreen({ navigation, route }: Props): React.JSX.Element {
  const { poId, totalAmount, paymentTerms } = route.params;
  const accountId = useSubcontractorSession().company?.accountId;
  const [drafts, setDrafts] = useState<PaymentTermDraft[]>(() => paymentTerms.map(toDraft));
  const [isSaving, setIsSaving] = useState(false);
  const nextKeyRef = useRef(0);
  const isMountedRef = useRef(true);

  // The fixed options, plus any description already on this PO so it still shows as selected.
  const descriptionOptions = useMemo(() => {
    const existing = paymentTerms.map((term) => term.description).filter(Boolean);
    return Array.from(new Set<string>([...PAYMENT_TERM_DESCRIPTION_OPTIONS, ...existing]));
  }, [paymentTerms]);

  const amounts = useMemo(
    () =>
      calculatePaymentTermAmounts(
        totalAmount,
        drafts.map((draft) => parsePercentage(draft.percentageText) ?? 0),
      ),
    [drafts, totalAmount],
  );
  const totalPercentage = sumDraftPercentages(drafts);
  const isTotalValid = isFullPercentage(totalPercentage);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Don't let the user leave mid-save (Android back button, iOS swipe), so the
  // review screen always receives the result.
  useEffect(() => {
    navigation.setOptions({ gestureEnabled: !isSaving });
    if (!isSaving) {
      return;
    }
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => true);
    return () => subscription.remove();
  }, [isSaving, navigation]);

  const handleDescriptionChange = useCallback((key: string, description: string) => {
    setDrafts((current) => current.map((draft) => (draft.key === key ? { ...draft, description } : draft)));
  }, []);

  // Editing one percentage doesn't rebalance the others: the total turns red
  // and Save stays disabled until the user brings it back to 100%.
  const handlePercentageChange = useCallback((key: string, text: string) => {
    const percentageText = sanitizePercentageInput(text);
    setDrafts((current) => current.map((draft) => (draft.key === key ? { ...draft, percentageText } : draft)));
  }, []);

  // Adding or deleting a term spreads 100% evenly across the remaining terms.
  const handleDelete = useCallback((key: string) => {
    setDrafts((current) => withEvenPercentages(current.filter((draft) => draft.key !== key)));
  }, []);

  const handleAdd = (): void => {
    nextKeyRef.current += 1;
    const newDraft: PaymentTermDraft = { key: `new-${nextKeyRef.current}`, description: '', percentageText: '' };
    setDrafts((current) => withEvenPercentages([...current, newDraft]));
  };

  const handleSave = async (): Promise<void> => {
    if (isSaving) {
      return;
    }
    const validationError = validatePaymentTermDrafts(drafts);
    if (validationError) {
      Alert.alert('Check payment terms', validationError);
      return;
    }

    if (!accountId) {
      // The session is gone (e.g. logged out elsewhere); there's no account to save for.
      Alert.alert('Unable to save', 'Your session has expired. Please log in again.');
      return;
    }

    const terms: PaymentTermUpdate[] = drafts.map((draft) => ({
      description: draft.description.trim(),
      // Validation guarantees a number here.
      percentage: parsePercentage(draft.percentageText) ?? 0,
    }));

    setIsSaving(true);
    try {
      const result = await modifyPaymentTerms(accountId, poId, terms);
      if (!isMountedRef.current) {
        return;
      }
      Alert.alert('Payment Terms', result.message);
      navigation.popTo(
        'PurchaseOrderDetails',
        { poId, updatedPaymentTerms: withCalculatedAmounts(result.paymentTerms, totalAmount) },
        { merge: true },
      );
    } catch (error) {
      if (!isMountedRef.current) {
        return;
      }
      setIsSaving(false);
      Alert.alert(
        'Unable to save',
        error instanceof Error ? error.message : 'Unable to update the payment terms. Please try again.',
      );
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <HomeHeader />
      <KeyboardAwareScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.card}>
          <Text style={styles.title}>Modify Payment Terms</Text>

          <View style={styles.headerRow}>
            <Text style={[styles.headerText, styles.indexColumn]}>#</Text>
            <Text style={[styles.headerText, styles.descriptionColumn]}>Description *</Text>
            <Text style={[styles.headerText, styles.percentageColumn]}>% *</Text>
            <Text style={[styles.headerText, styles.amountColumn]}>Amount</Text>
            <View style={styles.deleteColumn} />
          </View>

          <View style={styles.rows}>
            {drafts.map((draft, index) => (
              <PaymentTermEditorRow
                key={draft.key}
                draft={draft}
                position={index + 1}
                amount={amounts[index]}
                descriptionOptions={descriptionOptions}
                canDelete={drafts.length > 1}
                disabled={isSaving}
                onDescriptionChange={handleDescriptionChange}
                onPercentageChange={handlePercentageChange}
                onDelete={handleDelete}
              />
            ))}
          </View>

          <Pressable
            onPress={handleAdd}
            disabled={isSaving}
            style={({ pressed }) => [styles.addButton, pressed && styles.pressed]}
            accessibilityRole="button"
          >
            <PlusIcon size={14} color={toneColors.success.foreground} />
            <Text style={styles.addButtonText}>Add Payment Term</Text>
          </Pressable>

          <View
            style={[styles.totalBar, isTotalValid ? styles.totalBarValid : styles.totalBarInvalid]}
            accessibilityLiveRegion="polite"
          >
            {isTotalValid ? (
              <CheckCircleIcon size={14} color={toneColors.success.foreground} />
            ) : (
              <AlertCircleIcon size={16} color={toneColors.danger.foreground} />
            )}
            <Text style={[styles.totalLabel, !isTotalValid && styles.totalTextInvalid]}>Total Percentage</Text>
            <Text style={[styles.totalValue, !isTotalValid && styles.totalTextInvalid]}>
              {formatPercentage(totalPercentage)}
            </Text>
          </View>
          {!isTotalValid && <Text style={styles.totalHint}>Payment terms must total exactly 100% to save.</Text>}

          <View style={styles.actions}>
            <Pressable
              onPress={() => navigation.goBack()}
              disabled={isSaving}
              style={({ pressed }) => [styles.actionButton, styles.cancelButton, (pressed || isSaving) && styles.pressed]}
              accessibilityRole="button"
              accessibilityState={{ disabled: isSaving }}
            >
              <Text style={styles.cancelText}>Cancel Changes</Text>
            </Pressable>
            <Pressable
              onPress={handleSave}
              disabled={isSaving || !isTotalValid}
              style={({ pressed }) => [
                styles.actionButton,
                styles.saveButton,
                (pressed || isSaving) && styles.pressed,
                !isTotalValid && styles.saveDisabled,
              ]}
              accessibilityRole="button"
              accessibilityState={{ disabled: isSaving || !isTotalValid, busy: isSaving }}
            >
              {isSaving && <ActivityIndicator size="small" color={welcomeColors.cardBackground} />}
              <Text style={styles.saveText}>{isSaving ? 'Saving...' : 'Save Changes'}</Text>
            </Pressable>
          </View>
        </View>
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
  },
  card: {
    backgroundColor: welcomeColors.cardBackground,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: welcomeColors.cardBorder,
    padding: 12,
    gap: 10,
  },
  title: {
    fontFamily: fontFamily.semiBold,
    fontWeight: '600',
    fontSize: 14,
    color: welcomeColors.textPrimary,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  headerText: {
    fontFamily: fontFamily.semiBold,
    fontWeight: '600',
    fontSize: 11,
    color: welcomeColors.textSecondary,
  },
  indexColumn: {
    width: PAYMENT_TERM_COLUMN_WIDTHS.index,
  },
  descriptionColumn: {
    flex: 1,
  },
  percentageColumn: {
    width: PAYMENT_TERM_COLUMN_WIDTHS.percentage,
    textAlign: 'center',
  },
  amountColumn: {
    width: PAYMENT_TERM_COLUMN_WIDTHS.amount,
  },
  deleteColumn: {
    width: PAYMENT_TERM_COLUMN_WIDTHS.delete,
  },
  rows: {
    gap: 10,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 40,
    borderRadius: radius.sm,
    backgroundColor: welcomeColors.inputBackground,
    borderWidth: 1,
    borderColor: welcomeColors.cardBorder,
  },
  addButtonText: {
    fontFamily: fontFamily.medium,
    fontWeight: '500',
    fontSize: 12,
    color: toneColors.success.foreground,
  },
  totalBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: radius.sm,
    borderWidth: 1,
  },
  totalBarValid: {
    backgroundColor: toneColors.success.background,
    borderColor: toneColors.success.border,
  },
  totalBarInvalid: {
    backgroundColor: toneColors.danger.background,
    borderColor: toneColors.danger.border,
  },
  totalLabel: {
    flex: 1,
    fontFamily: fontFamily.semiBold,
    fontWeight: '600',
    fontSize: 12,
    color: toneColors.success.foreground,
  },
  totalValue: {
    fontFamily: fontFamily.bold,
    fontWeight: '700',
    fontSize: 12,
    color: toneColors.success.foreground,
  },
  totalTextInvalid: {
    color: toneColors.danger.foreground,
  },
  totalHint: {
    fontFamily: fontFamily.regular,
    fontWeight: '400',
    fontSize: 11,
    color: toneColors.danger.foreground,
    marginTop: -4,
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 42,
    borderRadius: radius.sm,
  },
  cancelButton: {
    borderWidth: 1,
    borderColor: portalColors.danger,
    backgroundColor: welcomeColors.cardBackground,
  },
  cancelText: {
    fontFamily: fontFamily.semiBold,
    fontWeight: '600',
    fontSize: 13,
    color: portalColors.danger,
  },
  saveButton: {
    backgroundColor: welcomeColors.registerGreen,
  },
  saveDisabled: {
    opacity: 0.5,
  },
  saveText: {
    fontFamily: fontFamily.semiBold,
    fontWeight: '600',
    fontSize: 13,
    color: welcomeColors.cardBackground,
  },
  pressed: {
    opacity: 0.85,
  },
});
