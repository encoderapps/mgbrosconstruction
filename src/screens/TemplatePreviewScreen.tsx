import React, { useState } from 'react';
import { ActivityIndicator, LayoutChangeEvent, StyleSheet, Text, View } from 'react-native';
import Pdf from 'react-native-pdf';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AuthCard } from '../components/AuthCard';
import { AuthHeader } from '../components/AuthHeader';
import { AuthPrimaryButton } from '../components/AuthPrimaryButton';
import { AuthScreenLayout } from '../components/AuthScreenLayout';
import { RegistrationProgress } from '../components/RegistrationProgress';
import { fontFamily, welcomeColors } from '../theme';
import { AuthStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<AuthStackParamList, 'TemplatePreview'>;

const TOTAL_STEPS = 6;
// The ACORD certificate templates are US Letter portrait (8.5in x 11in).
const PAGE_ASPECT_RATIO = 11 / 8.5;

export function TemplatePreviewScreen({ navigation, route }: Props): React.JSX.Element {
  const { title, pdfPath, currentStep } = route.params;
  const [pdfWidth, setPdfWidth] = useState(0);
  const [hasError, setHasError] = useState(false);

  const handlePdfLayout = (event: LayoutChangeEvent): void => {
    setPdfWidth(event.nativeEvent.layout.width);
  };

  return (
    <AuthScreenLayout>
      <AuthHeader />

      <RegistrationProgress totalSteps={TOTAL_STEPS} currentStep={currentStep} />

      <AuthCard>
        <Text style={styles.title}>{title}</Text>

        <View
          style={[styles.pdfWrapper, pdfWidth > 0 && { height: pdfWidth * PAGE_ASPECT_RATIO }]}
          onLayout={handlePdfLayout}
        >
          {hasError ? (
            <Text style={styles.errorText}>Unable to display the template. Please try again.</Text>
          ) : (
            pdfWidth > 0 && (
              <Pdf
                source={{ uri: `file://${pdfPath}` }}
                style={styles.pdf}
                fitPolicy={0}
                singlePage
                trustAllCerts={false}
                renderActivityIndicator={() => <ActivityIndicator color={welcomeColors.accent} />}
                onError={(error) => {
                  console.error('Failed to render template PDF:', error);
                  setHasError(true);
                }}
              />
            )
          )}
        </View>

        <AuthPrimaryButton title="Back" onPress={() => navigation.goBack()} />
      </AuthCard>
    </AuthScreenLayout>
  );
}

const styles = StyleSheet.create({
  title: {
    fontFamily: fontFamily.semiBold,
    fontWeight: '600',
    fontSize: 13,
    lineHeight: 18,
    color: welcomeColors.textPrimary,
    marginBottom: 12,
  },
  pdfWrapper: {
    width: '100%',
    minHeight: 200,
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
