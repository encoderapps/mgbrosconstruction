import React, { useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import Pdf from 'react-native-pdf';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AuthCard } from '../components/AuthCard';
import { AuthPrimaryButton } from '../components/AuthPrimaryButton';
import { HomeHeader } from '../components/HomeHeader';
import { LoginInput } from '../components/LoginInput';
import { ScreenTitleBar } from '../components/ScreenTitleBar';
import { SignatureStyleOption } from '../components/SignatureStyleOption';
import { fontFamily, welcomeColors } from '../theme';
import { AuthStackParamList } from '../navigation/types';
import { COMPLIANCE_DOCUMENT_INFO } from '../constants/complianceDocuments';
import { SIGNATURE_FONTS, SignatureFontId } from '../constants/signatureFonts';
import { useSubcontractorSession } from '../context/SubcontractorSessionContext';
import { useBlockBackWhile } from '../hooks/useBlockBackWhile';
import { useKeyboardHeight } from '../hooks/useKeyboardHeight';
import { useMasterAgreementPdf } from '../hooks/useMasterAgreementPdf';
import { uploadComplianceDocument } from '../services/complianceDocumentService';
import { buildMasterSubcontractAgreementBase64 } from '../services/masterSubcontractAgreementService';
import { todayDateString } from '../utils/dateValidation';
import { getInitials } from '../utils/signature';

type Props = NativeStackScreenProps<AuthStackParamList, 'SignMasterSubcontractAgreement'>;

const MIN_SCALE = 1;
const MAX_SCALE = 4;
const { title: AGREEMENT_TITLE } = COMPLIANCE_DOCUMENT_INFO.masterSubcontractAgreement;

/**
 * Documents → + on the Master Subcontract Agreement: the same agreement as at
 * registration, filled in with the company's name. Once the user has scrolled
 * to the end they sign it (their name in a chosen style, started from the
 * signature they registered with), and Submit uploads the signed agreement as
 * the new MSA, signed today.
 */
