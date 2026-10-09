import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AuthCard } from '../components/AuthCard';
import { AuthHeader } from '../components/AuthHeader';
import { AuthPrimaryButton } from '../components/AuthPrimaryButton';
import { RegistrationProgress } from '../components/RegistrationProgress';
import { ZoomablePdf } from '../components/ZoomablePdf';
import { fontFamily, welcomeColors } from '../theme';
import { AuthStackParamList } from '../navigation/types';
import { getCertificateTemplatePath } from '../services/certificateTemplateService';

type Props = NativeStackScreenProps<AuthStackParamList, 'TemplatePreview'>;

const TOTAL_STEPS = 6;

export function TemplatePreviewScreen({ navigation, route }: Props): React.JSX.Element {
  const { title, template, currentStep } = route.params;
  const [pdfPath, setPdfPath] = useState<string | null>(null);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    let isMounted = true;
    getCertificateTemplatePath(template)
      .then((path) => {
        if (isMounted) {
          setPdfPath(path);
        }
      })
      .catch((error) => {
        console.error(`Failed to load ${title}:`, error);
        if (isMounted) {
          setHasError(true);
        }
      });
    return () => {
      isMounted = false;
    };
  }, [template, title]);

  const handlePdfError = useCallback(
    (error: object) => {
      console.error(`Failed to render ${title} PDF:`, error);
      setHasError(true);
    },
    [title],
  );

  // A fixed (non-scrolling) layout, so the PDF viewer owns every scroll,
  // pinch and pan gesture instead of competing with a parent ScrollView.
  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <View style={styles.container}>
        <AuthHeader />

        <RegistrationProgress totalSteps={TOTAL_STEPS} currentStep={currentStep} />

        <AuthCard style={styles.card}>
          <Text style={styles.title}>{title}</Text>

          <View style={styles.pdfWrapper}>
            {hasError ? (
              <Text style={styles.errorText}>Unable to display the template. Please try again.</Text>
            ) : pdfPath ? (
              <ZoomablePdf path={pdfPath} style={styles.pdf} onError={handlePdfError} />
            ) : (
              <ActivityIndicator color={welcomeColors.accent} />
            )}
          </View>

          <AuthPrimaryButton title="Back" onPress={() => navigation.goBack()} />
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
  title: {
    fontFamily: fontFamily.semiBold,
    fontWeight: '600',
    fontSize: 13,
    lineHeight: 18,
    color: welcomeColors.textPrimary,
    marginBottom: 12,
  },
  pdfWrapper: {
    flex: 1,
    justifyContent: 'center',
    marginBottom: 16,
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
  errorText: {
    fontFamily: fontFamily.regular,
    fontWeight: '400',
    fontSize: 12,
    color: welcomeColors.textSecondary,
    textAlign: 'center',
    padding: 16,
  },
});
