import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { DocumentIcon } from '../assets/icons';
import { EMPTY_VALUE } from '../constants/display';
import { fontFamily, radius, toneColors, welcomeColors } from '../theme';
import { PurchaseOrderDetail, PurchaseOrderLedgerEntry } from '../types/purchaseOrder';
import { formatCurrency } from '../utils/formatCurrency';
import { calculatePurchaseOrderTotals } from '../utils/purchaseOrderLedger';
import { statusTone } from '../utils/purchaseOrderStatus';
import { DataTable, DataTableColumn } from './DataTable';

type PurchaseOrderLedgerProps = {
  purchaseOrder: PurchaseOrderDetail;
  /** For the document link: "PO - <vendor> - <job address>". */
  vendorName: string;
  onAddChangeOrder: () => void;
  onAddInvoice: () => void;
  onOpenChangeOrder: (changeOrder: PurchaseOrderLedgerEntry) => void;
  onOpenInvoice: (invoice: PurchaseOrderLedgerEntry) => void;
  onOpenDocument: () => void;
};

type LedgerRow = PurchaseOrderLedgerEntry & { index: number };

function statusColor(entry: LedgerRow): string | undefined {
  const tone = statusTone(entry.status);
  return tone ? toneColors[tone].foreground : undefined;
}

function ledgerColumns(nameLabel: string, onOpen: (entry: PurchaseOrderLedgerEntry) => void): DataTableColumn<LedgerRow>[] {
  return [
    { key: 'index', label: '#', width: 18, getValue: (entry) => String(entry.index) },
    { key: 'name', label: nameLabel, width: 90, isLink: true, getValue: (entry) => entry.name, onPress: onOpen },
    {
      key: 'status',
      label: 'Status',
      width: 120,
      grow: true,
      getValue: (entry) => entry.status || EMPTY_VALUE,
      getColor: statusColor,
    },
    {
      key: 'amount',
      label: 'Amount',
      width: 84,
      align: 'right',
      getValue: (entry) => formatCurrency(entry.amount, true),
    },
  ];
}

const withIndex = (entries: PurchaseOrderLedgerEntry[]): LedgerRow[] =>
  entries.map((entry, index) => ({ ...entry, index: index + 1 }));

/**
 * A signed PO's money trail, as on the signed review screen: PO amount and
 * its change orders, the running total and its invoices, the balance due, and
 * a link to the PO document.
 */
export function PurchaseOrderLedger({
  purchaseOrder,
  vendorName,
  onAddChangeOrder,
  onAddInvoice,
  onOpenChangeOrder,
  onOpenInvoice,
  onOpenDocument,
}: PurchaseOrderLedgerProps): React.JSX.Element {
  const totals = calculatePurchaseOrderTotals(purchaseOrder);
  const documentName = ['PO', vendorName, purchaseOrder.projectAddress].filter(Boolean).join(' - ');

  return (
    <>
      <AmountRow label="PO Amount" amount={totals.poAmount} actionLabel="Add Change Order" onAction={onAddChangeOrder} />
      <DataTable
        columns={ledgerColumns('Change Order', onOpenChangeOrder)}
        rows={withIndex(purchaseOrder.changeOrders)}
        getRowKey={(entry) => entry.id}
        emptyText="No change orders for this purchase order."
      />

      <AmountRow label="Total Amount" amount={totals.totalAmount} actionLabel="Add Invoice" onAction={onAddInvoice} />
      <DataTable
        columns={ledgerColumns('Invoice', onOpenInvoice)}
        rows={withIndex(purchaseOrder.invoices)}
        getRowKey={(entry) => entry.id}
        emptyText="No invoices for this purchase order."
      />

      <AmountRow label="Balance Due" amount={totals.balanceDue} />

      <Pressable
        onPress={onOpenDocument}
        style={({ pressed }) => [styles.section, styles.documentRow, pressed && styles.pressed]}
        accessibilityRole="link"
        accessibilityLabel={`Open ${documentName}`}
      >
        <DocumentIcon size={14} color={welcomeColors.link} />
        <Text style={styles.documentText} numberOfLines={1}>
          {documentName}
        </Text>
      </Pressable>
    </>
  );
}

function AmountRow({
  label,
  amount,
  actionLabel,
  onAction,
}: {
  label: string;
  amount: number;
  actionLabel?: string;
  onAction?: () => void;
}): React.JSX.Element {
  return (
    <View style={[styles.section, styles.amountRow]}>
      <View style={styles.flex}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.amount}>{formatCurrency(amount, true)}</Text>
      </View>
      {actionLabel && onAction && (
        <Pressable
          onPress={onAction}
          style={({ pressed }) => [styles.actionButton, pressed && styles.pressed]}
          accessibilityRole="button"
        >
          <Text style={styles.actionText}>{actionLabel}</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  // Same as the review screen's sections.
  section: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: welcomeColors.cardBorder,
  },
  flex: {
    flex: 1,
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  // Same as the review screen's Total Amount.
  label: {
    fontFamily: fontFamily.regular,
    fontWeight: '400',
    fontSize: 11,
    color: welcomeColors.textSecondary,
  },
  amount: {
    fontFamily: fontFamily.bold,
    fontWeight: '700',
    fontSize: 15,
    color: welcomeColors.textPrimary,
    marginTop: 2,
  },
  // Same as the review screen's Modify button.
  actionButton: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: radius.sm,
    backgroundColor: welcomeColors.chevron,
  },
  actionText: {
    fontFamily: fontFamily.semiBold,
    fontWeight: '600',
    fontSize: 12,
    color: welcomeColors.cardBackground,
  },
  documentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  documentText: {
    flex: 1,
    fontFamily: fontFamily.medium,
    fontWeight: '500',
    fontSize: 11,
    color: welcomeColors.link,
  },
  pressed: {
    opacity: 0.85,
  },
});
