import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '../constants/storageKeys';
import { SIGNATURE_FONTS } from '../constants/signatureFonts';
import type { UserSignature } from '../types/signature';

/*
 * The login API doesn't return the signature sent at registration (yet), so
 * a copy is kept on the device: saved when registration succeeds, under the
 * email registered with, and loaded when someone logs in with that email, to
 * sign POs and change orders with. On another device (or after a reinstall)
 * there's none until the login API returns it.
 */

const storageKey = (email: string): string =>
  `${STORAGE_KEYS.REGISTRATION_SIGNATURE_PREFIX}${email.trim().toLowerCase()}`;

function isSignature(value: unknown): value is UserSignature {
  const signature = value as Partial<UserSignature> | null;
  return (
    typeof signature?.name === 'string' &&
    signature.name.trim() !== '' &&
    typeof signature.initials === 'string' &&
    typeof signature.imageBase64 === 'string' &&
    signature.imageBase64 !== '' &&
    typeof signature.initialsImageBase64 === 'string' &&
    (signature.fontId === null || SIGNATURE_FONTS.some((font) => font.id === signature.fontId))
  );
}

/** Remembers the signature made while registering, for when this email logs in. */
export async function saveRegistrationSignature(email: string, signature: UserSignature): Promise<void> {
  await AsyncStorage.setItem(storageKey(email), JSON.stringify(signature));
}

/** The signature registered with this email on this device, or null if there's none (or it can't be read). */
export async function getRegistrationSignature(email: string): Promise<UserSignature | null> {
  try {
    const stored = await AsyncStorage.getItem(storageKey(email));
    const signature: unknown = stored ? JSON.parse(stored) : null;
    return isSignature(signature) ? signature : null;
  } catch {
    return null;
  }
}
