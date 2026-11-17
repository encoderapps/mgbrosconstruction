import React, { useCallback, useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AuthCard } from '../components/AuthCard';
import { BidsTable } from '../components/BidsTable';
import { HomeHeader } from '../components/HomeHeader';
import { ChevronRightIcon } from '../assets/icons';
import { fontFamily, toneColors, welcomeColors } from '../theme';
import { AuthStackParamList } from '../navigation/types';
import { useAccountList } from '../hooks/useAccountList';
import { useRefreshOnReturn } from '../hooks/useRefreshOnReturn';
import { fetchBids } from '../services/bidService';
import { Bid } from '../types/bid';
import { splitBidsByCompletion } from '../utils/bidStatus';

type Props = NativeStackScreenProps<AuthStackParamList, 'Bids'>;

/**
 * "View All" from the Home screen's Bids card: every bid, with its status as a
 * coloured pill, in two tables: New, then Completed Bids.
 */
export function BidsScreen({ navigation }: Props): React.JSX.Element {
  const { items: bids, count, status, reload, refresh } = useAccountList(fetchBids, 'all');
  // A bid opened from here may have new line items (a new total) or be completed.
  useRefreshOnReturn(refresh);
  const openBid = useCallback((bid: Bid) => navigation.navigate('BidDetails', { bidId: bid.id }), [navigation]);
  const { newBids, completedBids } = useMemo(() => splitBidsByCompletion(bids), [bids]);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <HomeHeader />
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.titleRow}>
          <Pressable
            onPress={() => navigation.goBack()}
            hitSlop={10}
            style={styles.backButton}
            accessibilityRole="button"
            accessibilityLabel="Back"
          >
            <ChevronRightIcon size={18} color={welcomeColors.textPrimary} />
          </Pressable>
          <Text style={styles.title}>
            Bids
            {count !== null && <Text style={styles.count}> ({count})</Text>}
          </Text>
        </View>

        {status === 'success' ? (
          [
            { key: 'new', title: 'New', rows: newBids, dot: toneColors.warning.foreground },
            { key: 'completed', title: 'Completed Bids', rows: completedBids, dot: toneColors.success.foreground },
          ].map((table) => (
            <AuthCard key={table.key} style={styles.tableCard}>
              <View style={styles.tableHeader}>
                <View style={[styles.statusDot, { backgroundColor: table.dot }]} />
                <Text style={styles.tableTitle} accessibilityRole="header">
                  {table.title}
                  <Text style={styles.tableCount}> ({table.rows.length})</Text>
                </Text>
              </View>
              <BidsTable bids={table.rows} status={status} onRetry={reload} variant="full" onBidPress={openBid} />
            </AuthCard>
          ))
        ) : (
          // Loading or failed: one table shows the spinner, or the error with a retry.
          <AuthCard style={styles.tableCard}>
            <BidsTable bids={bids} status={status} onRetry={reload} variant="full" onBidPress={openBid} />
          </AuthCard>
        )}
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
    paddingTop: 16,
    paddingBottom: 24,
    gap: 14,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  // The chevron points right; turned around it's the back arrow from the reference.
  backButton: {
    transform: [{ rotate: '180deg' }],
  },
  title: {
    flex: 1,
    fontFamily: fontFamily.bold,
    fontWeight: '700',
    fontSize: 20,
    color: welcomeColors.textPrimary,
  },
  count: {
    fontFamily: fontFamily.regular,
    fontWeight: '400',
    fontSize: 16,
    color: welcomeColors.accent,
  },
  // The table fills the card edge to edge.
  tableCard: {
    padding: 0,
    overflow: 'hidden',
  },
  // Same table heading as on the Purchase Orders screen.
  tableHeader: {
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
  tableTitle: {
    flex: 1,
    fontFamily: fontFamily.semiBold,
    fontWeight: '600',
    fontSize: 13,
    color: welcomeColors.textPrimary,
  },
  tableCount: {
    color: welcomeColors.accent,
  },
});
