import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import Pdf from 'react-native-pdf';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AuthCard } from '../components/AuthCard';
import { AuthCardHeader } from '../components/AuthCardHeader';
import { AuthHeader } from '../components/AuthHeader';
import { AuthPrimaryButton } from '../components/AuthPrimaryButton';
import { RegistrationProgress } from '../components/RegistrationProgress';
import { DocumentIcon } from '../assets/icons';
import { fontFamily, welcomeColors } from '../theme';
import { AuthStackParamList } from '../navigation/types';
import { generateMasterSubcontractAgreement } from '../services/masterSubcontractAgreementService';

type Props = NativeStackScreenProps<AuthStackParamList, 'MasterSubcontractorAgreement'>;

const TOTAL_STEPS = 6;
const MIN_SCALE = 1;
const MAX_SCALE = 4;

export function MasterSubcontractorAgreementScreen({ navigation, route }: Props): React.JSX.Element {
  const companyName = route.params.company.company;
  const [pdfPath, setPdfPath] = useState<string | null>(null);
  const [hasError, setHasError] = useState(false);
  const [hasReadAgreement, setHasReadAgreement] = useState(false);

  useEffect(() => {
    let isMounted = true;
    generateMasterSubcontractAgreement(companyName)
      .then((path) => {
        if (isMounted) {
          setPdfPath(path);
        }
      })
      .catch((error) => {
        console.error('Failed to prepare Master Subcontract Agreement:', error);
        if (isMounted) {
          setHasError(true);
        }
      });
    return () => {
      isMounted = false;
    };
  }, [companyName]);

  const handleContinue = (): void => {
    if (!hasReadAgreement) {
      return;
    }
    navigation.navigate('AcceptPolicyTerms', route.params);
  };

  // A fixed (non-scrolling) layout, so the PDF viewer owns every scroll,
  // pinch and pan gesture instead of competing with a parent ScrollView.
  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <View style={styles.container}>
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
            ) : pdfPath ? (
              <Pdf
                source={{ uri: `file://${pdfPath}` }}
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
                  // Continue unlocks once the user has reached the last page.
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

          {!hasReadAgreement && !hasError && (
            <Text style={styles.hintText}>Scroll to the end of the agreement to continue.</Text>
          )}

          <AuthPrimaryButton title="Continue" onPress={handleContinue} disabled={!hasReadAgreement} />
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
  hintText: {
    fontFamily: fontFamily.regular,
    fontWeight: '400',
    fontSize: 11,
    color: welcomeColors.textSecondary,
    textAlign: 'center',
    marginBottom: 10,
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
