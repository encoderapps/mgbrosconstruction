import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { PlusIcon, TrashIcon } from '../assets/icons';
import { fontFamily, welcomeColors } from '../theme';
import { BidLineItem } from '../types/bid';
import { formatCurrency } from '../utils/formatCurrency';
import { AuthCard } from './AuthCard';

type BidLineItemsCardProps = {
  lineItems: BidLineItem[];
  total: number;
  /** False once the bid is closed: no adding or deleting. */
  editable: boolean;
  /** The line item being deleted, so its button can show it's busy. */
  deletingId: string | null;
  onAddPress: () => void;
  onDeletePress: (lineItem: BidLineItem) => void;
};

/** Bid Details' line items: # · description · amount · delete, with the bid total underneath. */
export function BidLineItemsCard({
  lineItems,
  total,
  editable,
  deletingId,
  onAddPress,
  onDeletePress,
}: BidLineItemsCardProps): React.JSX.Element {
  return (
    <AuthCard style={styles.card}>
      <View style={styles.titleRow}>
        <Text style={styles.title} accessibilityRole="header">
          Line Items
        </Text>
        {editable && (
          <Pressable
            onPress={onAddPress}
            hitSlop={8}
            style={({ pressed }) => [styles.addButton, pressed && styles.pressed]}
            accessibilityRole="button"
          >
            <PlusIcon size={12} color={welcomeColors.accent} />
            <Text style={styles.addText}>Add Line Item</Text>
          </Pressable>
        )}
      </View>

      <View style={[styles.row, styles.headerRow]}>
        <Text style={[styles.headerText, styles.indexColumn]}>#</Text>
        <Text style={[styles.headerText, styles.descriptionColumn]}>Description</Text>
        <Text style={[styles.headerText, styles.amountColumn]}>Amount</Text>
        {editable && <Text style={[styles.headerText, styles.actionColumn]}>Action</Text>}
      </View>

      {lineItems.length === 0 ? (
        <Text style={styles.emptyText}>No line items yet.</Text>
      ) : (
        lineItems.map((item, index) => {
          const isDeleting = deletingId === item.id;
          return (
            <View key={item.id} style={[styles.row, styles.itemRow, isDeleting && styles.deleting]}>
              <Text style={[styles.cellText, styles.indexColumn]}>{index + 1}</Text>
              <Text style={[styles.cellText, styles.descriptionColumn]} numberOfLines={2}>
                {item.description}
              </Text>
              <Text style={[styles.cellText, styles.amountColumn]} numberOfLines={1}>
                {formatCurrency(item.amount, true)}
              </Text>
              {editable && (
                <Pressable
                  onPress={() => onDeletePress(item)}
                  disabled={deletingId !== null}
                  hitSlop={10}
                  style={styles.actionColumn}
                  accessibilityRole="button"
                  accessibilityLabel={`Delete ${item.description}`}
                  accessibilityState={{ disabled: deletingId !== null, busy: isDeleting }}
                >
                  <TrashIcon size={15} color={welcomeColors.chevron} />
                </Pressable>
              )}
            </View>
          );
        })
      )}

      <View style={[styles.row, styles.totalRow]}>
        <View style={styles.indexColumn} />
        <Text style={[styles.totalLabel, styles.descriptionColumn]}>Total Bid Amount</Text>
        <Text style={[styles.totalValue, styles.amountColumn]} numberOfLines={1} adjustsFontSizeToFit>
          {formatCurrency(total, true)}
        </Text>
        {editable && <View style={styles.actionColumn} />}
      </View>
    </AuthCard>
  );
}

const styles = StyleSheet.create({
  card: {
    paddingVertical: 12,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  title: {
    fontFamily: fontFamily.semiBold,
    fontWeight: '600',
    fontSize: 14,
    color: welcomeColors.textPrimary,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  addText: {
    fontFamily: fontFamily.medium,
    fontWeight: '500',
    fontSize: 12,
    color: welcomeColors.loginButton,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerRow: {
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: welcomeColors.cardBorder,
  },
  itemRow: {
    paddingVertical: 9,
    borderBottomWidth: 1,
    borderBottomColor: welcomeColors.cardBorder,
  },
  deleting: {
    opacity: 0.4,
  },
  totalRow: {
    paddingTop: 12,
  },
  indexColumn: {
    width: 16,
  },
  descriptionColumn: {
    flex: 1,
  },
  amountColumn: {
    width: 92,
  },
  actionColumn: {
    width: 40,
    alignItems: 'center',
  },
  headerText: {
    fontFamily: fontFamily.medium,
    fontWeight: '500',
    fontSize: 11,
    color: welcomeColors.textSecondary,
  },
  cellText: {
    fontFamily: fontFamily.regular,
    fontWeight: '400',
    fontSize: 12,
    color: welcomeColors.textPrimary,
  },
  emptyText: {
    fontFamily: fontFamily.regular,
    fontWeight: '400',
    fontSize: 12,
    color: welcomeColors.textSecondary,
    paddingVertical: 14,
    textAlign: 'center',
  },
  totalLabel: {
    fontFamily: fontFamily.semiBold,
    fontWeight: '600',
    fontSize: 12,
    color: welcomeColors.textPrimary,
  },
  totalValue: {
    fontFamily: fontFamily.bold,
    fontWeight: '700',
    fontSize: 15,
    color: welcomeColors.textPrimary,
  },
  pressed: {
    opacity: 0.7,
  },
});
