import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { HomeHeader } from '../components/HomeHeader';
import { ZoomablePdf } from '../components/ZoomablePdf';
import { ArrowLeftIcon, DownloadIcon } from '../assets/icons';
import { fontFamily, radius, welcomeColors } from '../theme';
import { AuthStackParamList } from '../navigation/types';
import { showSaveResult } from '../hooks/useDocumentFileActions';
import { saveCachedDocumentToDevice } from '../services/documentFileService';

type Props = NativeStackScreenProps<AuthStackParamList, 'DocumentViewer'>;

/** A compliance document's PDF, full screen (pinch or double-tap to zoom), with a download button. */
export function DocumentViewerScreen({ navigation, route }: Props): React.JSX.Element {
  const { fileName, path } = route.params;
  const [hasError, setHasError] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handlePdfError = useCallback(
    (error: object) => {
      console.error(`Failed to render ${fileName}:`, error);
      setHasError(true);
    },
    [fileName],
  );

  const handleDownload = async (): Promise<void> => {
    setIsSaving(true);
    try {
      showSaveResult(await saveCachedDocumentToDevice(path, fileName), fileName);
    } catch (error) {
      console.error('Unable to save document:', error);
      Alert.alert('Unable to save document', error instanceof Error && error.message ? error.message : 'Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  // A fixed (non-scrolling) layout, so the PDF viewer owns every scroll,
  // pinch and pan gesture instead of competing with a parent ScrollView.
  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <HomeHeader />
      <View style={styles.container}>
        <View style={styles.titleRow}>
          <Pressable onPress={() => navigation.goBack()} hitSlop={10} accessibilityRole="button" accessibilityLabel="Back">
            <ArrowLeftIcon size={18} color={welcomeColors.accent} />
          </Pressable>
          <Text style={styles.title} numberOfLines={2}>
            {fileName}
          </Text>
          <Pressable
            onPress={handleDownload}
            disabled={isSaving || hasError}
            hitSlop={8}
            style={({ pressed }) => [styles.downloadButton, (pressed || isSaving || hasError) && styles.dimmed]}
            accessibilityRole="button"
            accessibilityLabel={`Download ${fileName}`}
            accessibilityState={{ disabled: isSaving || hasError, busy: isSaving }}
          >
            {isSaving ? (
              <ActivityIndicator size="small" color={welcomeColors.cardBackground} />
            ) : (
              <DownloadIcon size={18} color={welcomeColors.cardBackground} />
            )}
          </Pressable>
        </View>

        <View style={styles.pdfWrapper}>
          {hasError ? (
            <Text style={styles.errorText}>Unable to display this document.</Text>
          ) : (
            <ZoomablePdf path={path} style={styles.pdf} onError={handlePdfError} />
          )}
        </View>
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
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  title: {
    flex: 1,
    fontFamily: fontFamily.semiBold,
    fontWeight: '600',
    fontSize: 14,
    color: welcomeColors.accent,
  },
  downloadButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: welcomeColors.loginButton,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dimmed: {
    opacity: 0.6,
  },
  pdfWrapper: {
    flex: 1,
    justifyContent: 'center',
    borderRadius: radius.md,
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
    fontSize: 13,
    color: welcomeColors.textSecondary,
    textAlign: 'center',
    padding: 16,
  },
});
