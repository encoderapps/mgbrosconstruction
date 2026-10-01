import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import Pdf from 'react-native-pdf';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AuthCard } from '../components/AuthCard';
import { AuthCardHeader } from '../components/AuthCardHeader';
import { AuthHeader } from '../components/AuthHeader';
import { AuthPrimaryButton } from '../components/AuthPrimaryButton';
import { LoginInput } from '../components/LoginInput';
import { RegistrationProgress } from '../components/RegistrationProgress';
import { SignatureStyleOption } from '../components/SignatureStyleOption';
import { DocumentIcon } from '../assets/icons';
import { fontFamily, welcomeColors } from '../theme';
import { AuthStackParamList } from '../navigation/types';
import { SIGNATURE_FONTS, SignatureFontId } from '../constants/signatureFonts';
import { useKeyboardHeight } from '../hooks/useKeyboardHeight';
import {
  deleteMasterSubcontractAgreement,
  generateMasterSubcontractAgreement,
} from '../services/masterSubcontractAgreementService';
import { getInitials } from '../utils/signature';
import { todayDateString } from '../utils/dateValidation';

type Props = NativeStackScreenProps<AuthStackParamList, 'MasterSubcontractorAgreement'>;

const TOTAL_STEPS = 6;
const MIN_SCALE = 1;
const MAX_SCALE = 4;
const SIGNATURE_DEBOUNCE_MS = 600;

export function MasterSubcontractorAgreementScreen({ navigation, route }: Props): React.JSX.Element {
  const companyName = route.params.company.company;
  const insets = useSafeAreaInsets();
  // The PDF and the page to open it at change together, only when a new PDF is
  // generated. react-native-pdf reloads the whole document on any prop change,
  // so the page shown while scrolling is tracked in a ref, not passed back as a
  // prop — reloading mid-scroll crashes its native renderer.
  const [pdf, setPdf] = useState<{ path: string; page: number } | null>(null);
  const currentPageRef = useRef(1);
  const [hasError, setHasError] = useState(false);
  const [hasReadAgreement, setHasReadAgreement] = useState(false);
  const [fullName, setFullName] = useState('');
  const [signatureFont, setSignatureFont] = useState<SignatureFontId | null>(null);
  const keyboardHeight = useKeyboardHeight();
  const hasPdfRef = useRef(false);

  const signatureName = fullName.trim().replace(/\s+/g, ' ');
  const initials = getInitials(signatureName);
  const hasName = signatureName.length > 0;

  // The signature on the "By:" line changes with every keystroke, so wait for
  // the user to pause typing before regenerating the PDF with it.
  const [debouncedName, setDebouncedName] = useState(signatureName);
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedName(signatureName), SIGNATURE_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [signatureName]);

  // The PDF only carries a signature once there's both a name and a style, so
  // typing a name before choosing a style (or vice versa) doesn't regenerate it.
  const signedName = signatureFont ? debouncedName : '';
  const signedFont = debouncedName ? signatureFont : null;

  // (Re)generate the agreement: the company name always, plus — once the user
  // has entered a name and chosen a style — their initials on every page and
  // their signature and today's date on page 10.
  useEffect(() => {
    let isCancelled = false;
    const signature =
      signedName && signedFont
        ? { name: signedName, initials: getInitials(signedName), fontId: signedFont, date: todayDateString() }
        : undefined;
    generateMasterSubcontractAgreement(companyName, signature)
      .then((path) => {
        if (isCancelled) {
          // Superseded by a newer request, or the screen has closed.
          deleteMasterSubcontractAgreement(path);
          return;
        }
        // Keep the user's place when the PDF is regenerated with new initials.
        hasPdfRef.current = true;
        setHasError(false);
        setPdf({ path, page: currentPageRef.current });
      })
      .catch((error) => {
        console.error('Failed to prepare Master Subcontract Agreement:', error);
        if (isCancelled) {
          return;
        }
        if (hasPdfRef.current) {
          // Only re-signing failed: keep showing the agreement already loaded.
          Alert.alert('Unable to add signature', 'Your signature could not be added to the agreement preview.');
        } else {
          setHasError(true);
        }
      });
    return () => {
      isCancelled = true;
    };
  }, [companyName, signedName, signedFont]);

  // Delete each generated file once the viewer has moved on to a newer one (or the screen closes).
  const pdfPath = pdf?.path;
  useEffect(() => {
    return () => {
      if (pdfPath) {
        deleteMasterSubcontractAgreement(pdfPath);
      }
    };
  }, [pdfPath]);

  const pdfSource = useMemo(() => (pdfPath ? { uri: `file://${pdfPath}` } : null), [pdfPath]);

  const handleContinue = (): void => {
    if (!hasReadAgreement) {
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
    navigation.navigate('AcceptPolicyTerms', {
      ...route.params,
      signature: { signatureName, signatureFont, signatureInitials: initials, signatureDate: todayDateString() },
    });
  };

  // The screen doesn't scroll (so the PDF owns its gestures) and the Android
  // window doesn't resize for the keyboard, so lift the layout above it.
  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <View
        style={[
          styles.container,
          keyboardHeight > 0 && { paddingBottom: 20 + Math.max(0, keyboardHeight - insets.bottom) },
        ]}
      >
        <AuthHeader />

        <RegistrationProgress totalSteps={TOTAL_STEPS} currentStep={6} />

        <AuthCard style={styles.card}>
          <AuthCardHeader
            icon={<DocumentIcon size={18} color={welcomeColors.accent} />}
            title="Master Subcontractor Agreement"
            subtitle="Sign Master Subcontract Agreement"
          />

          <View style={styles.pdfWrapper}>
            {hasError ? (
              <Text style={styles.errorText}>Unable to display the agreement. Please try again.</Text>
            ) : pdf && pdfSource ? (
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
            ) : (
              <ActivityIndicator color={welcomeColors.accent} />
            )}
          </View>

          {hasReadAgreement ? (
            <ScrollView
              style={styles.signaturePanel}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              <Text style={styles.sectionTitle}>Signature</Text>

              <LoginInput
                label="Full Name"
                placeholder="Enter your full name"
                value={fullName}
                onChangeText={setFullName}
                autoCapitalize="words"
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
                  disabled={!hasName}
                  onSelect={() => setSignatureFont(font.id)}
                />
              ))}
            </ScrollView>
          ) : (
            !hasError && <Text style={styles.hintText}>Scroll to the end of the agreement to sign it.</Text>
          )}

          <AuthPrimaryButton
            title="Continue"
            onPress={handleContinue}
            disabled={!hasReadAgreement}
            style={styles.continueButton}
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
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 40,
    paddingBottom: 20,
    gap: 24,
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
  continueButton: {
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
