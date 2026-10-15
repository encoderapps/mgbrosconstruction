import React, { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AuthCard } from '../components/AuthCard';
import { CompanyCard } from '../components/CompanyCard';
import { DataTable, DataTableColumn } from '../components/DataTable';
import { HomeHeader } from '../components/HomeHeader';
import { LoadStateMessage } from '../components/LoadStateMessage';
import { SelectInput } from '../components/SelectInput';
import {
  AlertCircleIcon,
  ArrowLeftIcon,
  CalendarIcon,
  CardIcon,
  ClipboardCheckIcon,
  DocumentIcon,
  PlusIcon,
} from '../assets/icons';
import { fontFamily, portalColors, radius, toneColors, welcomeColors } from '../theme';
import { AuthStackParamList } from '../navigation/types';
import { DUE_DATE_TERM_DAYS, DUE_DATE_TERMS } from '../constants/paymentSettings';
import { useSubcontractorSession } from '../context/SubcontractorSessionContext';
import { usePaymentSettings } from '../hooks/usePaymentSettings';
import { useRefreshOnReturn } from '../hooks/useRefreshOnReturn';
import { updateDueDateTerm } from '../services/paymentSettingsService';
import { AccountPaymentTerm, AchInfo, DueDateTerm, PaymentSettings } from '../types/paymentSettings';
import { maskBankNumber } from '../utils/bankAccount';
import { toDateOnlyString } from '../utils/dateValidation';
import { formatShortDate } from '../utils/formatDate';

type Props = NativeStackScreenProps<AuthStackParamList, 'PaymentSettings'>;

const PAYMENT_TERM_COLUMNS: DataTableColumn<AccountPaymentTerm & { index: number }>[] = [
  { key: 'index', label: '#', width: 24, getValue: (term) => String(term.index) },
  { key: 'percentage', label: '%', width: 48, getValue: (term) => `${term.percentage}%` },
  { key: 'description', label: 'Description', width: 180, grow: true, getValue: (term) => term.description },
];

/** "Net 30" → "Payment is due 30 days after the invoice date. An invoice dated Oct 12, 2026 is due Nov 11, 2026." */
function describeDueDate(term: DueDateTerm, today: Date = new Date()): string {
  const days = DUE_DATE_TERM_DAYS[term];
  const dueDate = new Date(today.getFullYear(), today.getMonth(), today.getDate() + days);
  return (
    `Payment is due ${days} days after the invoice date. An invoice dated ` +
    `${formatShortDate(toDateOnlyString(today))} is due ${formatShortDate(toDateOnlyString(dueDate))}.`
  );
}

