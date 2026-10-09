import { useCallback, useState } from 'react';
import { Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../navigation/types';
import { DocumentSaveResult, saveDocumentToDevice, writeDocumentToCache } from '../services/documentFileService';
import { ComplianceDocumentFile } from '../types/document';

const NO_FILE_MESSAGE = 'There is no file attached to this document yet.';

function errorMessage(error: unknown): string {
  return error instanceof Error && error.message ? error.message : 'Please try again.';
}

/** Tells the user where a saved document went (nothing on iOS, where the share sheet is the feedback). */
export function showSaveResult(result: DocumentSaveResult, fileName: string): void {
  if (result.kind === 'saved') {
    Alert.alert('Document saved', `${fileName} was saved to ${result.location}.`);
  }
}

export interface DocumentFileActions {
  /** The file being opened or saved, so its buttons can show they're busy (one at a time). */
  busyFileId: string | null;
  /** Opens the file in the in-app PDF viewer. */
  openFile: (file: ComplianceDocumentFile) => void;
  /** Saves the file onto the device (Downloads on Android, the share sheet on iOS). */
  downloadFile: (file: ComplianceDocumentFile) => void;
}

/** View and download for a document's files, with busy state and error messages. */
export function useDocumentFileActions(): DocumentFileActions {
  const navigation = useNavigation<NativeStackNavigationProp<AuthStackParamList>>();
  const [busyFileId, setBusyFileId] = useState<string | null>(null);

  const run = useCallback(
    async (file: ComplianceDocumentFile, failureTitle: string, action: (contentBase64: string) => Promise<void>) => {
      if (!file.contentBase64) {
        Alert.alert(failureTitle, NO_FILE_MESSAGE);
        return;
      }
      setBusyFileId(file.id);
      try {
        await action(file.contentBase64);
      } catch (error) {
        console.error(`${failureTitle}:`, error);
        Alert.alert(failureTitle, errorMessage(error));
      } finally {
        setBusyFileId(null);
      }
    },
    [],
  );

  const openFile = useCallback(
    (file: ComplianceDocumentFile) => {
      run(file, 'Unable to open document', async (contentBase64) => {
        const path = await writeDocumentToCache({ fileName: file.fileName, contentBase64 });
        navigation.navigate('DocumentViewer', { fileName: file.fileName, path });
      });
    },
    [navigation, run],
  );

  const downloadFile = useCallback(
    (file: ComplianceDocumentFile) => {
      run(file, 'Unable to save document', async (contentBase64) => {
        showSaveResult(await saveDocumentToDevice({ fileName: file.fileName, contentBase64 }), file.fileName);
      });
    },
    [run],
  );

  return { busyFileId, openFile, downloadFile };
}
