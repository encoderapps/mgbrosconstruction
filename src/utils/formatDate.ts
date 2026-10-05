const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

/** "2026-08-24" → "08/24/2026", as printed on MG Bros' documents. */
export function formatUsDate(isoDate: string): string {
  const [year, month, day] = isoDate.split('-');
  return `${month}/${day}/${year}`;
}

/** "2026-08-24" → "August 24, 2026". */
export function formatLongDate(isoDate: string): string {
  const [year, month, day] = isoDate.split('-').map(Number);
  return `${MONTH_NAMES[month - 1] ?? ''} ${day}, ${year}`;
}
