import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ActionChip } from '../components/ActionChip';
import { AuthCard } from '../components/AuthCard';
import { AuthPrimaryButton } from '../components/AuthPrimaryButton';
import { BidLineItemsCard } from '../components/BidLineItemsCard';
import { BidOverviewCard } from '../components/BidOverviewCard';
import { HomeHeader } from '../components/HomeHeader';
import { LoadStateMessage } from '../components/LoadStateMessage';
import { ScreenTitleBar } from '../components/ScreenTitleBar';
import { CameraIcon, DocumentIcon } from '../assets/icons';
import { fontFamily, welcomeColors } from '../theme';
import { AuthStackParamList } from '../navigation/types';
import { EMPTY_VALUE } from '../constants/display';
import { useSubcontractorSession } from '../context/SubcontractorSessionContext';
import { useBidDetail } from '../hooks/useBidDetail';
import { useRefreshOnReturn } from '../hooks/useRefreshOnReturn';
import { deleteBidLineItem } from '../services/bidService';
import { BidDetail, BidLineItem } from '../types/bid';
import { isBidEditable } from '../utils/bidStatus';
import { showComingSoon } from '../utils/comingSoon';

type Props = NativeStackScreenProps<AuthStackParamList, 'BidDetails'>;

// TODO: open the project's files once the projects API returns them for a bid.
const PROJECT_FILE_ACTIONS = [
  { label: 'View Blueprint', Icon: DocumentIcon },
  { label: 'View Scans', Icon: DocumentIcon },
  { label: 'View Photos', Icon: CameraIcon },
] as const;

/** Opened from a bid number in a Bids table: the bid, its project and line items, and Mark as Complete. */
export function BidDetailsScreen({ navigation, route }: Props): React.JSX.Element {
  const { bidId } = route.params;
  const accountId = useSubcontractorSession().company?.accountId;
  const { data: bid, status, reload, refresh, setData } = useBidDetail(bidId);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  // Back from Add Line Item or Mark as Complete: show what changed.
  useRefreshOnReturn(refresh);

  const deleteLineItem = async (lineItem: BidLineItem): Promise<void> => {
    if (!accountId) {
      Alert.alert('Unable to delete line item', 'Your account could not be found. Please log in again.');
      return;
    }
    setDeletingId(lineItem.id);
    try {
      setData(await deleteBidLineItem(accountId, bidId, lineItem.id));
    } catch (error) {
      Alert.alert('Unable to delete line item', error instanceof Error ? error.message : 'Please try again.');
    } finally {
      setDeletingId(null);
    }
  };

  const confirmDeleteLineItem = (lineItem: BidLineItem): void => {
    Alert.alert('Delete line item?', `"${lineItem.description}" will be removed from this bid.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteLineItem(lineItem) },
    ]);
  };

  const renderBid = (detail: BidDetail): React.JSX.Element => {
    const editable = isBidEditable(detail.status);
    const address = detail.projectAddress;

    return (
      <>
        <BidOverviewCard bid={detail} />

        <AuthCard style={styles.card}>
          <Text style={styles.cardTitle} accessibilityRole="header">
            Project Information
          </Text>
          <Text style={styles.label}>Address</Text>
          {address ? (
            <Text style={styles.bodyText}>
              {address.street},{'\n'}
              {address.city}, {address.state} {address.postalCode}
            </Text>
          ) : (
            <Text style={styles.bodyText}>{EMPTY_VALUE}</Text>
          )}
          <View style={styles.actions}>
            {PROJECT_FILE_ACTIONS.map(({ label, Icon }) => (
              <ActionChip key={label} label={label} Icon={Icon} onPress={() => showComingSoon(label)} />
            ))}
          </View>
        </AuthCard>

        <AuthCard style={styles.card}>
          <Text style={styles.label}>Description</Text>
          <Text style={styles.bodyText}>{detail.description || EMPTY_VALUE}</Text>
        </AuthCard>

        <BidLineItemsCard
          lineItems={detail.lineItems}
          total={detail.total}
          editable={editable}
          deletingId={deletingId}
          onAddPress={() => navigation.navigate('AddBidLineItem', { bidId, bidNumber: detail.bidNumber })}
          onDeletePress={confirmDeleteLineItem}
        />

        {editable && (
          <>
            <AuthPrimaryButton
              title="Mark Bid as Complete"
              onPress={() => navigation.navigate('CompleteBid', { bidId, bidNumber: detail.bidNumber })}
              disabled={detail.lineItems.length === 0 || deletingId !== null}
            />
            {detail.lineItems.length === 0 && (
              <Text style={styles.hint}>Add at least one line item to complete this bid.</Text>
            )}
          </>
        )}
      </>
    );
  };

  const renderBody = (): React.JSX.Element => {
    if (bid) {
      return renderBid(bid);
    }
    if (status === 'error') {
      return <LoadStateMessage state="error" message="Unable to load this bid." onRetry={reload} />;
    }
    return <LoadStateMessage state="loading" />;
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <HomeHeader />
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <ScreenTitleBar title="Bid Details" onBackPress={() => navigation.goBack()} />
        {renderBody()}
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
  card: {
    paddingVertical: 12,
    gap: 2,
  },
  cardTitle: {
    fontFamily: fontFamily.semiBold,
    fontWeight: '600',
    fontSize: 14,
    color: welcomeColors.textPrimary,
    marginBottom: 4,
  },
  label: {
    fontFamily: fontFamily.regular,
    fontWeight: '400',
    fontSize: 11,
    color: welcomeColors.textSecondary,
  },
  bodyText: {
    fontFamily: fontFamily.regular,
    fontWeight: '400',
    fontSize: 13,
    lineHeight: 18,
    color: welcomeColors.textPrimary,
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 10,
  },
  hint: {
    fontFamily: fontFamily.regular,
    fontWeight: '400',
    fontSize: 12,
    color: welcomeColors.textSecondary,
    textAlign: 'center',
  },
});
