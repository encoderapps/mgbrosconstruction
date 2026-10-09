import React, { useCallback, useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AuthCard } from '../components/AuthCard';
import { HomeHeader } from '../components/HomeHeader';
import { PurchaseOrdersTable } from '../components/PurchaseOrdersTable';
import { BagIcon, ChevronRightIcon } from '../assets/icons';
import { fontFamily, toneColors, welcomeColors } from '../theme';
import { AuthStackParamList } from '../navigation/types';
import { useAccountList } from '../hooks/useAccountList';
import { useRefreshOnReturn } from '../hooks/useRefreshOnReturn';
import { fetchPurchaseOrders } from '../services/purchaseOrderService';
import { PurchaseOrder } from '../types/purchaseOrder';
import { groupPurchaseOrdersByStatus, statusTone } from '../utils/purchaseOrderStatus';

type Props = NativeStackScreenProps<AuthStackParamList, 'PurchaseOrders'>;

/**
 * "View All" from the Home screen's Purchase Orders card: every purchase
 * order, in one table per status (Ready for Signature, Signed, Signed by both
 * sides, then any other status).
 */
export function PurchaseOrdersScreen({ navigation }: Props): React.JSX.Element {
  const { items: orders, count, status, reload, refresh } = useAccountList(fetchPurchaseOrders, 'all');
  // A PO opened from here may have been signed or changed since.
  useRefreshOnReturn(refresh);

  const groups = useMemo(() => groupPurchaseOrdersByStatus(orders), [orders]);
  const openOrder = useCallback(
    (order: PurchaseOrder) =>
      navigation.navigate('PurchaseOrderDetails', { poId: order.id, poDate: order.createdDate ?? undefined }),
    [navigation],
  );

  const renderTables = (): React.ReactNode => {
    // Loading, failed or empty: one table shows the spinner, the error with a retry, or "No purchase orders yet."
    if (status !== 'success' || groups.length === 0) {
      return (
        <AuthCard style={styles.tableCard}>
          <PurchaseOrdersTable orders={orders} status={status} onRetry={reload} onOrderPress={openOrder} />
        </AuthCard>
      );
    }
    return groups.map((group) => {
      const tone = statusTone(group.status);
      return (
        <AuthCard key={group.key} style={styles.tableCard}>
          <View style={styles.groupHeader}>
            <View
              style={[styles.statusDot, { backgroundColor: tone ? toneColors[tone].foreground : welcomeColors.chevron }]}
            />
            <Text style={styles.groupTitle} accessibilityRole="header">
              {group.status}
              <Text style={styles.count}> ({group.orders.length})</Text>
            </Text>
          </View>
          <PurchaseOrdersTable
            orders={group.orders}
            status={status}
            onRetry={reload}
            onOrderPress={openOrder}
            showStatus={false}
          />
        </AuthCard>
      );
    });
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <HomeHeader />
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <AuthCard style={styles.headerCard}>
          <View style={styles.header}>
            <Pressable
              onPress={() => navigation.goBack()}
              hitSlop={10}
              style={styles.backButton}
              accessibilityRole="button"
              accessibilityLabel="Back"
            >
              <ChevronRightIcon size={16} color={welcomeColors.textPrimary} />
            </Pressable>
            <View style={styles.iconWrapper}>
              <BagIcon size={18} color={welcomeColors.accent} />
            </View>
            <Text style={styles.title}>
              Purchase Orders
              {count !== null && <Text style={styles.count}> ({count})</Text>}
            </Text>
          </View>
        </AuthCard>

        {renderTables()}
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
  headerCard: {
    paddingVertical: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backButton: {
    transform: [{ rotate: '180deg' }],
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
    fontSize: 15,
    color: welcomeColors.textPrimary,
  },
  count: {
    color: welcomeColors.accent,
  },
  // Each table fills its card edge to edge, under its status heading.
  tableCard: {
    padding: 0,
    overflow: 'hidden',
  },
  groupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  groupTitle: {
    flex: 1,
    fontFamily: fontFamily.semiBold,
    fontWeight: '600',
    fontSize: 13,
    color: welcomeColors.textPrimary,
  },
});
