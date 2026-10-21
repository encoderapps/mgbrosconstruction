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
import { SignatureOnFileCard } from '../components/SignatureOnFileCard';
import { CheckCircleIcon } from '../assets/icons';
import { fontFamily, toneColors, welcomeColors } from '../theme';
import { AuthStackParamList } from '../navigation/types';
import { useSubcontractorSession } from '../context/SubcontractorSessionContext';
import { useBlockBackWhile } from '../hooks/useBlockBackWhile';
import { ChangeOrderScreenData, useChangeOrderDetail } from '../hooks/useChangeOrderDetail';
import { signChangeOrder } from '../services/changeOrderService';
import { buildChangeOrderPdfBase64 } from '../services/purchaseOrderPdfService';
import { ChangeOrderSignature } from '../types/changeOrder';
import { SignatureOnFile } from '../types/purchaseOrder';
import { changeOrderStage } from '../utils/changeOrder';
import { todayDateString } from '../utils/dateValidation';
import { signedChangeOrderFileName } from '../utils/signedDocument';

type Props = NativeStackScreenProps<AuthStackParamList, 'ChangeOrderSigning'>;

/**
 * Signing a change order that's Ready For Signature: the change order, then
 * the subcontractor's signature as the API has it on file, with their full
 * name and today's date. There's nothing to fill in: Sign sends the signed
 * change order to the signChangeOrder API, and only once that succeeds is it
 * shown as signed, with the backend's signing date.
 */
export function ChangeOrderSigningScreen({ navigation, route }: Props): React.JSX.Element {
  const { poId, changeOrder: summary } = route.params;
  const company = useSubcontractorSession().company;
  const { data, status, reload, refresh, setData } = useChangeOrderDetail(poId, summary);
  const [isSigning, setIsSigning] = useState(false);
  // Set only after the API confirms the signing.
  const [signedSignature, setSignedSignature] = useState<ChangeOrderSignature | null>(null);
  // Leaving mid-request would lose the result.
  useBlockBackWhile(isSigning);

  const handleSign = async (
    { changeOrder, purchaseOrder }: ChangeOrderScreenData,
    signatureOnFile: SignatureOnFile,
  ): Promise<void> => {
    if (isSigning) {
      return;
    }
    const accountId = company?.accountId;
    if (!company || !accountId) {
      Alert.alert('Unable to sign', 'Your session has expired. Please log in again.');
      return;
    }

    setIsSigning(true);
    try {
      const signer = { name: signatureOnFile.name, imageBase64: signatureOnFile.imageBase64 };
      // The API takes the signed change order itself: the change order with this signature and date on it.
      const signedPdf = {
        fileName: signedChangeOrderFileName(changeOrder.name, company.name),
        base64: await buildChangeOrderPdfBase64(
          changeOrder,
          purchaseOrder,
          { name: company.name, address: company.address },
          { ...signer, fontId: null, date: todayDateString() },
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

  const renderSigned = (
    { changeOrder, purchaseOrder }: ChangeOrderScreenData,
    signature: ChangeOrderSignature,
  ): React.JSX.Element => (
    <>
      <AuthCard style={styles.successCard}>
        <CheckCircleIcon size={24} color={toneColors.success.foreground} />
        <Text style={styles.successTitle} accessibilityRole="header" accessibilityLiveRegion="polite">
          Change Order Signed Successfully
        </Text>
      </AuthCard>
      {/* Its status as the sign API reported it, e.g. "Signed". */}
      <ChangeOrderSummaryCard
        changeOrderName={changeOrder.name}
        purchaseOrderName={purchaseOrder.purchaseOrderName}
        status={changeOrder.status}
        amount={changeOrder.amount}
      />
      <SignatureOnFileCard name={signature.name} imageBase64={signature.imageBase64} date={signature.date} />
      <AuthPrimaryButton title="Back to Change Order" onPress={() => navigation.goBack()} />
    </>
  );

  const renderSignatureSection = (screenData: ChangeOrderScreenData): React.JSX.Element => {
    const { signatureOnFile } = screenData;
    if (!signatureOnFile) {
      return (
        <Text style={styles.hintText}>
          Your signature is not on file, so this change order can’t be signed in the app yet. Please contact MG Bros.
        </Text>
      );
    }
    return (
      <>
        <View style={styles.signatureSection}>
          <Text style={styles.sectionTitle}>Your Signature</Text>
          <SignatureOnFileCard
            name={signatureOnFile.name}
            imageBase64={signatureOnFile.imageBase64}
            date={todayDateString()}
          />
          <Text style={styles.hintText}>This is the signature you created when you registered.</Text>
        </View>
        <AuthPrimaryButton
          title={isSigning ? 'Signing...' : 'Sign'}
          onPress={() => handleSign(screenData, signatureOnFile)}
          disabled={isSigning}
        />
      </>
    );
  };

  const renderBody = (screenData: ChangeOrderScreenData): React.JSX.Element => {
    const { changeOrder, purchaseOrder } = screenData;
    if (signedSignature) {
      return renderSigned(screenData, signedSignature);
    }
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
        {changeOrderStage(changeOrder) === 'readyForSignature' ? (
          renderSignatureSection(screenData)
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
});
