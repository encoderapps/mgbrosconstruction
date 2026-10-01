/**
 * Formats a dollar amount: "$10,200" (or "$10,200.50" when it has cents), or
 * always with cents ("$10,200.00") when `alwaysShowCents` is set.
 */
export function formatCurrency(amount: number, alwaysShowCents = false): string {
  const hasCents = Math.round(amount * 100) % 100 !== 0;
  const [whole, cents] = Math.abs(amount)
    .toFixed(alwaysShowCents || hasCents ? 2 : 0)
    .split('.');
  const grouped = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return `${amount < 0 ? '-' : ''}$${grouped}${cents ? `.${cents}` : ''}`;
}
