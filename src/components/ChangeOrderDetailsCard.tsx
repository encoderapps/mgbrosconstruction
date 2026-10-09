import React, { useState } from 'react';
import { LayoutAnimation, Pressable, StyleSheet, Text, View } from 'react-native';
import { ChevronRightIcon, DocumentIcon } from '../assets/icons';
import { fontFamily, welcomeColors } from '../theme';
import { EMPTY_VALUE } from '../constants/display';
import { PurchaseOrderLineItem } from '../types/purchaseOrder';
import { AuthCard } from './AuthCard';
import { PurchaseOrderLineItems } from './PurchaseOrderLineItems';

type ChangeOrderDetailsCardProps = {
  /** The purchase order's own line items, which the change order amends. */
  purchaseOrderLineItems: PurchaseOrderLineItem[];
  notes: string;
};

/** "CO Details": the purchase order's line items (by category) and the change order's notes. Collapsible. */
export function ChangeOrderDetailsCard({ purchaseOrderLineItems, notes }: ChangeOrderDetailsCardProps): React.JSX.Element {
  const [isExpanded, setIsExpanded] = useState(true);

  const toggle = (): void => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setIsExpanded((current) => !current);
  };

  return (
    <AuthCard style={styles.card}>
      <Pressable
        onPress={toggle}
        style={styles.header}
        accessibilityRole="button"
        accessibilityState={{ expanded: isExpanded }}
      >
        <View style={styles.iconWrapper}>
          <DocumentIcon size={16} color={welcomeColors.accent} />
        </View>
        <Text style={styles.title}>CO Details</Text>
        <View style={isExpanded ? styles.chevronExpanded : undefined}>
          <ChevronRightIcon size={16} color={welcomeColors.chevron} />
        </View>
      </Pressable>

      {isExpanded && (
        <>
          <PurchaseOrderLineItems items={purchaseOrderLineItems} />
          <View style={styles.notes}>
            <Text style={styles.notesTitle}>Notes</Text>
            <Text style={styles.notesText}>{notes || EMPTY_VALUE}</Text>
          </View>
        </>
      )}
    </AuthCard>
  );
}

const styles = StyleSheet.create({
  // The line items run edge to edge; the header and notes add their own padding.
  card: {
    padding: 0,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  iconWrapper: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: welcomeColors.iconWrapperBackground,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    flex: 1,
    fontFamily: fontFamily.semiBold,
    fontWeight: '600',
    fontSize: 14,
    color: welcomeColors.textPrimary,
  },
  chevronExpanded: {
    transform: [{ rotate: '90deg' }],
  },
  notes: {
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: welcomeColors.cardBorder,
  },
  // Same accent bar as the line items' category headings.
  notesTitle: {
    fontFamily: fontFamily.semiBold,
    fontWeight: '600',
    fontSize: 13,
    color: welcomeColors.textPrimary,
    borderLeftWidth: 3,
    borderLeftColor: welcomeColors.loginButton,
    paddingLeft: 6,
  },
  notesText: {
    fontFamily: fontFamily.regular,
    fontWeight: '400',
    fontSize: 12,
    lineHeight: 17,
    color: welcomeColors.textPrimary,
  },
});
