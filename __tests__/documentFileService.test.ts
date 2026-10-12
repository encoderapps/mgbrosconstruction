import { PermissionsAndroid, Platform } from 'react-native';
import ReactNativeBlobUtil from 'react-native-blob-util';
import RNFS from 'react-native-fs';
import {
  saveCachedDocumentToDevice,
  saveDocumentToDevice,
  toSafePdfFileName,
  writeDocumentToCache,
} from '../src/services/documentFileService';

jest.mock('react-native-fs', () => ({
  CachesDirectoryPath: '/cache',
  DownloadDirectoryPath: '/storage/Download',
  mkdir: jest.fn().mockResolvedValue(undefined),
  writeFile: jest.fn().mockResolvedValue(undefined),
  exists: jest.fn().mockResolvedValue(false),
  unlink: jest.fn().mockResolvedValue(undefined),
  copyFile: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('react-native-blob-util', () => ({
  MediaCollection: { copyToMediaStore: jest.fn().mockResolvedValue('content://media/1') },
  android: { addCompleteDownload: jest.fn().mockResolvedValue(undefined) },
  ios: { presentOptionsMenu: jest.fn() },
}));

const SOURCE = { fileName: 'W9 - ABC Construction Services.pdf', contentBase64: 'JVBERi0xLjQK' };
const CACHE_PATH = '/cache/documents/W9 - ABC Construction Services.pdf';

function setPlatform(os: 'android' | 'ios', version: number | string): void {
  Object.defineProperty(Platform, 'OS', { value: os, configurable: true });
  Object.defineProperty(Platform, 'Version', { value: version, configurable: true });
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe('toSafePdfFileName', () => {
  it('keeps a readable name, swaps characters file systems reject, and ends in .pdf', () => {
    expect(toSafePdfFileName('W9 - ABC Construction Services')).toBe('W9 - ABC Construction Services.pdf');
    expect(toSafePdfFileName('GL 1/1/2026: "Final"?.PDF')).toBe('GL 1 - 1 - 2026 - Final.pdf');
    expect(toSafePdfFileName('  ...  ')).toBe('Document.pdf');
  });
});

describe('writeDocumentToCache', () => {
  it('writes the base64 PDF into the documents cache folder', async () => {
    await expect(writeDocumentToCache(SOURCE)).resolves.toBe(CACHE_PATH);
    expect(RNFS.mkdir).toHaveBeenCalledWith('/cache/documents');
    expect(RNFS.writeFile).toHaveBeenCalledWith(CACHE_PATH, 'JVBERi0xLjQK', 'base64');
  });
});

describe('saveDocumentToDevice', () => {
  it('saves to Downloads/MG Bros through MediaStore on Android 10+', async () => {
    setPlatform('android', 34);

    await expect(saveDocumentToDevice(SOURCE)).resolves.toEqual({ kind: 'saved', location: 'Downloads/MG Bros' });
    expect(ReactNativeBlobUtil.MediaCollection.copyToMediaStore).toHaveBeenCalledWith(
      { name: 'W9 - ABC Construction Services.pdf', parentFolder: 'MG Bros', mimeType: 'application/pdf' },
      'Download',
      CACHE_PATH,
    );
  });

  it('asks for storage permission, copies to Downloads and lists it on Android 9 and older', async () => {
    setPlatform('android', 28);
    jest.spyOn(PermissionsAndroid, 'check').mockResolvedValue(false);
    jest.spyOn(PermissionsAndroid, 'request').mockResolvedValue(PermissionsAndroid.RESULTS.GRANTED);

    await expect(saveCachedDocumentToDevice(CACHE_PATH, SOURCE.fileName)).resolves.toEqual({
      kind: 'saved',
      location: 'Downloads',
    });
    expect(RNFS.copyFile).toHaveBeenCalledWith(CACHE_PATH, '/storage/Download/W9 - ABC Construction Services.pdf');
    expect(ReactNativeBlobUtil.android.addCompleteDownload).toHaveBeenCalledWith(
      expect.objectContaining({ path: '/storage/Download/W9 - ABC Construction Services.pdf', mime: 'application/pdf' }),
    );
  });

  it('explains when storage permission is refused on Android 9 and older', async () => {
    setPlatform('android', 26);
    jest.spyOn(PermissionsAndroid, 'check').mockResolvedValue(false);
    jest.spyOn(PermissionsAndroid, 'request').mockResolvedValue(PermissionsAndroid.RESULTS.DENIED);

    await expect(saveCachedDocumentToDevice(CACHE_PATH, SOURCE.fileName)).rejects.toThrow(
      'Storage permission is needed to save documents.',
    );
    expect(RNFS.copyFile).not.toHaveBeenCalled();
  });

  it('opens the share sheet on iOS', async () => {
    setPlatform('ios', '17.0');

    await expect(saveCachedDocumentToDevice(CACHE_PATH, SOURCE.fileName)).resolves.toEqual({ kind: 'shared' });
    expect(ReactNativeBlobUtil.ios.presentOptionsMenu).toHaveBeenCalledWith(CACHE_PATH);
  });
});
