import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { EMPTY_VALUE } from '../constants/display';
import { fontFamily, welcomeColors } from '../theme';
import { PurchaseOrderLineItem } from '../types/purchaseOrder';
import { formatCurrency } from '../utils/formatCurrency';
import { groupLineItemsByCategory } from '../utils/purchaseOrderLineItems';

/** The review screen's PO Details: line items grouped under their category (e.g. "HVAC Service"). */
export function PurchaseOrderLineItems({ items }: { items: PurchaseOrderLineItem[] }): React.JSX.Element {
  if (items.length === 0) {
    return <Text style={styles.emptyText}>No line items for this purchase order.</Text>;
  }

  return (
    <View style={styles.container}>
      {groupLineItemsByCategory(items).map((group) => (
        <View key={group.category || 'uncategorised'} style={styles.group}>
          <Text style={styles.category}>{group.category || 'Other'}</Text>
          <View style={styles.row}>
            <Text style={[styles.headerCell, styles.indexColumn]}>#</Text>
            <Text style={[styles.headerCell, styles.descriptionColumn]}>Description</Text>
            <Text style={[styles.headerCell, styles.quantityColumn]}>Qty</Text>
            <Text style={[styles.headerCell, styles.moneyColumn]}>Unit Price</Text>
            <Text style={[styles.headerCell, styles.moneyColumn]}>Amount</Text>
          </View>
          {group.items.map((item, index) => (
            <View key={item.id} style={styles.row}>
              <Text style={[styles.cell, styles.indexColumn]}>{index + 1}</Text>
              <Text style={[styles.cell, styles.descriptionColumn]}>{item.description || EMPTY_VALUE}</Text>
              <Text style={[styles.cell, styles.quantityColumn]}>{item.quantity.toFixed(2)}</Text>
              <Text style={[styles.cell, styles.moneyColumn]}>{formatCurrency(item.unitPrice, true)}</Text>
              <Text style={[styles.cell, styles.moneyColumn]}>{formatCurrency(item.amount, true)}</Text>
            </View>
          ))}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: welcomeColors.cardBorder,
  },
  group: {
    gap: 2,
  },
  category: {
    fontFamily: fontFamily.semiBold,
    fontWeight: '600',
    fontSize: 13,
    color: welcomeColors.textPrimary,
    borderLeftWidth: 3,
    borderLeftColor: welcomeColors.loginButton,
    paddingLeft: 6,
    marginBottom: 4,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 4,
    paddingVertical: 4,
  },
  headerCell: {
    fontFamily: fontFamily.semiBold,
    fontWeight: '600',
    fontSize: 11,
    color: welcomeColors.textSecondary,
  },
  cell: {
    fontFamily: fontFamily.regular,
    fontWeight: '400',
    fontSize: 12,
    color: welcomeColors.textPrimary,
  },
  indexColumn: {
    width: 16,
  },
  descriptionColumn: {
    flex: 1,
  },
  quantityColumn: {
    width: 34,
  },
  moneyColumn: {
    width: 68,
    textAlign: 'right',
  },
  emptyText: {
    fontFamily: fontFamily.regular,
    fontWeight: '400',
    fontSize: 12,
    color: welcomeColors.textSecondary,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: welcomeColors.cardBorder,
  },
});
