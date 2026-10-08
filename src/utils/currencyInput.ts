/** The largest amount a single entry may have. */
export const MAX_CURRENCY_AMOUNT = 99_999_999.99;

/**
 * Cleans a dollar amount as it's typed: digits and one decimal point, at most
 * 2 decimals, no leading zeros ("007.5" → "7.5", "1,250" → "1250").
 */
export function sanitizeCurrencyInput(text: string): string {
  const cleaned = text.replace(/[^\d.]/g, '');
  const [whole = '', ...rest] = cleaned.split('.');
  const wholeDigits = whole.replace(/^0+(?=\d)/, '');
  if (rest.length === 0) {
    return wholeDigits;
  }
  return `${wholeDigits || '0'}.${rest.join('').slice(0, 2)}`;
}

/** "1250.5" → 1250.5; null when empty, not a number, not positive or over MAX_CURRENCY_AMOUNT. */
export function parseCurrencyInput(text: string): number | null {
  if (!/^\d+(\.\d{0,2})?$/.test(text.trim())) {
    return null;
  }
  const amount = Number(text);
  return amount > 0 && amount <= MAX_CURRENCY_AMOUNT ? amount : null;
}
