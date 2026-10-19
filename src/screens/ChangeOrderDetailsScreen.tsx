import React, { useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AuthCard } from '../components/AuthCard';
import { AuthPrimaryButton } from '../components/AuthPrimaryButton';
import { ChangeOrderDetailsCard } from '../components/ChangeOrderDetailsCard';
import { ChangeOrderHeaderCard } from '../components/ChangeOrderHeaderCard';
import { ChangeOrderItemsCard } from '../components/ChangeOrderItemsCard';
import { ChangeOrderSummaryCard } from '../components/ChangeOrderSummaryCard';
import { HomeHeader } from '../components/HomeHeader';
import { KeyboardAwareScrollView } from '../components/KeyboardAwareScrollView';
import { LoadStateMessage } from '../components/LoadStateMessage';
import { OutlineButton } from '../components/OutlineButton';
import { CheckCircleIcon } from '../assets/icons';
import { getSignatureFontFamily } from '../constants/signatureFonts';
import { fontFamily, toneColors, welcomeColors } from '../theme';
import { AuthStackParamList } from '../navigation/types';
import { useSubcontractorSession } from '../context/SubcontractorSessionContext';
import { useBlockBackWhile } from '../hooks/useBlockBackWhile';
import { ChangeOrderScreenData, useChangeOrderDetail } from '../hooks/useChangeOrderDetail';
import { useRefreshOnReturn } from '../hooks/useRefreshOnReturn';
import { requestChangeOrderApproval } from '../services/changeOrderService';
import { ChangeOrderDetail } from '../types/changeOrder';
import { changeOrderStage, toChangeOrderSummary } from '../utils/changeOrder';
import { formatUsDate } from '../utils/formatDate';

type Props = NativeStackScreenProps<AuthStackParamList, 'ChangeOrderDetails'>;

/**
 * Opened from a change order on a signed purchase order: the change order at a
 * glance, its items, the PO's line items and the change order's notes, then
 * the one action its status allows. Draft → request approval; Pending Approval
 * → view the approval status; Ready For Signature → sign; Signed → who signed.
 * Every status comes from the backend.
 */
