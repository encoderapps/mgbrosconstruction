import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ChevronRightIcon } from '../assets/icons';
import { fontFamily, welcomeColors } from '../theme';
import { AuthCard } from './AuthCard';

type ExpandableTableSectionProps = {
  title: string;
  icon: React.ReactNode;
  /** Omitted until known (e.g. while the list is still loading). */
  count?: number;
  isExpanded: boolean;
  onToggle: () => void;
  onViewAllPress: () => void;
  /** The preview table, shown when expanded. */
  children: React.ReactNode;
};

/**
 * Home screen card for a list (Purchase Orders, Invoices): collapsed it's a
 * menu row; expanded it previews the list's table, with View All for the rest.
 */
export function ExpandableTableSection({
  title,
  icon,
  count,
  isExpanded,
  onToggle,
  onViewAllPress,
  children,
}: ExpandableTableSectionProps): React.JSX.Element {
  return (
    <AuthCard style={[styles.card, isExpanded && styles.cardExpanded]}>
      <Pressable
        onPress={onToggle}
        hitSlop={4}
        style={styles.header}
        accessibilityRole="button"
        accessibilityState={{ expanded: isExpanded }}
        accessibilityLabel={count === undefined ? title : `${title}, ${count}`}
      >
        <View style={styles.iconWrapper}>{icon}</View>
        <Text style={styles.title}>
          {title}
          {count !== undefined && <Text style={styles.count}> ({count})</Text>}
        </Text>
        {isExpanded && (
          <Pressable onPress={onViewAllPress} hitSlop={8} accessibilityRole="button">
            <Text style={styles.viewAll}>View All</Text>
          </Pressable>
        )}
        <View style={isExpanded ? styles.chevronExpanded : undefined}>
          <ChevronRightIcon size={16} color={welcomeColors.chevron} />
        </View>
      </Pressable>

      {isExpanded && <View style={styles.table}>{children}</View>}
    </AuthCard>
  );
}

const CARD_PADDING = 16;

const styles = StyleSheet.create({
  // Matches the Home screen's menu cards when collapsed.
  card: {
    paddingVertical: 12,
  },
  cardExpanded: {
    paddingBottom: 0,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: welcomeColors.iconWrapperBackground,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    flex: 1,
    fontFamily: fontFamily.semiBold,
    fontWeight: '600',
    fontSize: 13,
    color: welcomeColors.textPrimary,
  },
  count: {
    color: welcomeColors.accent,
  },
  viewAll: {
    fontFamily: fontFamily.semiBold,
    fontWeight: '600',
    fontSize: 12,
    color: welcomeColors.link,
  },
  chevronExpanded: {
    transform: [{ rotate: '90deg' }],
  },
  // The table runs edge to edge inside the card, like the reference.
  table: {
    marginTop: 12,
    marginHorizontal: -CARD_PADDING,
  },
});
