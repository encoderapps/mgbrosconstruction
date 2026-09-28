import { Address } from '../navigation/types';

/** Pincode / postal code: 3–10 letters or digits, with inner spaces or dashes allowed. */
export const PINCODE_REGEX = /^[A-Za-z0-9][A-Za-z0-9 -]{1,8}[A-Za-z0-9]$/;

export function isValidPincode(pincode: string): boolean {
  return PINCODE_REGEX.test(pincode.trim());
}

/**
 * Joins the separate address fields into the single address string the
 * registration API expects, skipping empty parts (Address 2 is optional), e.g.
 * "1295 Jarvis Ave, Suite 1, Elk Grove Village, Illinois, United States, 60007".
 */
export function formatAddress(address: Address): string {
  return [address.address1, address.address2, address.city, address.state, address.country, address.pincode]
    .map((part) => part.trim())
    .filter(Boolean)
    .join(', ');
}
