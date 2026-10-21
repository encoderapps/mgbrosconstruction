import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
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
import { SignatureOnFileCard } from '../components/SignatureOnFileCard';
import { CheckCircleIcon } from '../assets/icons';
import { fontFamily, toneColors, welcomeColors } from '../theme';
import { AuthStackParamList } from '../navigation/types';
import { ChangeOrderScreenData, useChangeOrderDetail } from '../hooks/useChangeOrderDetail';
import { useRefreshOnReturn } from '../hooks/useRefreshOnReturn';
import { ChangeOrderDetail } from '../types/changeOrder';
import { changeOrderStage, toChangeOrderSummary } from '../utils/changeOrder';

type Props = NativeStackScreenProps<AuthStackParamList, 'ChangeOrderDetails'>;

/**
 * A change order's details: the change order at a glance, its items, the PO's
 * line items and the change order's notes, then what its status allows. Draft
 * or Pending Approval → its approval status; Ready For Signature → sign;
 * Signed → who signed. Every status comes from the backend.
 */
export function ChangeOrderDetailsScreen({ navigation, route }: Props): React.JSX.Element {
  const { poId, changeOrder: summary } = route.params;
  const { data, status, reload, refresh } = useChangeOrderDetail(poId, summary);
  // Back from Add Line Item or signing: show the change order as the backend has it now.
  useRefreshOnReturn(refresh);

  const renderAction = (changeOrder: ChangeOrderDetail): React.JSX.Element => {
    const latestSummary = toChangeOrderSummary(changeOrder);
    switch (changeOrderStage(changeOrder)) {
      case 'draft':
      case 'pendingApproval':
        return (
          <>
            <Text style={styles.hintText}>This change order is waiting for approval.</Text>
            <OutlineButton
              title="View Approval Status"
              // Swaps screens (rather than stacking them) when moving between details and approval.
              onPress={() => navigation.replace('ChangeOrderApproval', { poId, changeOrder: latestSummary })}
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
          changeOrderStage(changeOrder) === 'draft'
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
        <ChangeOrderHeaderCard title={data?.changeOrder.name ?? summary.name} onBackPress={() => navigation.goBack()} />
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

/** A signed change order: the signature, full name and date when signed in this app, else its status. */
function SignedCard({ changeOrder }: { changeOrder: ChangeOrderDetail }): React.JSX.Element {
  const { signature } = changeOrder;
  return (
    <AuthCard style={styles.signedCard}>
      <View style={styles.signedHeader}>
        <CheckCircleIcon size={16} color={toneColors.success.foreground} />
        <Text style={styles.signedText}>
          {signature ? 'Signed' : `This change order is ${changeOrder.status}.`}
        </Text>
      </View>
      {signature && (
        <SignatureOnFileCard name={signature.name} imageBase64={signature.imageBase64} date={signature.date} />
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
    gap: 10,
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
});
