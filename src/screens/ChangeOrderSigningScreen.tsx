import React, { useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AuthCard } from '../components/AuthCard';
import { AuthPrimaryButton } from '../components/AuthPrimaryButton';
import { ChangeOrderHeaderCard } from '../components/ChangeOrderHeaderCard';
import { ChangeOrderItemsCard } from '../components/ChangeOrderItemsCard';
import { ChangeOrderSummaryCard } from '../components/ChangeOrderSummaryCard';
import { HomeHeader } from '../components/HomeHeader';
import { KeyboardAwareScrollView } from '../components/KeyboardAwareScrollView';
import { LoadStateMessage } from '../components/LoadStateMessage';
import { LoginInput } from '../components/LoginInput';
import { SignatureStylePicker } from '../components/SignatureStylePicker';
import { CheckCircleIcon } from '../assets/icons';
import { SignatureFontId, getSignatureFontFamily } from '../constants/signatureFonts';
import { fontFamily, toneColors, welcomeColors } from '../theme';
import { AuthStackParamList } from '../navigation/types';
import { useSubcontractorSession } from '../context/SubcontractorSessionContext';
import { useBlockBackWhile } from '../hooks/useBlockBackWhile';
import { ChangeOrderScreenData, useChangeOrderDetail } from '../hooks/useChangeOrderDetail';
import { signChangeOrder } from '../services/changeOrderService';
import { buildChangeOrderPdfBase64 } from '../services/purchaseOrderPdfService';
import { ChangeOrderSignature } from '../types/changeOrder';
import { changeOrderStage } from '../utils/changeOrder';
import { todayDateString } from '../utils/dateValidation';
import { formatLongDate } from '../utils/formatDate';
import { signedChangeOrderFileName } from '../utils/signedDocument';

type Props = NativeStackScreenProps<AuthStackParamList, 'ChangeOrderSigning'>;

/** "  Jane   Doe " → "Jane Doe". */
function normaliseName(name: string): string {
  return name.trim().replace(/\s+/g, ' ');
}

/**
 * Signing a change order that's Ready For Signature: the change order, then
 * the signer's name, today's date and one of three signature styles. Sign
 * sends the signed change order to the signChangeOrder API; only once that
 * succeeds is it shown as signed, with the backend's signing date.
 */
