import * as Keychain from 'react-native-keychain';

/**
 * Auth tokens are kept in the OS-backed Keystore/Keychain via react-native-keychain
 * rather than AsyncStorage, since AsyncStorage is unencrypted on-device storage.
 */
const SERVICE = 'mg_construction_auth';

export async function saveAuthToken(token: string): Promise<void> {
  await Keychain.setGenericPassword('auth_token', token, { service: SERVICE });
}

export async function getAuthToken(): Promise<string | null> {
  const credentials = await Keychain.getGenericPassword({ service: SERVICE });
  return credentials ? credentials.password : null;
}

export async function clearAuthToken(): Promise<void> {
  await Keychain.resetGenericPassword({ service: SERVICE });
}
