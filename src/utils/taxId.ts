/** Tax Identification Number (EIN) format: 2 digits, a dash, then 7 digits. */
export const TAX_ID_REGEX = /^\d{2}-\d{7}$/;

const TAX_ID_DIGITS = 9;

/**
 * Formats raw input as the user types: keeps digits only (max 9) and inserts
 * the dash after the first 2, e.g. "123456789" → "12-3456789". The dash is only
 * added once a 3rd digit exists, so backspacing over it works naturally.
 */
export function formatTaxIdInput(input: string): string {
  const digits = input.replace(/\D/g, '').slice(0, TAX_ID_DIGITS);
  return digits.length > 2 ? `${digits.slice(0, 2)}-${digits.slice(2)}` : digits;
}

export function isValidTaxId(taxId: string): boolean {
  return TAX_ID_REGEX.test(taxId);
}

const VISIBLE_TAX_ID_DIGITS = 4;

/**
 * Hides all but the last 4 digits of a Tax ID for display, keeping its dashes:
 * "15-5468978" → "XX-XXX8978". Too short to leave anything hidden → all masked.
 */
export function maskTaxId(taxId: string): string {
  const digitCount = taxId.replace(/\D/g, '').length;
  let digitsToMask = digitCount > VISIBLE_TAX_ID_DIGITS ? digitCount - VISIBLE_TAX_ID_DIGITS : digitCount;
  return taxId.replace(/\d/g, (digit) => (digitsToMask-- > 0 ? 'X' : digit));
}
