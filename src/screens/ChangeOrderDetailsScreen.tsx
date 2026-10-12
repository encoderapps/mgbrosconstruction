import React, { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AuthCard } from '../components/AuthCard';
import { AuthPrimaryButton } from '../components/AuthPrimaryButton';
import { ChangeOrderDetailsCard } from '../components/ChangeOrderDetailsCard';
import { ChangeOrderItemsCard } from '../components/ChangeOrderItemsCard';
import { HomeHeader } from '../components/HomeHeader';
import { KeyboardAwareScrollView } from '../components/KeyboardAwareScrollView';
import { LoadStateMessage } from '../components/LoadStateMessage';
import { SIGNATURE_DISPLAY_FONT, SignatureInput } from '../components/SignatureInput';
import { BagIcon, CheckCircleIcon, ChevronRightIcon } from '../assets/icons';
import { fontFamily, toneColors, welcomeColors } from '../theme';
import { AuthStackParamList } from '../navigation/types';
import { useSubcontractorSession } from '../context/SubcontractorSessionContext';
import { useBlockBackWhile } from '../hooks/useBlockBackWhile';
import { ChangeOrderScreenData, useChangeOrderDetail } from '../hooks/useChangeOrderDetail';
import { useRefreshOnReturn } from '../hooks/useRefreshOnReturn';
import { signChangeOrder } from '../services/changeOrderService';
import { ChangeOrderDetail } from '../types/changeOrder';
import { isChangeOrderSigned } from '../utils/changeOrder';
import { formatUsDate } from '../utils/formatDate';

type Props = NativeStackScreenProps<AuthStackParamList, 'ChangeOrderDetails'>;

/**
 * Opened from a change order on a signed purchase order: its items (what it
 * adds), the PO's line items and the change order's notes, and the signature.
 */
export function ChangeOrderDetailsScreen({ navigation, route }: Props): React.JSX.Element {
  const { poId, changeOrder: summary } = route.params;
  const accountId = useSubcontractorSession().company?.accountId;
  const { data, status, reload, refresh, setData } = useChangeOrderDetail(poId, summary);
  const [signatureName, setSignatureName] = useState('');
  const [isSigning, setIsSigning] = useState(false);
  // Back from Add Line Item: show the new item.
  useRefreshOnReturn(refresh);
  // Leaving mid-request would lose the result.
  useBlockBackWhile(isSigning);

  const handleSign = async (): Promise<void> => {
    if (!signatureName.trim()) {
      Alert.alert('Signature required', 'Please type your full name to sign this change order.');
      return;
    }
    if (!accountId) {
      Alert.alert('Unable to sign', 'Your account could not be found. Please log in again.');
      return;
    }
    setIsSigning(true);
    try {
      const signed = await signChangeOrder(accountId, poId, summary, signatureName);
      setData((current) => current && { ...current, changeOrder: signed });
      Alert.alert('Change order signed', `${signed.name} has been signed.`);
    } catch (error) {
      Alert.alert('Unable to sign', error instanceof Error ? error.message : 'Please try again.');
    } finally {
      setIsSigning(false);
    }
  };

  const renderSignature = (changeOrder: ChangeOrderDetail): React.JSX.Element => {
    if (isChangeOrderSigned(changeOrder)) {
      const { signature } = changeOrder;
      return (
        <AuthCard style={styles.signedCard}>
          <View style={styles.signedHeader}>
            <CheckCircleIcon size={16} color={toneColors.success.foreground} />
            <Text style={styles.signedText}>
              {signature ? `Signed on ${formatUsDate(signature.date)}` : `This change order is ${changeOrder.status}.`}
            </Text>
          </View>
          {signature && <Text style={styles.signedName}>{signature.name}</Text>}
        </AuthCard>
      );
    }
    return (
      <>
        <Text style={styles.sectionLabel}>Your Signature</Text>
        <SignatureInput value={signatureName} onChangeText={setSignatureName} editable={!isSigning} />
        <AuthPrimaryButton
          title={isSigning ? 'Signing…' : 'Sign'}
          onPress={handleSign}
          disabled={isSigning || !signatureName.trim()}
        />
      </>
    );
  };

  const renderBody = ({ changeOrder, purchaseOrderLineItems }: ChangeOrderScreenData): React.JSX.Element => (
    <>
      <ChangeOrderItemsCard
        items={changeOrder.items}
        editable={!isChangeOrderSigned(changeOrder) && !isSigning}
        onAddPress={() => navigation.navigate('AddChangeOrderItem', { poId, changeOrder: summary })}
      />
      <ChangeOrderDetailsCard purchaseOrderLineItems={purchaseOrderLineItems} notes={changeOrder.notes} />
      {renderSignature(changeOrder)}
    </>
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <HomeHeader />
      <KeyboardAwareScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <AuthCard style={styles.headerCard}>
          <View style={styles.header}>
            <Pressable
              onPress={() => navigation.goBack()}
              disabled={isSigning}
              hitSlop={10}
              style={styles.backButton}
              accessibilityRole="button"
              accessibilityLabel="Back"
              accessibilityState={{ disabled: isSigning }}
            >
              <ChevronRightIcon size={16} color={welcomeColors.textPrimary} />
            </Pressable>
            <View style={styles.iconWrapper}>
              <BagIcon size={18} color={welcomeColors.accent} />
            </View>
            <Text style={styles.title} numberOfLines={1} accessibilityRole="header">
              {summary.name}
            </Text>
          </View>
        </AuthCard>

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
  // The chevron points right; turned around it's the back arrow from the reference.
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
    fontSize: 16,
    color: welcomeColors.textPrimary,
  },
  sectionLabel: {
    fontFamily: fontFamily.semiBold,
    fontWeight: '600',
    fontSize: 12,
    color: welcomeColors.textPrimary,
    marginBottom: -4,
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
    fontFamily: SIGNATURE_DISPLAY_FONT,
    fontSize: 30,
    color: welcomeColors.textPrimary,
  },
});
