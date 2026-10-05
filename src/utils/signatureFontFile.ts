import { Platform } from 'react-native';
import RNFS from 'react-native-fs';
import { SignatureFontId, getSignatureFont } from '../constants/signatureFonts';

/** Reads a bundled signature font (linked into the native app's assets) as base64, for embedding in a PDF. */
export async function readSignatureFontBase64(fontId: SignatureFontId): Promise<string> {
  const { fileName } = getSignatureFont(fontId);
  return Platform.OS === 'android'
    ? RNFS.readFileAssets(`fonts/${fileName}`, 'base64')
    : RNFS.readFile(`${RNFS.MainBundlePath}/${fileName}`, 'base64');
}
