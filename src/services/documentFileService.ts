import { PermissionsAndroid, Platform } from 'react-native';
import ReactNativeBlobUtil from 'react-native-blob-util';
import RNFS from 'react-native-fs';

const PDF_MIME_TYPE = 'application/pdf';
/** Saved documents go in Downloads/<this folder> on Android 10+. */
const DOWNLOAD_SUBFOLDER = 'MG Bros';
/** The first Android version with scoped storage (Q), where Downloads is written through MediaStore. */
const ANDROID_SCOPED_STORAGE_API = 29;

export interface DocumentFileSource {
  /** Used as the saved file's name, e.g. "W9 - ABC Construction Services.pdf". */
  fileName: string;
  /** The PDF, base64-encoded. */
  contentBase64: string;
}

/** What happened when the user saved a document. */
export type DocumentSaveResult =
  /** Saved straight to Downloads (Android). */
  | { kind: 'saved'; location: string }
  /** iOS: the share sheet was shown, where the user picks "Save to Files" or an app. */
  | { kind: 'shared' };

/** Characters Android or iOS file systems reject in a file name. */
const INVALID_FILE_NAME_CHARACTERS = /[\\/:*?"<>|]+/;
const MAX_FILE_NAME_LENGTH = 120;

/** "W9 / ABC: Co.pdf" → "W9 - ABC - Co.pdf": safe as a file name on Android and iOS. */
export function toSafePdfFileName(fileName: string): string {
  const base = fileName
    .replace(/\.pdf$/i, '')
    // Each run of rejected characters becomes one " - "; empty or dots-only pieces are dropped.
    .split(INVALID_FILE_NAME_CHARACTERS)
    .map((part) => part.replace(/\s+/g, ' ').trim())
    .filter((part) => part !== '' && !/^[.-]+$/.test(part))
    .join(' - ')
    .slice(0, MAX_FILE_NAME_LENGTH)
    .trim();
  return `${base || 'Document'}.pdf`;
}

/**
 * Writes the document to the app's cache and returns the file path, for the
 * PDF viewer or for saving. The cache is the OS's to clear, and each document
 * keeps one copy (named after it), so this doesn't pile up files.
 */
export async function writeDocumentToCache({ fileName, contentBase64 }: DocumentFileSource): Promise<string> {
  const directory = `${RNFS.CachesDirectoryPath}/documents`;
  await RNFS.mkdir(directory);
  const path = `${directory}/${toSafePdfFileName(fileName)}`;
  await RNFS.writeFile(path, contentBase64, 'base64');
  return path;
}

/** Android 9 and older need the storage permission to write to Downloads. */
async function ensureLegacyStoragePermission(): Promise<void> {
  const permission = PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE;
  if (await PermissionsAndroid.check(permission)) {
    return;
  }
  const result = await PermissionsAndroid.request(permission, {
    title: 'Save documents',
    message: 'MG Bros needs access to your storage to save documents to your Downloads folder.',
    buttonPositive: 'Allow',
    buttonNegative: 'Cancel',
  });
  if (result !== PermissionsAndroid.RESULTS.GRANTED) {
    throw new Error('Storage permission is needed to save documents. You can allow it in Settings.');
  }
}

async function saveToAndroidDownloads(cachePath: string, fileName: string): Promise<DocumentSaveResult> {
  if (Number(Platform.Version) >= ANDROID_SCOPED_STORAGE_API) {
    await ReactNativeBlobUtil.MediaCollection.copyToMediaStore(
      // The runtime takes `name` (the typings call it `path`).
      { name: fileName, parentFolder: DOWNLOAD_SUBFOLDER, mimeType: PDF_MIME_TYPE } as unknown as Parameters<
        typeof ReactNativeBlobUtil.MediaCollection.copyToMediaStore
      >[0],
      'Download',
      cachePath,
    );
    return { kind: 'saved', location: `Downloads/${DOWNLOAD_SUBFOLDER}` };
  }

  await ensureLegacyStoragePermission();
  const destination = `${RNFS.DownloadDirectoryPath}/${fileName}`;
  if (await RNFS.exists(destination)) {
    await RNFS.unlink(destination);
  }
  await RNFS.copyFile(cachePath, destination);
  // Lists it in the Downloads app and shows a "download complete" notification.
  await ReactNativeBlobUtil.android.addCompleteDownload({
    title: fileName,
    description: 'Saved from MG Bros',
    mime: PDF_MIME_TYPE,
    path: destination,
    showNotification: true,
  });
  return { kind: 'saved', location: 'Downloads' };
}

/**
 * Saves a document already written to the cache (writeDocumentToCache) onto
 * the device: to Downloads on Android, through the share sheet ("Save to
 * Files") on iOS, which has no shared Downloads folder. Throws an Error whose
 * message is fit to show the user.
 */
export async function saveCachedDocumentToDevice(cachePath: string, fileName: string): Promise<DocumentSaveResult> {
  if (Platform.OS === 'android') {
    return saveToAndroidDownloads(cachePath, toSafePdfFileName(fileName));
  }
  ReactNativeBlobUtil.ios.presentOptionsMenu(cachePath);
  return { kind: 'shared' };
}

/** writeDocumentToCache, then saveCachedDocumentToDevice. */
export async function saveDocumentToDevice(source: DocumentFileSource): Promise<DocumentSaveResult> {
  return saveCachedDocumentToDevice(await writeDocumentToCache(source), source.fileName);
}
