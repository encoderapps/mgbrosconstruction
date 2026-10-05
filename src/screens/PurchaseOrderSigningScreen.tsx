import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Alert, BackHandler, LayoutChangeEvent, Pressable, StyleSheet, Text, View } from 'react-native';
import Pdf from 'react-native-pdf';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CommonActions } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AuthPrimaryButton } from '../components/AuthPrimaryButton';
import { HomeHeader } from '../components/HomeHeader';
import { KeyboardAwareScrollView } from '../components/KeyboardAwareScrollView';
import { LoginInput } from '../components/LoginInput';
import { SignatureStyleOption } from '../components/SignatureStyleOption';
import { BagIcon, CheckCircleIcon, ChevronRightIcon } from '../assets/icons';
import { SIGNATURE_FONTS, SignatureFontId } from '../constants/signatureFonts';
import { fontFamily, radius, toneColors, welcomeColors } from '../theme';
import { AuthStackParamList } from '../navigation/types';
import { useSubcontractorSession } from '../context/SubcontractorSessionContext';
import { usePurchaseOrderDetail } from '../hooks/usePurchaseOrderDetail';
import { deletePurchaseOrderPdf, generatePurchaseOrderPdf } from '../services/purchaseOrderPdfService';
import { PurchaseOrderSignature } from '../types/purchaseOrder';
import { savePurchaseOrderSignature } from '../services/purchaseOrderSignatureStore';
import { signPurchaseOrder } from '../services/signPurchaseOrderService';
import { todayDateString } from '../utils/dateValidation';
import { formatLongDate } from '../utils/formatDate';
import { isAwaitingSignature, isSigned } from '../utils/purchaseOrderStatus';

type Props = NativeStackScreenProps<AuthStackParamList, 'PurchaseOrderSigning'>;

/** Gap between PDF pages, in the viewer's points. */
const PAGE_SPACING = 8;
/** US Letter (612 × 792 pt), used until the viewer reports the real page size. */
const DEFAULT_PAGE_ASPECT_RATIO = 792 / 612;

/**
 * Opened from Sign PO on the review screen: the PO as a PDF, then the
 * signer's full name and one of three signature styles. Sign calls the
 * signPurchaseOrder API; only once it succeeds is the PDF redrawn with the
 * vendor signature and today's date and the PO shown as signed.
 */
