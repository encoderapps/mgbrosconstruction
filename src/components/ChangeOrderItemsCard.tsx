import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { PlusIcon } from '../assets/icons';
import { fontFamily, welcomeColors } from '../theme';
import { ChangeOrderItem } from '../types/changeOrder';
import { formatCurrency } from '../utils/formatCurrency';
import { AuthCard } from './AuthCard';

type ChangeOrderItemsCardProps = {
  items: ChangeOrderItem[];
  /** False once the change order is signed: no adding. */
  editable: boolean;
  onAddPress: () => void;
};

/** A change order's items: # · description (with its category) · qty · unit price · amount. */
export function ChangeOrderItemsCard({ items, editable, onAddPress }: ChangeOrderItemsCardProps): React.JSX.Element {
  return (
    <AuthCard style={styles.card}>
      <View style={styles.titleRow}>
        <Text style={styles.title} accessibilityRole="header">
          CO Items
        </Text>
        {editable && (
          <Pressable
            onPress={onAddPress}
            hitSlop={8}
            style={({ pressed }) => [styles.addButton, pressed && styles.pressed]}
            accessibilityRole="button"
          >
            <PlusIcon size={12} color={welcomeColors.loginButton} />
            <Text style={styles.addText}>Add Line Item</Text>
          </Pressable>
        )}
      </View>

      <View style={[styles.row, styles.headerRow]}>
        <Text style={[styles.headerText, styles.indexColumn]}>#</Text>
        <Text style={[styles.headerText, styles.descriptionColumn]}>Description</Text>
        <Text style={[styles.headerText, styles.quantityColumn]}>Qty</Text>
        <Text style={[styles.headerText, styles.moneyColumn]}>Unit Price</Text>
        <Text style={[styles.headerText, styles.moneyColumn]}>Amount</Text>
      </View>

      {items.length === 0 ? (
        <Text style={styles.emptyText}>No items on this change order yet.</Text>
      ) : (
        items.map((item, index) => (
          <View key={item.id} style={[styles.row, styles.itemRow]}>
            <Text style={[styles.cellText, styles.indexColumn]}>{index + 1}</Text>
            <View style={styles.descriptionColumn}>
              <Text style={styles.cellText} numberOfLines={2}>
                {item.description}
              </Text>
              {!!item.category && <Text style={styles.categoryText}>{item.category}</Text>}
            </View>
            <Text style={[styles.cellText, styles.quantityColumn]}>{item.quantity.toFixed(2)}</Text>
            <Text style={[styles.cellText, styles.moneyColumn]} numberOfLines={1} adjustsFontSizeToFit>
              {formatCurrency(item.unitPrice, true)}
            </Text>
            <Text style={[styles.cellText, styles.moneyColumn]} numberOfLines={1} adjustsFontSizeToFit>
              {formatCurrency(item.amount, true)}
            </Text>
          </View>
        ))
      )}
    </AuthCard>
  );
}

const styles = StyleSheet.create({
  card: {
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  // Same accent bar as the PO line items' category headings.
  title: {
    fontFamily: fontFamily.semiBold,
    fontWeight: '600',
    fontSize: 14,
    color: welcomeColors.textPrimary,
    borderLeftWidth: 3,
    borderLeftColor: welcomeColors.loginButton,
    paddingLeft: 6,
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
    gap: 6,
  },
  headerRow: {
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: welcomeColors.cardBorder,
  },
  itemRow: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: welcomeColors.cardBorder,
  },
  indexColumn: {
    width: 14,
  },
  descriptionColumn: {
    flex: 1,
    gap: 2,
  },
  quantityColumn: {
    width: 32,
    textAlign: 'right',
  },
  moneyColumn: {
    width: 72,
    textAlign: 'right',
  },
  headerText: {
    fontFamily: fontFamily.medium,
    fontWeight: '500',
    fontSize: 10,
    color: welcomeColors.textSecondary,
  },
  cellText: {
    fontFamily: fontFamily.regular,
    fontWeight: '400',
    fontSize: 11,
    lineHeight: 15,
    color: welcomeColors.textPrimary,
  },
  categoryText: {
    fontFamily: fontFamily.regular,
    fontWeight: '400',
    fontSize: 10,
    color: welcomeColors.textSecondary,
  },
  emptyText: {
    fontFamily: fontFamily.regular,
    fontWeight: '400',
    fontSize: 12,
    color: welcomeColors.textSecondary,
    textAlign: 'center',
    paddingVertical: 14,
  },
  pressed: {
    opacity: 0.7,
  },
});
