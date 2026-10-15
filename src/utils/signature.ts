import type { SubcontractorSignatureData } from '../navigation/types';
import type { SubcontractorLoginResponse } from '../types';
import type { UserSignature } from '../types/signature';
/**
 * Initials from a full name: the first letter of the first name and of the
 * last name, e.g. "Deepak Rathore" → "DR", "Michael J. Anderson" → "MA".
 * A single name gives a single initial ("Deepak" → "D").
 */
export function getInitials(fullName: string): string {
  const names = fullName.trim().split(/\s+/).filter(Boolean);
  if (names.length === 0) {
    return '';
  }
  const firstLetter = (name: string): string => Array.from(name)[0] ?? '';
  const first = firstLetter(names[0]);
  const last = names.length > 1 ? firstLetter(names[names.length - 1]) : '';
  return `${first}${last}`.toUpperCase();
}

/** The signature made on the registration agreement, as kept for signing after login. */
export function toUserSignature(data: SubcontractorSignatureData): UserSignature {
  return {
    name: data.signatureName,
    initials: data.signatureInitials,
    imageBase64: data.signatureImageBase64,
    initialsImageBase64: data.initialsImageBase64,
    fontId: data.signatureFont,
  };
}

/** The signature the login API returns, or null when it doesn't return a complete one. */
export function userSignatureFromLogin(response: SubcontractorLoginResponse): UserSignature | null {
  const name = response.subcontractorFullName?.trim();
  const imageBase64 = response.signatureBase64Data?.trim();
  if (!name || !imageBase64) {
    return null;
  }
  return {
    name,
    initials: getInitials(name),
    imageBase64,
    initialsImageBase64: response.signatureInitialsBase64Data?.trim() ?? '',
    fontId: null,
  };
}
