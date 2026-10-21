/** Keeps digits only, up to `maxLength` (account and routing numbers are typed without spaces or dashes). */
export function digitsOnly(text: string, maxLength: number): string {
  return text.replace(/\D/g, '').slice(0, maxLength);
}

export const ROUTING_NUMBER_LENGTH = 9;
export const ACCOUNT_NUMBER_MIN_LENGTH = 4;
export const ACCOUNT_NUMBER_MAX_LENGTH = 17;

/**
 * A US (ABA) routing number: 9 digits whose weighted sum (3, 7, 1 repeating)
 * is a multiple of 10. Catches most typos before the form is generated.
 */
export function isValidRoutingNumber(routingNumber: string): boolean {
  if (!/^\d{9}$/.test(routingNumber)) {
    return false;
  }
  const weights = [3, 7, 1, 3, 7, 1, 3, 7, 1];
  const sum = weights.reduce((total, weight, index) => total + weight * Number(routingNumber[index]), 0);
  return sum % 10 === 0;
}

/** US bank account numbers are 4–17 digits. */
export function isValidAccountNumber(accountNumber: string): boolean {
  return (
    /^\d+$/.test(accountNumber) &&
    accountNumber.length >= ACCOUNT_NUMBER_MIN_LENGTH &&
    accountNumber.length <= ACCOUNT_NUMBER_MAX_LENGTH
  );
}

const VISIBLE_DIGITS = 4;
const MASK_LENGTH = 8;

/** "987654321" → "••••••••4321": only the last 4 digits show on screen. */
export function maskBankNumber(number: string): string {
  return `${'•'.repeat(MASK_LENGTH)}${number.slice(-VISIBLE_DIGITS)}`;
}
