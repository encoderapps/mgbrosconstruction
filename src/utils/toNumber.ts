/** "100.00" / 100 → 100; anything unparseable → null. Salesforce sends some amounts as strings. */
export function toNumber(value: number | string | null | undefined): number | null {
  if (value === null || value === undefined || value === '') {
    return null;
  }
  const number = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(number) ? number : null;
}