/** Home → Payment Settings: the company's bank details for ACH, its payment terms and when invoices fall due. */
export function PaymentSettingsScreen({ navigation }: Props): React.JSX.Element {
  const accountId = useSubcontractorSession().company?.accountId;
  const { data: settings, status, reload, refresh, setData } = usePaymentSettings();
  const [isSavingDueDate, setIsSavingDueDate] = useState(false);
  // Back from the ACH screens: show the bank details just saved.
  useRefreshOnReturn(refresh);

  const changeDueDateTerm = async (term: DueDateTerm): Promise<void> => {
    if (!accountId || term === settings?.dueDateTerm) {
      return;
    }
    setIsSavingDueDate(true);
    try {
      setData(await updateDueDateTerm(accountId, term));
    } catch (error) {
      Alert.alert('Unable to change the due date', error instanceof Error ? error.message : 'Please try again.');
    } finally {
      setIsSavingDueDate(false);
    }
  };

  const renderAch = (ach: AchInfo | null): React.JSX.Element => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <View style={styles.sectionIcon}>
          <CardIcon size={16} color={welcomeColors.accent} />
        </View>
        <Text style={styles.sectionTitle}>ACH Info</Text>
        {ach && (
          <Pressable
            onPress={() => navigation.navigate('AchInformation', { existing: ach })}
            hitSlop={8}
            style={({ pressed }) => [styles.addButton, pressed && styles.pressed]}
            accessibilityRole="button"
            accessibilityLabel="Replace ACH information"
          >
            <PlusIcon size={14} />
          </Pressable>
        )}
      </View>

      {ach ? (
        <>
          <View style={styles.detailsBox}>
            {[
              ['Bank Name', ach.bankName],
              ['Name of the Account', ach.accountHolderName],
              ['Type of Account', ach.accountType],
              ['Account Number', maskBankNumber(ach.accountNumber)],
              ['Routing Number', ach.routingNumber],
            ].map(([label, value]) => (
              <Text key={label} style={styles.detailText}>
                <Text style={styles.detailLabel}>{label}: </Text>
                {value}
              </Text>
            ))}
          </View>
          <Pressable
            onPress={() => navigation.navigate('AchFormPreview', { ach })}
            hitSlop={6}
            style={({ pressed }) => [styles.fileLink, pressed && styles.pressed]}
            accessibilityRole="link"
          >
            <DocumentIcon size={14} color={welcomeColors.link} />
            <Text style={styles.fileLinkText}>ACH Form</Text>
          </Pressable>
        </>
      ) : (
        <View style={[styles.detailsBox, styles.emptyBox]}>
          <Text style={styles.emptyText}>No ACH information on file</Text>
          <Pressable
            onPress={() => navigation.navigate('AchInformation')}
            style={({ pressed }) => [styles.addAchButton, pressed && styles.pressed]}
            accessibilityRole="button"
          >
            <Text style={styles.addAchText}>Add ACH</Text>
          </Pressable>
        </View>
      )}
    </View>
  );

  const renderSettings = ({ ach, paymentTerms, dueDateTerm }: PaymentSettings): React.JSX.Element => (
    <AuthCard style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.cardIcon}>
          <CardIcon size={20} color={welcomeColors.accent} />
        </View>
        <Text style={styles.cardTitle}>Payment Settings</Text>
      </View>

      {renderAch(ach)}

      <View style={[styles.section, styles.divided]}>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionIcon}>
            <ClipboardCheckIcon size={16} color={welcomeColors.accent} />
          </View>
          <Text style={styles.sectionTitle}>Payment Terms</Text>
        </View>
        <View style={styles.tableBox}>
          <DataTable
            columns={PAYMENT_TERM_COLUMNS}
            rows={paymentTerms.map((term, index) => ({ ...term, index: index + 1 }))}
            getRowKey={(term) => term.id}
            emptyText="No payment terms on file."
          />
        </View>
      </View>

      <View style={[styles.section, styles.divided]}>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionIcon}>
            <CalendarIcon size={16} color={welcomeColors.accent} />
          </View>
          <Text style={styles.sectionTitle}>Due Date</Text>
        </View>
        {/* collapsable={false}: toggling pointerEvents/opacity mustn't flatten/unflatten this view (Fabric crash on Android). */}
        <View
          pointerEvents={isSavingDueDate ? 'none' : 'auto'}
          style={isSavingDueDate && styles.saving}
          collapsable={false}
        >
          <SelectInput
            label="Invoice payment due"
            placeholder="Select"
            value={dueDateTerm}
            options={DUE_DATE_TERMS}
            onSelect={(term) => changeDueDateTerm(term as DueDateTerm)}
          />
        </View>
        <View style={styles.calculation}>
          <View style={styles.calculationHeader}>
            <AlertCircleIcon size={15} color={welcomeColors.textSecondary} />
            <Text style={styles.calculationTitle}>Due Date Calculation</Text>
          </View>
          <Text style={styles.calculationText}>{describeDueDate(dueDateTerm)}</Text>
        </View>
      </View>
    </AuthCard>
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <HomeHeader />
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <Pressable
          onPress={() => navigation.goBack()}
          hitSlop={10}
          style={styles.backButton}
          accessibilityRole="button"
          accessibilityLabel="Back"
        >
          <ArrowLeftIcon size={18} color={welcomeColors.textPrimary} />
          <Text style={styles.backText}>Home</Text>
        </Pressable>

        <CompanyCard />

        {settings ? (
          renderSettings(settings)
        ) : status === 'error' ? (
          <LoadStateMessage state="error" message="Unable to load your payment settings." onRetry={reload} />
        ) : (
          <LoadStateMessage state="loading" />
        )}
      </ScrollView>
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
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 8,
  },
  backText: {
    fontFamily: fontFamily.semiBold,
    fontWeight: '600',
    fontSize: 15,
    color: welcomeColors.textPrimary,
  },
  // The sections run edge to edge, split by full-width dividers.
  card: {
    padding: 0,
    overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: welcomeColors.cardBorder,
  },
  cardIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: welcomeColors.iconWrapperBackground,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: {
    fontFamily: fontFamily.semiBold,
    fontWeight: '600',
    fontSize: 15,
    color: welcomeColors.textPrimary,
  },
  section: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 10,
  },
  divided: {
    borderTopWidth: 1,
    borderTopColor: welcomeColors.cardBorder,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  sectionIcon: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: welcomeColors.iconWrapperBackground,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
    flex: 1,
    fontFamily: fontFamily.semiBold,
    fontWeight: '600',
    fontSize: 14,
    color: welcomeColors.textPrimary,
  },
  addButton: {
    width: 24,
    height: 24,
    borderRadius: radius.pill,
    backgroundColor: welcomeColors.chevron,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailsBox: {
    backgroundColor: portalColors.unreadBackground,
    borderWidth: 1,
    borderColor: welcomeColors.cardBorder,
    borderRadius: radius.sm,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 6,
  },
  detailText: {
    fontFamily: fontFamily.regular,
    fontWeight: '400',
    fontSize: 12,
    lineHeight: 17,
    color: welcomeColors.textPrimary,
  },
  detailLabel: {
    fontFamily: fontFamily.semiBold,
    fontWeight: '600',
  },
  emptyBox: {
    alignItems: 'center',
    paddingVertical: 18,
    gap: 12,
  },
  emptyText: {
    fontFamily: fontFamily.medium,
    fontWeight: '500',
    fontSize: 13,
    color: welcomeColors.textSecondary,
  },
  addAchButton: {
    backgroundColor: toneColors.success.foreground,
    borderRadius: radius.sm,
    paddingHorizontal: 22,
    paddingVertical: 9,
  },
  addAchText: {
    fontFamily: fontFamily.semiBold,
    fontWeight: '600',
    fontSize: 14,
    color: welcomeColors.cardBackground,
  },
  fileLink: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
  },
  fileLinkText: {
    fontFamily: fontFamily.regular,
    fontWeight: '400',
    fontSize: 12,
    color: welcomeColors.link,
  },
  tableBox: {
    borderWidth: 1,
    borderColor: welcomeColors.cardBorder,
    borderRadius: radius.sm,
    overflow: 'hidden',
  },
  saving: {
    opacity: 0.6,
  },
  calculation: {
    backgroundColor: portalColors.unreadBackground,
    borderWidth: 1,
    borderColor: welcomeColors.cardBorder,
    borderRadius: radius.sm,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 4,
  },
  calculationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  calculationTitle: {
    fontFamily: fontFamily.semiBold,
    fontWeight: '600',
    fontSize: 12,
    color: welcomeColors.textPrimary,
  },
  calculationText: {
    fontFamily: fontFamily.regular,
    fontWeight: '400',
    fontSize: 12,
    lineHeight: 17,
    color: welcomeColors.textSecondary,
  },
  pressed: {
    opacity: 0.7,
  },
});
