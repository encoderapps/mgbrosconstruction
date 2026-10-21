import React from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AuthCard } from '../components/AuthCard';
import { AuthPrimaryButton } from '../components/AuthPrimaryButton';
import { ChangeOrderHeaderCard } from '../components/ChangeOrderHeaderCard';
import { ChangeOrderSummaryCard } from '../components/ChangeOrderSummaryCard';
import { HomeHeader } from '../components/HomeHeader';
import { LoadStateMessage } from '../components/LoadStateMessage';
import { OutlineButton } from '../components/OutlineButton';
import { CheckCircleIcon } from '../assets/icons';
import { fontFamily, toneColors, welcomeColors } from '../theme';
import { AuthStackParamList } from '../navigation/types';
import { useChangeOrderDetail } from '../hooks/useChangeOrderDetail';
import { useRefreshOnReturn } from '../hooks/useRefreshOnReturn';
import { ChangeOrderDetail } from '../types/changeOrder';
import { ChangeOrderStage, changeOrderStage, isAwaitingApproval, toChangeOrderSummary } from '../utils/changeOrder';

type Props = NativeStackScreenProps<AuthStackParamList, 'ChangeOrderApproval'>;

type PanelTone = 'success' | 'warning' | 'danger' | null;

type Panel = { tone: PanelTone; title: string; message: string };

const WAITING_PANEL: Panel = {
  tone: 'warning',
  title: 'Waiting for Approval',
  message:
    'Your change order has been submitted and is awaiting approval from MG Bros. You can sign it once it’s approved.',
};

const PANELS: Record<ChangeOrderStage, Panel> = {
  // A new change order is submitted for approval as it's created, so a Draft is waiting too.
  draft: WAITING_PANEL,
  pendingApproval: WAITING_PANEL,
  readyForSignature: {
    tone: 'success',
    title: 'Approved – Ready for Signature',
    message: 'MG Bros approved this change order. You can sign it now.',
  },
  rejected: {
    tone: 'danger',
    title: 'Approval Request Rejected',
    message: 'MG Bros didn’t approve this change order. Please contact MG Bros for details.',
  },
  signed: {
    tone: 'success',
    title: 'Signed',
    message: 'This change order has been signed.',
  },
  unknown: {
    tone: null,
    title: 'Approval Status',
    message: 'There’s no approval update for this change order yet.',
  },
};

/**
 * A change order's approval status, opened for one that's waiting on approval
 * (a Draft or Pending Approval). Read from the backend (the change-order
 * detail API) when the screen opens, when the user comes back to it, and on
 * Refresh Status. Nothing here changes the status: it only shows what the
 * backend reports, and offers signing once that's Ready For Signature.
 */
export function ChangeOrderApprovalScreen({ navigation, route }: Props): React.JSX.Element {
  const { poId, changeOrder: summary } = route.params;
  const { data, status, reload, refresh } = useChangeOrderDetail(poId, summary);
  useRefreshOnReturn(refresh);
  const isChecking = status === 'loading';

  const renderStatus = (changeOrder: ChangeOrderDetail): React.JSX.Element => {
    const stage = changeOrderStage(changeOrder);
    const panel = PANELS[stage];
    const toneStyle = panel.tone && {
      backgroundColor: toneColors[panel.tone].background,
      borderColor: toneColors[panel.tone].border,
    };
    const titleColor = panel.tone ? toneColors[panel.tone].foreground : welcomeColors.textPrimary;
    const canRefresh = stage !== 'signed' && stage !== 'readyForSignature';

    return (
      <>
        <AuthCard style={[styles.panel, toneStyle]}>
          {isAwaitingApproval(stage) ? (
            <ActivityIndicator color={titleColor} accessibilityLabel="Waiting for approval" />
          ) : (
            panel.tone === 'success' && <CheckCircleIcon size={22} color={titleColor} />
          )}
          {/* Announced when a refresh changes it, e.g. to Approved. */}
          <Text
            style={[styles.panelTitle, { color: titleColor }]}
            accessibilityRole="header"
            accessibilityLiveRegion="polite"
          >
            {panel.title}
          </Text>
          <Text style={styles.panelMessage}>{panel.message}</Text>
        </AuthCard>

        {status === 'error' && (
          <Text style={[styles.hintText, styles.errorText]}>
            Unable to check the latest status. Please try again.
          </Text>
        )}
        {stage === 'readyForSignature' && (
          <AuthPrimaryButton
            title="Sign Change Order"
            // Replaces this screen, so Back from signing returns to the change order.
            onPress={() =>
              navigation.replace('ChangeOrderSigning', { poId, changeOrder: toChangeOrderSummary(changeOrder) })
            }
          />
        )}
        {canRefresh && <OutlineButton title="Refresh Status" onPress={reload} isBusy={isChecking} />}
        <OutlineButton
          title="View Change Order Details"
          // Swaps screens (rather than stacking them) when moving between approval and details.
          onPress={() =>
            navigation.replace('ChangeOrderDetails', { poId, changeOrder: toChangeOrderSummary(changeOrder) })
          }
        />
      </>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <HomeHeader />
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <ChangeOrderHeaderCard
          title={`Change Order ${data?.changeOrder.name ?? summary.name}`}
          onBackPress={() => navigation.goBack()}
        />
        {data ? (
          <>
            <ChangeOrderSummaryCard
              changeOrderName={data.changeOrder.name}
              purchaseOrderName={data.purchaseOrder.purchaseOrderName}
              status={data.changeOrder.status}
              amount={data.changeOrder.amount}
              description={data.changeOrder.description}
            />
            {renderStatus(data.changeOrder)}
          </>
        ) : status === 'error' ? (
          <LoadStateMessage state="error" message="Unable to load this change order." onRetry={reload} />
        ) : (
          <View style={styles.loading}>
            <LoadStateMessage state="loading" />
          </View>
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
    paddingTop: 12,
    paddingBottom: 24,
    gap: 12,
  },
  loading: {
    flex: 1,
  },
  panel: {
    alignItems: 'center',
    paddingVertical: 20,
    gap: 8,
  },
  panelTitle: {
    fontFamily: fontFamily.bold,
    fontWeight: '700',
    fontSize: 17,
    textAlign: 'center',
  },
  panelMessage: {
    fontFamily: fontFamily.regular,
    fontWeight: '400',
    fontSize: 13,
    lineHeight: 19,
    color: welcomeColors.textSecondary,
    textAlign: 'center',
  },
  hintText: {
    fontFamily: fontFamily.regular,
    fontWeight: '400',
    fontSize: 13,
    textAlign: 'center',
  },
  errorText: {
    color: toneColors.danger.foreground,
  },
});