export function SignMasterSubcontractAgreementScreen({ navigation }: Props): React.JSX.Element {
  const { company, signature } = useSubcontractorSession();
  const companyName = company?.name ?? '';
  const insets = useSafeAreaInsets();
  const keyboardHeight = useKeyboardHeight();
  const [hasReadAgreement, setHasReadAgreement] = useState(false);
  const [fullName, setFullName] = useState(signature?.name ?? '');
  const [signatureFont, setSignatureFont] = useState<SignatureFontId | null>(signature?.fontId ?? null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  // Leaving mid-upload would lose the result (and goBack would then pop Documents instead).
  useBlockBackWhile(isSubmitting);

  const signatureName = fullName.trim().replace(/\s+/g, ' ');
  const initials = getInitials(signatureName);
  const hasName = signatureName.length > 0;

  const { pdf, pdfSource, hasError, setHasError, currentPageRef } = useMasterAgreementPdf(
    companyName,
    signatureName,
    signatureFont,
  );

  const handleSubmit = async (): Promise<void> => {
    if (!hasReadAgreement || isSubmitting) {
      return;
    }
    if (!hasName) {
      Alert.alert('Missing full name', 'Please enter your full name to sign the agreement.');
      return;
    }
    if (!signatureFont) {
      Alert.alert('Missing signature', 'Please choose a signature style.');
      return;
    }
    if (!company) {
      Alert.alert('Unable to submit', 'Your account could not be found. Please log in again.');
      return;
    }

    setIsSubmitting(true);
    try {
      // Signed today: that's the signed date, on the agreement and sent with it.
      const signedDate = todayDateString();
      const fileBase64 = await buildMasterSubcontractAgreementBase64(companyName, {
        name: signatureName,
        initials,
        fontId: signatureFont,
        date: signedDate,
      });
      const message = await uploadComplianceDocument({
        accountId: company.accountId,
        type: 'masterSubcontractAgreement',
        fileBase64,
        dates: { signedDate },
      });
      // Documents reloads when it's shown again, picking up the new copy.
      Alert.alert('Agreement submitted', message, [{ text: 'OK', onPress: () => navigation.goBack() }]);
    } catch (error) {
      Alert.alert('Unable to submit', error instanceof Error ? error.message : 'Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderAgreement = (): React.JSX.Element => {
    if (hasError) {
      return <Text style={styles.errorText}>Unable to display the agreement. Please try again.</Text>;
    }
    if (!pdf || !pdfSource) {
      return <ActivityIndicator color={welcomeColors.accent} />;
    }
    return (
      <Pdf
        source={pdfSource}
        page={pdf.page}
        style={styles.pdf}
        fitPolicy={0}
        minScale={MIN_SCALE}
        maxScale={MAX_SCALE}
        spacing={8}
        trustAllCerts={false}
        onLoadComplete={(numberOfPages) => {
          if (numberOfPages <= 1) {
            setHasReadAgreement(true);
          }
        }}
        // A tap opens the agreement full screen, to read and zoom it more easily.
        onPageSingleTap={() => navigation.navigate('TemplatePreview', { title: AGREEMENT_TITLE, path: pdf.path })}
        onPageChanged={(page, numberOfPages) => {
          currentPageRef.current = page;
          // The signature section unlocks once the user has reached the last page.
          if (page >= numberOfPages) {
            setHasReadAgreement(true);
          }
        }}
        renderActivityIndicator={() => <ActivityIndicator color={welcomeColors.accent} />}
        onError={(error) => {
          console.error('Failed to render Master Subcontract Agreement PDF:', error);
          setHasError(true);
        }}
      />
    );
  };

  // The screen doesn't scroll (so the PDF owns its gestures) and the Android
  // window doesn't resize for the keyboard, so lift the layout above it.
  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <HomeHeader />
      <View
        style={[
          styles.container,
          keyboardHeight > 0 && { paddingBottom: 16 + Math.max(0, keyboardHeight - insets.bottom) },
        ]}
      >
        <ScreenTitleBar title={AGREEMENT_TITLE} onBackPress={() => navigation.goBack()} backDisabled={isSubmitting} />

        <AuthCard style={styles.card}>
          <View style={styles.pdfWrapper}>{renderAgreement()}</View>

          {hasReadAgreement ? (
            <ScrollView style={styles.signaturePanel} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
              <Text style={styles.sectionTitle}>Signature</Text>

              <LoginInput
                label="Full Name"
                placeholder="Enter your full name"
                value={fullName}
                onChangeText={setFullName}
                autoCapitalize="words"
                editable={!isSubmitting}
              />

              <Text style={styles.sectionLabel}>Choose Signature Style</Text>
              {!hasName && <Text style={styles.hintText}>Enter your full name to create your signature.</Text>}

              {SIGNATURE_FONTS.map((font) => (
                <SignatureStyleOption
                  key={font.id}
                  font={font}
                  signatureName={signatureName}
                  initials={initials}
                  isSelected={signatureFont === font.id}
                  disabled={!hasName || isSubmitting}
                  onSelect={() => setSignatureFont(font.id)}
                />
              ))}
            </ScrollView>
          ) : (
            !hasError && (
              <Text style={styles.hintText}>Scroll to the end of the agreement to sign it. Tap it to view full screen.</Text>
            )
          )}

          <AuthPrimaryButton
            title={isSubmitting ? 'Submitting…' : 'Submit'}
            onPress={handleSubmit}
            disabled={!hasReadAgreement || isSubmitting}
            style={styles.submitButton}
          />
        </AuthCard>
      </View>
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
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 16,
    gap: 12,
  },
  card: {
    flex: 1,
  },
  pdfWrapper: {
    flex: 1,
    minHeight: 140,
    justifyContent: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: welcomeColors.cardBorder,
    backgroundColor: welcomeColors.cardBackground,
    overflow: 'hidden',
  },
  pdf: {
    flex: 1,
    width: '100%',
    backgroundColor: welcomeColors.cardBackground,
  },
  signaturePanel: {
    flexGrow: 0,
    maxHeight: 300,
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
  submitButton: {
    marginTop: 4,
  },
  errorText: {
    fontFamily: fontFamily.regular,
    fontWeight: '400',
    fontSize: 12,
    color: welcomeColors.textSecondary,
    textAlign: 'center',
    padding: 16,
  },
});
