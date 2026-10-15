import React, { useCallback, useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AuthCard } from '../components/AuthCard';
import { HomeHeader } from '../components/HomeHeader';
import { LoadStateMessage } from '../components/LoadStateMessage';
import { OutlineButton } from '../components/OutlineButton';
import { ScreenTitleBar } from '../components/ScreenTitleBar';
import { ZoomablePdf } from '../components/ZoomablePdf';
import { DocumentIcon, DownloadIcon, EyeIcon } from '../assets/icons';
import { radius, welcomeColors } from '../theme';
import { AuthStackParamList } from '../navigation/types';
import { AchFormFile, useAchFormFile } from '../hooks/useAchFormFile';
import { showSaveResult } from '../hooks/useDocumentFileActions';
import { openCachedDocumentInOtherApp, saveCachedDocumentToDevice } from '../services/documentFileService';

type Props = NativeStackScreenProps<AuthStackParamList, 'AchFormPreview'>;

type FileAction = 'download' | 'print' | 'share';

const ACTION_ERROR_TITLES: Record<FileAction, string> = {
  download: 'Unable to save the ACH form',
  print: 'Unable to print the ACH form',
  share: 'Unable to share the ACH form',
};

/**
 * The ACH form as a PDF (pinch or double-tap to zoom), with View (full
 * screen), Download, Print and Share. Print and Share hand the PDF to the
 * system: the share sheet on iOS, another app on Android.
 */
export function AchFormPreviewScreen({ navigation, route }: Props): React.JSX.Element {
  const { ach } = route.params;
  const { data: file, status, reload } = useAchFormFile(ach);
  const [busyAction, setBusyAction] = useState<FileAction | null>(null);
  const [hasRenderError, setHasRenderError] = useState(false);

  const handlePdfError = useCallback((error: object) => {
    console.error('Failed to render the ACH form:', error);
    setHasRenderError(true);
  }, []);

  const run = async (action: FileAction, task: (achFile: AchFormFile) => Promise<void>): Promise<void> => {
    if (!file) {
      return;
    }
    setBusyAction(action);
    try {
      await task(file);
    } catch (error) {
      Alert.alert(ACTION_ERROR_TITLES[action], error instanceof Error ? error.message : 'Please try again.');
    } finally {
      setBusyAction(null);
    }
  };

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

  const isDisabled = !file || hasRenderError || busyAction !== null;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <HomeHeader />
      {/* A fixed (non-scrolling) layout, so the PDF owns every pinch, pan and scroll gesture. */}
      <View style={styles.container}>
        <ScreenTitleBar title="ACH Form Preview" onBackPress={() => navigation.goBack()} />

        <AuthCard style={styles.pdfCard}>{renderPdf()}</AuthCard>

        <View style={styles.actions}>
          <OutlineButton
            title="View ACH Form"
            icon={<EyeIcon width={16} height={11} color={welcomeColors.textPrimary} visible />}
            disabled={isDisabled}
            onPress={() => file && navigation.navigate('DocumentViewer', { fileName: file.fileName, path: file.path })}
          />
          <OutlineButton
            title="Download ACH Form"
            icon={<DownloadIcon size={16} color={welcomeColors.textPrimary} />}
            disabled={isDisabled}
            isBusy={busyAction === 'download'}
            onPress={() =>
              run('download', async ({ path, fileName }) =>
                showSaveResult(await saveCachedDocumentToDevice(path, fileName), fileName),
              )
            }
          />
          <OutlineButton
            title="Print ACH Form"
            icon={<DocumentIcon size={16} color={welcomeColors.textPrimary} />}
            disabled={isDisabled}
            isBusy={busyAction === 'print'}
            onPress={() => run('print', ({ path, fileName }) => openCachedDocumentInOtherApp(path, fileName))}
          />
          <OutlineButton
            title="Share ACH Form"
            icon={<DocumentIcon size={16} color={welcomeColors.textPrimary} />}
            disabled={isDisabled}
            isBusy={busyAction === 'share'}
            onPress={() => run('share', ({ path, fileName }) => openCachedDocumentInOtherApp(path, fileName))}
          />
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
  actions: {
    gap: 10,
  },
});