export function ChangeOrderDetailsScreen({ navigation, route }: Props): React.JSX.Element {
  const { poId, changeOrder: summary } = route.params;
  const accountId = useSubcontractorSession().company?.accountId;
  const { data, status, reload, refresh, setData } = useChangeOrderDetail(poId, summary);
  const [isRequestingApproval, setIsRequestingApproval] = useState(false);
  // Back from Add Line Item, approval or signing: show the change order as the backend has it now.
  useRefreshOnReturn(refresh);
  // Leaving mid-request would lose the result.
  useBlockBackWhile(isRequestingApproval);

  const handleRequestApproval = async (changeOrder: ChangeOrderDetail): Promise<void> => {
    if (isRequestingApproval) {
      return;
    }
    if (!accountId) {
      Alert.alert('Unable to request approval', 'Your account could not be found. Please log in again.');
      return;
    }
    setIsRequestingApproval(true);
    try {
      const result = await requestChangeOrderApproval(accountId, changeOrder.id);
      // Only the status the backend reports back: never assumed.
      setData((current) => current && { ...current, changeOrder: { ...current.changeOrder, status: result.status } });
      navigation.navigate('ChangeOrderApproval', {
        poId,
        changeOrder: { ...toChangeOrderSummary(changeOrder), status: result.status },
      });
    } catch (error) {
      Alert.alert('Unable to request approval', error instanceof Error ? error.message : 'Please try again.');
    } finally {
      setIsRequestingApproval(false);
    }
  };

  const renderAction = (changeOrder: ChangeOrderDetail): React.JSX.Element => {
    const latestSummary = toChangeOrderSummary(changeOrder);
    switch (changeOrderStage(changeOrder)) {
      case 'draft':
        return (
          <AuthPrimaryButton
            title={isRequestingApproval ? 'Submitting…' : 'Click Here for Ready for Signature'}
            onPress={() => handleRequestApproval(changeOrder)}
            disabled={isRequestingApproval}
          />
        );
      case 'pendingApproval':
        return (
          <>
            <Text style={styles.hintText}>This change order is waiting for approval.</Text>
            <OutlineButton
              title="View Approval Status"
              onPress={() => navigation.navigate('ChangeOrderApproval', { poId, changeOrder: latestSummary })}
            />
          </>
        );
      case 'readyForSignature':
        return (
          <AuthPrimaryButton
            title="Sign Change Order"
            onPress={() => navigation.navigate('ChangeOrderSigning', { poId, changeOrder: latestSummary })}
          />
        );
      case 'signed':
        return <SignedCard changeOrder={changeOrder} />;
      case 'rejected':
        return (
          <Text style={[styles.hintText, styles.dangerText]}>
            The approval request for this change order was rejected. Please contact MG Bros for details.
          </Text>
        );
      case 'unknown':
        return (
          <Text style={styles.hintText}>
            No action is available for this change order{changeOrder.status ? ` (status: ${changeOrder.status})` : ''}.
          </Text>
        );
    }
  };

  const renderBody = ({ changeOrder, purchaseOrder, purchaseOrderLineItems }: ChangeOrderScreenData): React.JSX.Element => (
    <>
      <ChangeOrderSummaryCard
        changeOrderName={changeOrder.name}
        purchaseOrderName={purchaseOrder.purchaseOrderName}
        status={changeOrder.status}
        amount={changeOrder.amount}
      />
      <ChangeOrderItemsCard
        items={changeOrder.items}
        // Items can only be added while it's a Draft: approval and signing are for what's on it then.
        onAddPress={
          changeOrderStage(changeOrder) === 'draft' && !isRequestingApproval
            ? () => navigation.navigate('AddChangeOrderItem', { poId, changeOrder: summary })
            : undefined
        }
      />
      <ChangeOrderDetailsCard purchaseOrderLineItems={purchaseOrderLineItems} notes={changeOrder.notes} />
      {renderAction(changeOrder)}
    </>
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <HomeHeader />
      <KeyboardAwareScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <ChangeOrderHeaderCard
          title={data?.changeOrder.name ?? summary.name}
          onBackPress={() => navigation.goBack()}
          backDisabled={isRequestingApproval}
        />
        {data ? (
          renderBody(data)
        ) : status === 'error' ? (
          <LoadStateMessage state="error" message="Unable to load this change order." onRetry={reload} />
        ) : (
          <LoadStateMessage state="loading" />
        )}
      </KeyboardAwareScrollView>
    </SafeAreaView>
  );
}

/** A signed change order: the signing date and signature when signed in this app, else its status. */
function SignedCard({ changeOrder }: { changeOrder: ChangeOrderDetail }): React.JSX.Element {
  const { signature } = changeOrder;
  return (
    <AuthCard style={styles.signedCard}>
      <View style={styles.signedHeader}>
        <CheckCircleIcon size={16} color={toneColors.success.foreground} />
        <Text style={styles.signedText}>
          {signature ? `Signed on ${formatUsDate(signature.date)}` : `This change order is ${changeOrder.status}.`}
        </Text>
      </View>
      {signature && (
        <Text style={[styles.signedName, { fontFamily: getSignatureFontFamily(signature.fontId) }]}>{signature.name}</Text>
      )}
    </AuthCard>
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
  hintText: {
    fontFamily: fontFamily.regular,
    fontWeight: '400',
    fontSize: 13,
    lineHeight: 19,
    color: welcomeColors.textSecondary,
    textAlign: 'center',
  },
  dangerText: {
    color: toneColors.danger.foreground,
  },
  signedCard: {
    paddingVertical: 12,
    gap: 6,
  },
  signedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  signedText: {
    flex: 1,
    fontFamily: fontFamily.semiBold,
    fontWeight: '600',
    fontSize: 13,
    color: toneColors.success.foreground,
  },
  signedName: {
    fontSize: 30,
    color: welcomeColors.textPrimary,
  },
});