export function ChangeOrderSigningScreen({ navigation, route }: Props): React.JSX.Element {
  const { poId, changeOrder: summary } = route.params;
  const { company, signature: savedSignature } = useSubcontractorSession();
  const { data, status, reload, refresh, setData } = useChangeOrderDetail(poId, summary);
  // Starts from the signature made when registering, so signing is one tap; both can still be changed.
  const [fullName, setFullName] = useState(savedSignature?.name ?? '');
  const [fontId, setFontId] = useState<SignatureFontId | null>(savedSignature?.fontId ?? null);
  const [isSigning, setIsSigning] = useState(false);
  // Set only after the API confirms the signing.
  const [signedSignature, setSignedSignature] = useState<ChangeOrderSignature | null>(null);
  // Leaving mid-request would lose the result.
  useBlockBackWhile(isSigning);

  const signatureName = normaliseName(fullName);

  const handleSign = async ({ changeOrder, purchaseOrder }: ChangeOrderScreenData): Promise<void> => {
    if (isSigning) {
      return;
    }
    if (!signatureName) {
      Alert.alert('Full name required', 'Please enter your full name.');
      return;
    }
    if (!fontId) {
      Alert.alert('Signature required', 'Please select a signature style.');
      return;
    }
    const accountId = company?.accountId;
    if (!company || !accountId) {
      Alert.alert('Unable to sign', 'Your session has expired. Please log in again.');
      return;
    }

    setIsSigning(true);
    try {
      const signer = { name: signatureName, fontId };
      // The API takes the signed change order itself: the change order with this signature and date on it.
      const signedPdf = {
        fileName: signedChangeOrderFileName(changeOrder.name, company.name),
        base64: await buildChangeOrderPdfBase64(
          changeOrder,
          purchaseOrder,
          { name: company.name, address: company.address },
          { ...signer, date: todayDateString() },
        ),
      };
      const result = await signChangeOrder(accountId, changeOrder.id, signer, signedPdf);
      setData(
        (current) =>
          current && {
            ...current,
            changeOrder: { ...current.changeOrder, status: result.status, signature: result.signature },
          },
      );
      setSignedSignature(result.signature);
    } catch (error) {
      Alert.alert('Unable to sign', error instanceof Error ? error.message : 'Please try again.');
      // It may have changed since it was loaded (e.g. signed elsewhere): show its real status
      // instead of inviting a retry that can't succeed.
      refresh();
    } finally {
      setIsSigning(false);
    }
  };

  const renderSigned = (signature: ChangeOrderSignature): React.JSX.Element => (
    <>
      <AuthCard style={styles.successCard}>
        <CheckCircleIcon size={24} color={toneColors.success.foreground} />
        <Text style={styles.successTitle} accessibilityRole="header" accessibilityLiveRegion="polite">
          Change Order Signed Successfully
        </Text>
        <Text style={[styles.signedName, { fontFamily: getSignatureFontFamily(signature.fontId) }]}>
          {signature.name}
        </Text>
        <Text style={styles.signedMeta}>
          {signature.name} · Signed on {formatLongDate(signature.date)}
        </Text>
      </AuthCard>
      <AuthPrimaryButton title="Back to Change Order" onPress={() => navigation.goBack()} />
    </>
  );

  const renderSignatureForm = (screenData: ChangeOrderScreenData): React.JSX.Element => (
    <>
      <View style={styles.signatureSection}>
        <Text style={styles.sectionTitle}>Your Signature</Text>
        <LoginInput
          label="Signer Name"
          placeholder="Enter full name"
          value={fullName}
          onChangeText={setFullName}
          autoCapitalize="words"
          editable={!isSigning}
        />
        <View style={styles.dateRow}>
          <Text style={styles.sectionLabel}>Date</Text>
          <Text style={styles.dateValue}>{formatLongDate(todayDateString())}</Text>
        </View>
        <Text style={styles.sectionLabel}>Select Signature</Text>
        {!signatureName && <Text style={styles.hintText}>Enter your full name to create your signature.</Text>}
        <SignatureStylePicker
          signatureName={signatureName}
          selectedFontId={fontId}
          onSelect={setFontId}
          disabled={!signatureName || isSigning}
        />
      </View>
      <AuthPrimaryButton
        title={isSigning ? 'Signing...' : 'Sign'}
        onPress={() => handleSign(screenData)}
        disabled={isSigning || !signatureName || !fontId}
      />
    </>
  );

  const renderBody = (screenData: ChangeOrderScreenData): React.JSX.Element => {
    const { changeOrder, purchaseOrder } = screenData;
    if (signedSignature) {
      return renderSigned(signedSignature);
    }
    const stage = changeOrderStage(changeOrder);
    return (
      <>
        <ChangeOrderSummaryCard
          changeOrderName={changeOrder.name}
          purchaseOrderName={purchaseOrder.purchaseOrderName}
          status={changeOrder.status}
          amount={changeOrder.amount}
          description={changeOrder.description}
        />
        <ChangeOrderItemsCard items={changeOrder.items} />
        {stage === 'readyForSignature' ? (
          renderSignatureForm(screenData)
        ) : (
          // e.g. signed elsewhere, or its approval was withdrawn, since the previous screen loaded.
          <Text style={styles.hintText}>
            This change order isn’t ready for signature{changeOrder.status ? ` (status: ${changeOrder.status})` : ''}.
          </Text>
        )}
      </>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <HomeHeader />
      <KeyboardAwareScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <ChangeOrderHeaderCard
          title={`Sign ${data?.changeOrder.name ?? summary.name}`}
          onBackPress={() => navigation.goBack()}
          backDisabled={isSigning}
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
  signatureSection: {
    gap: 8,
  },
  sectionTitle: {
    fontFamily: fontFamily.semiBold,
    fontWeight: '600',
    fontSize: 15,
    color: welcomeColors.textPrimary,
  },
  sectionLabel: {
    fontFamily: fontFamily.semiBold,
    fontWeight: '600',
    fontSize: 12,
    color: welcomeColors.textPrimary,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dateValue: {
    fontFamily: fontFamily.regular,
    fontWeight: '400',
    fontSize: 13,
    color: welcomeColors.textSecondary,
  },
  hintText: {
    fontFamily: fontFamily.regular,
    fontWeight: '400',
    fontSize: 13,
    lineHeight: 19,
    color: welcomeColors.textSecondary,
  },
  successCard: {
    alignItems: 'center',
    paddingVertical: 20,
    gap: 8,
    backgroundColor: toneColors.success.background,
    borderColor: toneColors.success.border,
  },
  successTitle: {
    fontFamily: fontFamily.bold,
    fontWeight: '700',
    fontSize: 17,
    color: toneColors.success.foreground,
    textAlign: 'center',
  },
  signedName: {
    fontSize: 32,
    color: welcomeColors.textPrimary,
  },
  signedMeta: {
    fontFamily: fontFamily.regular,
    fontWeight: '400',
    fontSize: 13,
    color: welcomeColors.textSecondary,
  },
});
