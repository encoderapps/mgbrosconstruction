import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AuthCard } from '../components/AuthCard';
import { HomeHeader } from '../components/HomeHeader';
import { PurchaseOrdersTable } from '../components/PurchaseOrdersTable';
import { BagIcon, ChevronRightIcon } from '../assets/icons';
import { fontFamily, welcomeColors } from '../theme';
import { AuthStackParamList } from '../navigation/types';
import { useAccountList } from '../hooks/useAccountList';
import { useRefreshOnReturn } from '../hooks/useRefreshOnReturn';
import { fetchPurchaseOrders } from '../services/purchaseOrderService';

type Props = NativeStackScreenProps<AuthStackParamList, 'PurchaseOrders'>;

/** "View All" from the Home screen's Purchase Orders card: every purchase order. */
export function PurchaseOrdersScreen({ navigation }: Props): React.JSX.Element {
  const { items: orders, count, status, reload, refresh } = useAccountList(fetchPurchaseOrders, 'all');
  // A PO opened from here may have been signed or changed since.
  useRefreshOnReturn(refresh);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <HomeHeader />
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <AuthCard style={styles.card}>
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

          <View style={styles.table}>
            <PurchaseOrdersTable
              orders={orders}
              status={status}
              onRetry={reload}
              onOrderPress={(order) => navigation.navigate('PurchaseOrderDetails', { poId: order.id, poDate: order.createdDate ?? undefined })}
            />
          </View>
        </AuthCard>
      </ScrollView>
    </SafeAreaView>
  );
}

const CARD_PADDING = 16;

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
  },
  card: {
    paddingVertical: 12,
    paddingBottom: 0,
    overflow: 'hidden',
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
  table: {
    marginTop: 12,
    marginHorizontal: -CARD_PADDING,
  },
});
