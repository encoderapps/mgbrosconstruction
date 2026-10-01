import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  LayoutAnimation,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { DataTable, DataTableColumn } from '../components/DataTable';
import { HomeHeader } from '../components/HomeHeader';
import {
  ArrowLeftIcon,
  BagIcon,
  ChatIcon,
  CheckIcon,
  ChevronRightIcon,
  ClipboardCheckIcon,
  DocumentIcon,
} from '../assets/icons';
import { fontFamily, radius, toneColors, welcomeColors } from '../theme';
import { AuthStackParamList } from '../navigation/types';
import { useSubcontractorSession } from '../context/SubcontractorSessionContext';
import { EMPTY_VALUE } from '../constants/display';
import { useAsyncResource } from '../hooks/useAsyncResource';
import { fetchPurchaseOrderDetail } from '../services/purchaseOrderDetailService';
import { PurchaseOrderPaymentTerm } from '../types/purchaseOrder';
import { formatCurrency } from '../utils/formatCurrency';
import { isAwaitingSignature, isSigned } from '../utils/purchaseOrderStatus';

type Props = NativeStackScreenProps<AuthStackParamList, 'PurchaseOrderDetails'>;

const PAYMENT_TERM_COLUMNS: DataTableColumn<PurchaseOrderPaymentTerm & { index: number }>[] = [
  { key: 'index', label: '#', width: 18, getValue: (term) => String(term.index) },
  {
    key: 'percentage',
    label: '%',
    width: 40,
    getValue: (term) => (term.percentage === null ? EMPTY_VALUE : `${term.percentage}%`),
  },
  { key: 'description', label: 'Description', width: 170, grow: true, getValue: (term) => term.description || EMPTY_VALUE },
  {
    key: 'amount',
    label: 'Amount',
    width: 84,
    align: 'right',
    getValue: (term) => (term.amount === null ? EMPTY_VALUE : formatCurrency(term.amount, true)),
  },
];

function showComingSoon(feature: string): void {
  Alert.alert(feature, `${feature} is coming soon.`);
}