export function PurchaseOrderSigningScreen({ navigation, route }: Props): React.JSX.Element {
  const { poId, poDate } = route.params;
  const { company } = useSubcontractorSession();
  const { data: purchaseOrder, status, reload, refresh, setData } = usePurchaseOrderDetail(poId, poDate);

  const [fullName, setFullName] = useState('');
  const [signatureFont, setSignatureFont] = useState<SignatureFontId | null>(null);
  const [isSigning, setIsSigning] = useState(false);
  // Set only after the API confirms the signing.
  const [signedSignature, setSignedSignature] = useState<PurchaseOrderSignature | null>(null);

  const [pdfPath, setPdfPath] = useState<string | null>(null);
  const [pdfAttempt, setPdfAttempt] = useState(0);
  const [hasPdfError, setHasPdfError] = useState(false);
  // The PDF is drawn at its full height (the screen scrolls, not the PDF), which
  // needs its width on screen and its page count and shape.
  const [pdfWidth, setPdfWidth] = useState(0);
  const [pdfLayout, setPdfLayout] = useState({ pageCount: 1, pageAspectRatio: DEFAULT_PAGE_ASPECT_RATIO });
  const isMountedRef = useRef(true);
  const pdfHeight =
    pdfWidth * pdfLayout.pageAspectRatio * pdfLayout.pageCount + PAGE_SPACING * (pdfLayout.pageCount - 1);

  const signatureName = fullName.trim().replace(/\s+/g, ' ');
  const hasName = signatureName.length > 0;
  const canSign = !signedSignature && !!purchaseOrder && isAwaitingSignature(purchaseOrder.status);

  // Stable, so the PDF isn't rebuilt on every render.
  const vendor = useMemo(
    () => ({ name: company?.name ?? '', address: company?.address ?? '' }),
    [company?.name, company?.address],
  );

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Builds the PDF once the PO has loaded, and again with the signature after signing. A PO
  // signed earlier on this device shows the signature saved then.
  useEffect(() => {
    if (!purchaseOrder) {
      return;
    }
    let isCancelled = false;
    setHasPdfError(false);
    generatePurchaseOrderPdf(purchaseOrder, vendor, purchaseOrder.vendorSignature ?? undefined)
      .then((path) => {
        if (isCancelled) {
          deletePurchaseOrderPdf(path);
          return;
        }
        setPdfPath(path);
      })
      .catch((error) => {
        console.error('Failed to generate the purchase order PDF:', error);
        if (!isCancelled) {
          setHasPdfError(true);
        }
      });
    return () => {
      isCancelled = true;
    };
  }, [purchaseOrder, vendor, pdfAttempt]);

  // Deletes each generated file once it's replaced or the screen closes.
  useEffect(
    () => () => {
      if (pdfPath) {
        deletePurchaseOrderPdf(pdfPath);
      }
    },
    [pdfPath],
  );
  const pdfSource = useMemo(() => (pdfPath ? { uri: `file://${pdfPath}` } : null), [pdfPath]);

  // Don't let the user leave mid-request (Android back, iOS swipe), so the result is never lost.
  useEffect(() => {
    navigation.setOptions({ gestureEnabled: !isSigning });
    if (!isSigning) {
      return;
    }
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => true);
    return () => subscription.remove();
  }, [isSigning, navigation]);

  /** Shows the new status on the review screen underneath straight away (it also re-fetches on return). */
  const updateReviewScreen = (newStatus: string, signedDate: string): void => {
    const reviewRoute = navigation
      .getState()
      .routes.find(
        (stackRoute) =>
          stackRoute.name === 'PurchaseOrderDetails' &&
          (stackRoute.params as AuthStackParamList['PurchaseOrderDetails'] | undefined)?.poId === poId,
      );
    if (reviewRoute) {
      navigation.dispatch({ ...CommonActions.setParams({ updatedStatus: newStatus, signedDate }), source: reviewRoute.key });
    }
  };

  const handleSign = async (): Promise<void> => {
    if (isSigning || !canSign) {
      return;
    }
    if (!hasName) {
      Alert.alert('Full name required', 'Please enter your full name.');
      return;
    }
    if (!signatureFont) {
      Alert.alert('Signature required', 'Please select a signature.');
      return;
    }
    const accountId = company?.accountId;
    if (!accountId) {
      Alert.alert('Unable to sign', 'Your session has expired. Please log in again.');
      return;
    }

    setIsSigning(true);
    try {
      const result = await signPurchaseOrder(accountId, poId);
      const signature: PurchaseOrderSignature = { name: signatureName, fontId: signatureFont, date: todayDateString() };
      const signedDate = signature.date;
      // Kept on the device, since the API doesn't store it; if saving fails, only later views lose it.
      savePurchaseOrderSignature(poId, signature).catch((error) =>
        console.error('Failed to save the purchase order signature:', error),
      );
      if (!isMountedRef.current) {
        return;
      }
      setData(
        (current) => current && { ...current, status: result.status, signedDate, vendorSignature: signature },
      );
      setSignedSignature(signature);
      updateReviewScreen(result.status, signedDate);
    } catch (error) {
      if (isMountedRef.current) {
        Alert.alert(
          'Unable to sign',
          error instanceof Error ? error.message : 'Unable to sign the purchase order. Please try again.',
        );
        // The PO may have changed since it was loaded (e.g. "cannot be signed because its current
        // status is Signed"): re-check it, so the form is replaced by its real status instead of
        // inviting a retry that can't succeed.
        refresh();
      }
    } finally {
      if (isMountedRef.current) {
        setIsSigning(false);
      }
    }
  };

  const handlePdfWrapperLayout = (event: LayoutChangeEvent): void => {
    // The wrapper's 1pt border on each side isn't room for the PDF.
    const width = Math.floor(event.nativeEvent.layout.width - 2);
    setPdfWidth((current) => (current === width ? current : width));
  };

  const renderPdf = (): React.JSX.Element => {
    if (hasPdfError) {
      return (
        <View style={styles.messageBox}>
          <Text style={styles.messageText}>Unable to display the purchase order.</Text>
          <Pressable onPress={() => setPdfAttempt((attempt) => attempt + 1)} hitSlop={8} accessibilityRole="button">
            <Text style={styles.retryText}>Try again</Text>
          </Pressable>
        </View>
      );
    }
    if (!pdfSource || pdfWidth === 0) {
      return <ActivityIndicator style={styles.pdfLoading} color={welcomeColors.accent} />;
    }
    // Every page is laid out at full size and the viewer itself never scrolls or
    // zooms, so the screen's scroll moves through the whole document.
    return (
      <Pdf
        source={pdfSource}
        style={[styles.pdf, { width: pdfWidth, height: pdfHeight }]}
        fitPolicy={0}
        minScale={1}
        maxScale={1}
        scrollEnabled={false}
        spacing={PAGE_SPACING}
        trustAllCerts={false}
        onLoadComplete={(pageCount, _path, size) => {
          setPdfLayout({
            pageCount: Math.max(1, pageCount),
            pageAspectRatio: size.width > 0 ? size.height / size.width : DEFAULT_PAGE_ASPECT_RATIO,
          });
        }}
        renderActivityIndicator={() => <ActivityIndicator color={welcomeColors.accent} />}
        onError={(error) => {
          console.error('Failed to render the purchase order PDF:', error);
          setHasPdfError(true);
        }}
      />
    );
  };

  const renderSignatureSection = (): React.JSX.Element | null => {
    if (signedSignature || !purchaseOrder) {
      return null;
    }
    if (isSigned(purchaseOrder.status)) {
      // Opened from a signed PO's document link: just the document.
      return null;
    }
    if (!canSign) {
      // e.g. it was signed elsewhere since the review screen was opened.
      return (
        <Text style={styles.hintText}>
          This purchase order is not awaiting your signature
          {purchaseOrder.status ? ` (status: ${purchaseOrder.status})` : ''}.
        </Text>
      );
    }
    return (
      <>
        <View style={styles.signatureSection}>
          <Text style={styles.sectionTitle}>Your Signature</Text>
          <LoginInput
            label="Full Name"
            placeholder="Enter full name"
            value={fullName}
            onChangeText={setFullName}
            autoCapitalize="words"
          />
          <Text style={styles.sectionLabel}>Select Signature</Text>
          {!hasName && <Text style={styles.hintText}>Enter your full name to create your signature.</Text>}
          <View accessibilityRole="radiogroup">
            {SIGNATURE_FONTS.map((font) => (
              <SignatureStyleOption
                key={font.id}
                font={font}
                signatureName={signatureName}
                isSelected={signatureFont === font.id}
                disabled={!hasName || isSigning}
                onSelect={() => setSignatureFont(font.id)}
              />
            ))}
          </View>
        </View>
        <AuthPrimaryButton
          title={isSigning ? 'Signing...' : 'Sign'}
          onPress={handleSign}
          disabled={isSigning}
          style={styles.signButton}
        />
      </>
    );
  };

  const renderBody = (): React.JSX.Element => {
    if (status === 'idle' || status === 'loading') {
      return <ActivityIndicator style={styles.loading} color={welcomeColors.accent} />;
    }
    if (status === 'error' || !purchaseOrder) {
      return (
        <View style={styles.messageBox}>
          <Text style={styles.messageText}>Unable to load this purchase order.</Text>
          <Pressable onPress={reload} hitSlop={8} accessibilityRole="button">
            <Text style={styles.retryText}>Try again</Text>
          </Pressable>
        </View>
      );
    }
    // Just signed here, or opened later from a signed PO's document link: both show the signed
    // state. The signing date (and the PDF's signature) are only known for POs signed on this device.
    const isPurchaseOrderSigned = !!signedSignature || isSigned(purchaseOrder.status);
    const signedOn = signedSignature?.date ?? purchaseOrder.signedDate;
    return (
      <>
        {isPurchaseOrderSigned && (
          <View style={styles.successBanner} accessibilityLiveRegion="polite">
            <CheckCircleIcon size={22} color={toneColors.success.foreground} />
            <Text style={styles.successTitle}>PO Signed Successfully!</Text>
            {signedOn && (
              <View style={styles.signedOn}>
                <Text style={styles.signedOnLabel}>Signed On</Text>
                <Text style={styles.signedOnDate}>{formatLongDate(signedOn)}</Text>
              </View>
            )}
          </View>
        )}
        <View style={styles.pdfWrapper} onLayout={handlePdfWrapperLayout}>
          {renderPdf()}
        </View>
        {renderSignatureSection()}
      </>
    );
  };

  // One scrolling page: the whole PDF, then the signature section; the scroll
  // view keeps the name field above the keyboard.
  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <HomeHeader />
      <KeyboardAwareScrollView contentContainerStyle={styles.container}>
        <View style={styles.titleRow}>
          <Pressable
            onPress={() => navigation.goBack()}
            disabled={isSigning}
            hitSlop={10}
            style={styles.backButton}
            accessibilityRole="button"
            accessibilityLabel="Back"
          >
            <ChevronRightIcon size={16} color={welcomeColors.textPrimary} />
          </Pressable>
          <View style={styles.iconCircle}>
            <BagIcon size={18} color={welcomeColors.accent} />
          </View>
          <Text style={styles.title} numberOfLines={1}>
            {purchaseOrder?.name ?? ''}
          </Text>
        </View>
        {renderBody()}
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
    paddingBottom: 16,
    gap: 10,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: welcomeColors.cardBackground,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: welcomeColors.cardBorder,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  backButton: {
    transform: [{ rotate: '180deg' }],
  },
  iconCircle: {
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
  successBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: welcomeColors.cardBackground,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: welcomeColors.cardBorder,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  successTitle: {
    flex: 1,
    fontFamily: fontFamily.semiBold,
    fontWeight: '600',
    fontSize: 15,
    color: welcomeColors.accent,
    textAlign: 'center',
  },
  signedOn: {
    alignItems: 'flex-start',
  },
  signedOnLabel: {
    fontFamily: fontFamily.regular,
    fontWeight: '400',
    fontSize: 11,
    color: welcomeColors.textSecondary,
  },
  signedOnDate: {
    fontFamily: fontFamily.medium,
    fontWeight: '500',
    fontSize: 14,
    color: welcomeColors.textPrimary,
  },
  pdfWrapper: {
    minHeight: 160,
    justifyContent: 'center',
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: welcomeColors.cardBorder,
    backgroundColor: welcomeColors.cardBackground,
    overflow: 'hidden',
  },
  pdf: {
    backgroundColor: welcomeColors.cardBackground,
  },
  pdfLoading: {
    paddingVertical: 32,
  },
  signatureSection: {
    marginTop: 6,
  },
  sectionTitle: {
    fontFamily: fontFamily.semiBold,
    fontWeight: '600',
    fontSize: 13,
    lineHeight: 18,
    color: welcomeColors.textPrimary,
    marginBottom: 10,
  },
  sectionLabel: {
    fontFamily: fontFamily.semiBold,
    fontWeight: '600',
    fontSize: 11,
    lineHeight: 16.5,
    color: welcomeColors.textPrimary,
    marginBottom: 6,
  },
  hintText: {
    fontFamily: fontFamily.regular,
    fontWeight: '400',
    fontSize: 11,
    color: welcomeColors.textSecondary,
    textAlign: 'center',
    marginBottom: 10,
  },
  signButton: {
    marginTop: 2,
  },
  loading: {
    marginTop: 32,
  },
  messageBox: {
    alignItems: 'center',
    gap: 6,
    marginTop: 32,
  },
  messageText: {
    fontFamily: fontFamily.regular,
    fontWeight: '400',
    fontSize: 13,
    color: welcomeColors.textSecondary,
    textAlign: 'center',
  },
  retryText: {
    fontFamily: fontFamily.semiBold,
    fontWeight: '600',
    fontSize: 13,
    color: welcomeColors.link,
  },
});
