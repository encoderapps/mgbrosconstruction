import RNFS from 'react-native-fs';

/**
 * Reads a picked document's URI (content:// on Android, file:// on iOS) into
 * a raw base64 string via react-native-fs, which reads the file natively
 * (through Android's ContentResolver for content:// URIs) and returns the
 * fully base64-encoded content in one call.
 *
 * NOTE: this used to be implemented with fetch(uri).blob() + FileReader,
 * which reads local files through RN's network/Blob bridge rather than a
 * direct native file read — that path is documented to silently truncate
 * larger local files in React Native. RNFS.readFile does not have this
 * issue since it reads and encodes the whole file natively in Java/Obj-C.
 */
export async function fileToBase64(uri: string): Promise<string> {
  return RNFS.readFile(uri, 'base64');
}
