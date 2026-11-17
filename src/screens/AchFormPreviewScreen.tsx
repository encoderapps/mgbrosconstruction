import React, { useCallback, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AuthCard } from '../components/AuthCard';
import { HomeHeader } from '../components/HomeHeader';
import { LoadStateMessage } from '../components/LoadStateMessage';
import { ScreenTitleBar } from '../components/ScreenTitleBar';
import { ZoomablePdf } from '../components/ZoomablePdf';
import { radius, welcomeColors } from '../theme';
import { AuthStackParamList } from '../navigation/types';
import { useAchFormFile } from '../hooks/useAchFormFile';

type Props = NativeStackScreenProps<AuthStackParamList, 'AchFormPreview'>;

/**
 * The ACH form as a PDF (pinch or double-tap to zoom), shown after Save &
 * Generate ACH Form: the company and bank details, signed and dated.
 */
export function AchFormPreviewScreen({ navigation, route }: Props): React.JSX.Element {
  const { ach } = route.params;
  const { data: file, status, reload } = useAchFormFile(ach);
  const [hasRenderError, setHasRenderError] = useState(false);

  const handlePdfError = useCallback((error: object) => {
    console.error('Failed to render the ACH form:', error);
    setHasRenderError(true);
  }, []);

  const renderPdf = (): React.JSX.Element => {
    if (file && !hasRenderError) {
      return <ZoomablePdf path={file.path} style={styles.pdf} onError={handlePdfError} />;
    }
    if (status === 'error' || hasRenderError) {
      return (
        <LoadStateMessage
          state="error"
          message="Unable to create the ACH form."
          onRetry={() => {
            setHasRenderError(false);
            reload();
          }}
        />
      );
    }
    return <LoadStateMessage state="loading" />;
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <HomeHeader />
      {/* A fixed (non-scrolling) layout, so the PDF owns every pinch, pan and scroll gesture. */}
      <View style={styles.container}>
        <ScreenTitleBar title="ACH Form Preview" onBackPress={() => navigation.goBack()} />

        <AuthCard style={styles.pdfCard}>{renderPdf()}</AuthCard>
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
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 16,
    gap: 12,
  },
  pdfCard: {
    flex: 1,
    padding: 0,
    overflow: 'hidden',
    justifyContent: 'center',
  },
  pdf: {
    flex: 1,
    width: '100%',
    backgroundColor: welcomeColors.cardBackground,
    borderRadius: radius.md,
  },
});