/** A purchase order's review screen, opened from its name in a Purchase Orders table. */
export function PurchaseOrderDetailsScreen({ navigation, route }: Props): React.JSX.Element {
  const { poId } = route.params;
  const accountId = useSubcontractorSession().company?.accountId;
  const load = useCallback(() => fetchPurchaseOrderDetail(accountId as string, poId), [accountId, poId]);
  const { data: detail, status, reload } = useAsyncResource(accountId ? load : null);
  const [isDetailsExpanded, setIsDetailsExpanded] = useState(true);

  const toggleDetails = (): void => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setIsDetailsExpanded((current) => !current);
  };

  const renderBody = (): React.JSX.Element => {
    if (status === 'idle' || status === 'loading') {
      return <ActivityIndicator style={styles.loading} color={welcomeColors.accent} />;
    }
    if (status === 'error' || !detail) {
      return (
        <View style={styles.messageBox}>
          <Text style={styles.messageText}>Unable to load this purchase order.</Text>
          <Pressable onPress={reload} hitSlop={8} accessibilityRole="button">
            <Text style={styles.retryText}>Try again</Text>
          </Pressable>
        </View>
      );
    }

    const signed = isSigned(detail.status);
    const paymentTerms = detail.paymentTerms.map((term, index) => ({ ...term, index: index + 1 }));

    return (
      <>
        <View style={styles.card}>
          <View style={[styles.section, styles.titleSection]}>
            <View style={styles.iconCircle}>
              <BagIcon size={18} color={welcomeColors.accent} />
            </View>
            <Text style={styles.poName} numberOfLines={1}>
              {detail.name}
            </Text>
            <Pressable
              onPress={() => showComingSoon('Communication')}
              style={({ pressed }) => [styles.communicationButton, pressed && styles.pressed]}
              accessibilityRole="button"
            >
              <View style={styles.communicationIcon}>
                <ChatIcon size={12} color={welcomeColors.accent} />
              </View>
              <Text style={styles.communicationText}>Communication</Text>
            </Pressable>
          </View>

          <View style={[styles.section, styles.infoSection]}>
            <View style={styles.statusColumn}>
              <Text style={styles.label}>Status</Text>
              <View style={[styles.statusPill, signed ? styles.statusPillSigned : styles.statusPillPending]}>
                <Text
                  style={[styles.statusText, signed ? styles.statusTextSigned : styles.statusTextPending]}
                  numberOfLines={2}
                >
                  {detail.status || EMPTY_VALUE}
                </Text>
              </View>
            </View>
            <View style={styles.projectColumn}>
              <Text style={styles.label}>Project</Text>
              <Text style={styles.projectName}>{detail.project || EMPTY_VALUE}</Text>
              {!!detail.projectAddress && <Text style={styles.projectAddress}>{detail.projectAddress}</Text>}
            </View>
          </View>

          <View style={[styles.section, styles.totalSection]}>
            <View style={styles.flex}>
              <Text style={styles.label}>Total Amount</Text>
              <Text style={styles.totalAmount}>{formatCurrency(detail.totalAmount, true)}</Text>
            </View>
            {isAwaitingSignature(detail.status) && (
              <Pressable
                onPress={() => showComingSoon('Sign PO')}
                style={({ pressed }) => [styles.signButton, pressed && styles.pressed]}
                accessibilityRole="button"
              >
                <CheckIcon size={12} color={welcomeColors.cardBackground} />
                <Text style={styles.signButtonText}>Sign PO</Text>
              </Pressable>
            )}
          </View>
        </View>

        <View style={styles.card}>
          <Pressable
            onPress={toggleDetails}
            style={[styles.section, styles.sectionHeader, styles.firstSection]}
            accessibilityRole="button"
            accessibilityState={{ expanded: isDetailsExpanded }}
          >
            <View style={styles.iconCircle}>
              <DocumentIcon size={16} color={welcomeColors.accent} />
            </View>
            <Text style={styles.sectionTitle}>PO Details</Text>
            <View style={isDetailsExpanded ? styles.chevronExpanded : undefined}>
              <ChevronRightIcon size={16} color={welcomeColors.chevron} />
            </View>
          </Pressable>
          {isDetailsExpanded && (
            // The details API doesn't return line items or notes yet.
            <Text style={[styles.section, styles.emptyText]}>No line items or notes for this purchase order.</Text>
          )}

          <View style={[styles.section, styles.sectionHeader]}>
            <View style={styles.iconCircle}>
              <ClipboardCheckIcon size={16} color={welcomeColors.accent} />
            </View>
            <Text style={styles.sectionTitle}>Payment Terms</Text>
            <Pressable
              onPress={() => showComingSoon('Modify payment terms')}
              style={({ pressed }) => [styles.modifyButton, pressed && styles.pressed]}
              accessibilityRole="button"
            >
              <Text style={styles.modifyButtonText}>Modify</Text>
            </Pressable>
          </View>
          <DataTable
            columns={PAYMENT_TERM_COLUMNS}
            rows={paymentTerms}
            getRowKey={(term) => term.id}
            emptyText="No payment terms for this purchase order."
          />
        </View>
      </>
    );
  };

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
          <Text style={styles.backText}>Purchase Orders</Text>
        </Pressable>
        {renderBody()}
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
  flex: {
    flex: 1,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    alignSelf: 'flex-start',
  },
  backText: {
    fontFamily: fontFamily.semiBold,
    fontWeight: '600',
    fontSize: 14,
    color: welcomeColors.textPrimary,
  },
  loading: {
    marginTop: 32,
  },
  messageBox: {
    alignItems: 'center',
    gap: 6,
    marginTop: 32,
  },
  messageText: {
    fontFamily: fontFamily.regular,
    fontWeight: '400',
    fontSize: 13,
    color: welcomeColors.textSecondary,
  },
  retryText: {
    fontFamily: fontFamily.semiBold,
    fontWeight: '600',
    fontSize: 13,
    color: welcomeColors.link,
  },
  card: {
    backgroundColor: welcomeColors.cardBackground,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: welcomeColors.cardBorder,
    overflow: 'hidden',
  },
  section: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: welcomeColors.cardBorder,
  },
  firstSection: {
    borderTopWidth: 0,
  },
  titleSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderTopWidth: 0,
  },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: welcomeColors.iconWrapperBackground,
    alignItems: 'center',
    justifyContent: 'center',
  },
  poName: {
    flex: 1,
    fontFamily: fontFamily.semiBold,
    fontWeight: '600',
    fontSize: 15,
    color: welcomeColors.textPrimary,
  },
  communicationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingLeft: 6,
    paddingRight: 12,
    borderRadius: radius.sm,
    backgroundColor: welcomeColors.chevron,
  },
  communicationIcon: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: welcomeColors.iconWrapperBackground,
    alignItems: 'center',
    justifyContent: 'center',
  },
  communicationText: {
    fontFamily: fontFamily.semiBold,
    fontWeight: '600',
    fontSize: 12,
    color: welcomeColors.cardBackground,
  },
  infoSection: {
    flexDirection: 'row',
    gap: 12,
  },
  statusColumn: {
    flex: 1,
    gap: 4,
  },
  projectColumn: {
    flex: 1.4,
    gap: 2,
  },
  label: {
    fontFamily: fontFamily.regular,
    fontWeight: '400',
    fontSize: 11,
    color: welcomeColors.textSecondary,
  },
  statusPill: {
    alignSelf: 'flex-start',
    borderRadius: radius.sm,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  statusPillPending: {
    backgroundColor: toneColors.warning.background,
    borderColor: toneColors.warning.border,
  },
  statusPillSigned: {
    backgroundColor: toneColors.success.background,
    borderColor: toneColors.success.border,
  },
  statusText: {
    fontFamily: fontFamily.medium,
    fontWeight: '500',
    fontSize: 11,
  },
  statusTextPending: {
    color: toneColors.warning.foreground,
  },
  statusTextSigned: {
    color: toneColors.success.foreground,
  },
  projectName: {
    fontFamily: fontFamily.medium,
    fontWeight: '500',
    fontSize: 13,
    color: welcomeColors.textPrimary,
  },
  projectAddress: {
    fontFamily: fontFamily.regular,
    fontWeight: '400',
    fontSize: 12,
    color: welcomeColors.textSecondary,
  },
  totalSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  totalAmount: {
    fontFamily: fontFamily.bold,
    fontWeight: '700',
    fontSize: 15,
    color: welcomeColors.textPrimary,
    marginTop: 2,
  },
  signButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: radius.sm,
    backgroundColor: welcomeColors.chevron,
  },
  signButtonText: {
    fontFamily: fontFamily.semiBold,
    fontWeight: '600',
    fontSize: 13,
    color: welcomeColors.cardBackground,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  sectionTitle: {
    flex: 1,
    fontFamily: fontFamily.semiBold,
    fontWeight: '600',
    fontSize: 14,
    color: welcomeColors.textPrimary,
  },
  chevronExpanded: {
    transform: [{ rotate: '90deg' }],
  },
  emptyText: {
    fontFamily: fontFamily.regular,
    fontWeight: '400',
    fontSize: 12,
    color: welcomeColors.textSecondary,
  },
  modifyButton: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: radius.sm,
    backgroundColor: welcomeColors.chevron,
  },
  modifyButtonText: {
    fontFamily: fontFamily.semiBold,
    fontWeight: '600',
    fontSize: 12,
    color: welcomeColors.cardBackground,
  },
  pressed: {
    opacity: 0.85,
  },
});
