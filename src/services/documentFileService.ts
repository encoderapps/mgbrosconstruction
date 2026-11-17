import { PermissionsAndroid, Platform } from 'react-native';
import ReactNativeBlobUtil from 'react-native-blob-util';
import RNFS from 'react-native-fs';
import FileViewer from 'react-native-file-viewer';
import { detectDocumentFileType, documentFileTypeFromPath, DocumentFileType } from '../utils/documentFileType';
import { fetchSalesforceAccessToken, getStoredSalesforceAccessToken } from './salesforceAuthService';

/** Saved documents go in Downloads/<this folder> on Android 10+. */
const DOWNLOAD_SUBFOLDER = 'MG Bros';
/** The first Android version with scoped storage (Q), where Downloads is written through MediaStore. */
const ANDROID_SCOPED_STORAGE_API = 29;

export interface DocumentFileSource {
  /** Used as the saved file's name, e.g. "W9 - ABC Construction Services.pdf". */
  fileName: string;
  /** The file (a PDF, or a JPG or PNG photo), base64-encoded. */
  contentBase64: string;
}

/** What happened when the user saved a document. */
export type DocumentSaveResult =
  /** Saved straight to Downloads (Android). */
  | { kind: 'saved'; location: string }
  /** iOS: the share sheet was shown, where the user picks "Save to Files" or an app. */
  | { kind: 'shared' };

/**
 * Characters Android or iOS file systems reject in a file name, plus "#" and
 * "%", which would break the file:// URI the PDF viewer opens it by.
 */
const INVALID_FILE_NAME_CHARACTERS = /[\\/:*?"<>|#%]+/;
const MAX_FILE_NAME_LENGTH = 120;

/**
 * "W9 / ABC: Co.pdf" → "W9 - ABC - Co.<extension>": safe as a file name on
 * Android and iOS, ending in the file's real extension (whatever it was called).
 */
export function toSafeFileName(fileName: string, extension: DocumentFileType['extension']): string {
  const base = fileName
    .replace(/\.(pdf|jpe?g|png)$/i, '')
    // Each run of rejected characters becomes one " - "; empty or dots-only pieces are dropped.
    .split(INVALID_FILE_NAME_CHARACTERS)
    .map((part) => part.replace(/\s+/g, ' ').trim())
    .filter((part) => part !== '' && !/^[.-]+$/.test(part))
    .join(' - ')
    .slice(0, MAX_FILE_NAME_LENGTH)
    .trim();
  return `${base || 'Document'}.${extension}`;
}

/** toSafeFileName for a PDF: "W9 / ABC: Co" → "W9 - ABC - Co.pdf". */
export function toSafePdfFileName(fileName: string): string {
  return toSafeFileName(fileName, 'pdf');
}

/**
 * Writes the document to the app's cache and returns the file path, for the
 * PDF viewer or for saving. The cache is the OS's to clear, and each document
 * keeps one copy (named after it), so this doesn't pile up files.
 */
export async function writeDocumentToCache({ fileName, contentBase64 }: DocumentFileSource): Promise<string> {
  const directory = `${RNFS.CachesDirectoryPath}/documents`;
  await RNFS.mkdir(directory);
  // Named for what the file really is, so the viewer and Downloads treat a JPG as a JPG.
  const path = `${directory}/${toSafeFileName(fileName, detectDocumentFileType(contentBase64).extension)}`;
  await RNFS.writeFile(path, contentBase64, 'base64');
  return path;
}

const DOWNLOAD_ERROR_MESSAGE = 'Unable to download this document. Please try again.';

/**
 * Downloads a file stored in Salesforce (e.g. a /sfc/servlet.shepherd/…
 * download URL) into the app's cache with the Salesforce token, refreshing the
 * token once on a 401, and returns its path for the document viewer.
 */
export async function downloadSalesforceFileToCache(url: string, fileName: string): Promise<string> {
  const directory = `${RNFS.CachesDirectoryPath}/documents`;
  await RNFS.mkdir(directory);
  const extension = /\.(jpe?g)$/i.test(fileName) ? 'jpg' : /\.png$/i.test(fileName) ? 'png' : 'pdf';
  const path = `${directory}/${toSafeFileName(fileName, extension)}`;

  const download = async (accessToken: string): Promise<number> => {
    const response = await ReactNativeBlobUtil.config({ path, overwrite: true }).fetch('GET', url, {
      Authorization: `Bearer ${accessToken}`,
    });
    return response.info().status;
  };

  let status: number;
  try {
    status = await download((await getStoredSalesforceAccessToken()) ?? (await fetchSalesforceAccessToken()));
    if (status === 401) {
      status = await download(await fetchSalesforceAccessToken());
    }
  } catch {
    throw new Error(DOWNLOAD_ERROR_MESSAGE);
  }
  // A login or error page (HTML or JSON) can come back with a 2xx too: only keep a real PDF or image.
  const isExpectedFile = status >= 200 && status < 300 && (await hasFileSignature(path, extension));
  if (!isExpectedFile) {
    if (__DEV__) {
      const body = await RNFS.read(path, 300, 0, 'utf8').catch(() => '');
      console.log('[Salesforce file download] failed', status, url, body);
    }
    await RNFS.unlink(path).catch(() => undefined);
    throw new Error(DOWNLOAD_ERROR_MESSAGE);
  }
  return path;
}

/** Whether the file starts like a PDF ("%PDF"), JPG (FF D8) or PNG ("\x89PNG"), per its extension. */
async function hasFileSignature(path: string, extension: DocumentFileType['extension']): Promise<boolean> {
  try {
    const startBase64 = await RNFS.read(path, 8, 0, 'base64');
    if (extension === 'pdf') {
      return startBase64.startsWith('JVBERi'); // "%PDF"
    }
    return detectDocumentFileType(startBase64).extension === extension;
  } catch {
    return false;
  }
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

async function saveToAndroidDownloads(
  cachePath: string,
  fileName: string,
  mimeType: string,
): Promise<DocumentSaveResult> {
  if (Number(Platform.Version) >= ANDROID_SCOPED_STORAGE_API) {
    await ReactNativeBlobUtil.MediaCollection.copyToMediaStore(
      // The runtime takes `name` (the typings call it `path`).
      { name: fileName, parentFolder: DOWNLOAD_SUBFOLDER, mimeType } as unknown as Parameters<
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
    mime: mimeType,
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
    const { extension, mimeType } = documentFileTypeFromPath(cachePath);
    return saveToAndroidDownloads(cachePath, toSafeFileName(fileName, extension), mimeType);
  }
  ReactNativeBlobUtil.ios.presentOptionsMenu(cachePath);
  return { kind: 'shared' };
}

/** writeDocumentToCache, then saveCachedDocumentToDevice. */
export async function saveDocumentToDevice(source: DocumentFileSource): Promise<DocumentSaveResult> {
  return saveCachedDocumentToDevice(await writeDocumentToCache(source), source.fileName);
}

/**
 * Hands a cached document to the system, to print or share it: the share sheet
 * on iOS (Print, Save to Files, Mail…), and on Android the "open with" chooser,
 * as Android can only print or share a PDF from the app that opens it.
 */
export async function openCachedDocumentInOtherApp(cachePath: string, fileName: string): Promise<void> {
  if (Platform.OS === 'android') {
    await FileViewer.open(cachePath, { showOpenWithDialog: true, displayName: fileName });
    return;
  }
  ReactNativeBlobUtil.ios.presentOptionsMenu(cachePath);
}
