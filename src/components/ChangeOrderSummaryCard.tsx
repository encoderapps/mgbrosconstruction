import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { EMPTY_VALUE } from '../constants/display';
import { fontFamily, radius, toneColors, welcomeColors } from '../theme';
import { formatCurrency } from '../utils/formatCurrency';
import { statusTone } from '../utils/purchaseOrderStatus';
import { AuthCard } from './AuthCard';

type ChangeOrderSummaryCardProps = {
  /** e.g. "CO#01". */
  changeOrderName: string;
  /** The associated purchase order's number. */
  purchaseOrderName: string;
  /** Exactly as the backend reports it. */
  status: string;
  amount: number;
  /** Leave out to hide the row. */
  description?: string;
};

/** A change order at a glance: its number, its purchase order, status, amount and description. */
export function ChangeOrderSummaryCard({
  changeOrderName,
  purchaseOrderName,
  status,
  amount,
  description,
}: ChangeOrderSummaryCardProps): React.JSX.Element {
  const tone = statusTone(status);

  return (
    <AuthCard style={styles.card}>
      <View style={styles.row}>
        <Field label="Change Order" value={changeOrderName} />
        <Field label="Purchase Order" value={purchaseOrderName} />
      </View>
      <View style={styles.row}>
        <View style={styles.field}>
          <Text style={styles.label}>Status</Text>
          <View
            style={[
              styles.statusPill,
              tone && { backgroundColor: toneColors[tone].background, borderColor: toneColors[tone].border },
            ]}
          >
            <Text style={[styles.statusText, tone && { color: toneColors[tone].foreground }]} numberOfLines={2}>
              {status || EMPTY_VALUE}
            </Text>
          </View>
        </View>
        <Field label="Amount" value={formatCurrency(amount, true)} />
      </View>
      {description !== undefined && <Field label="Description" value={description} />}
    </AuthCard>
  );
}

function Field({ label, value }: { label: string; value: string }): React.JSX.Element {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value.trim() || EMPTY_VALUE}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    paddingVertical: 14,
    gap: 12,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  field: {
    flex: 1,
    gap: 4,
  },
  label: {
    fontFamily: fontFamily.regular,
    fontWeight: '400',
    fontSize: 12,
    color: welcomeColors.textSecondary,
  },
  value: {
    fontFamily: fontFamily.semiBold,
    fontWeight: '600',
    fontSize: 14,
    color: welcomeColors.textPrimary,
  },
  statusPill: {
    alignSelf: 'flex-start',
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: welcomeColors.cardBorder,
    backgroundColor: welcomeColors.iconWrapperBackground,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  statusText: {
    fontFamily: fontFamily.semiBold,
    fontWeight: '600',
    fontSize: 12,
    color: welcomeColors.textPrimary,
  },
});
