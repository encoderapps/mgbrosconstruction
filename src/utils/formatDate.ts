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

/** "2026-08-04" → "Aug 04, 2026". */
export function formatShortDate(isoDate: string): string {
  const [year, month, day] = isoDate.split('-');
  return `${MONTH_NAMES[Number(month) - 1]?.slice(0, 3) ?? ''} ${day}, ${year}`;
}

const MS_PER_DAY = 86_400_000;

/**
 * Whole calendar days from `today` (default: the device's local date) to a
 * YYYY-MM-DD date; 0 on the day itself, negative once it has passed.
 */
export function daysUntil(isoDate: string, today: Date = new Date()): number {
  const [year, month, day] = isoDate.split('-').map(Number);
  const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  // Rounded, since a daylight-saving change makes a day 23 or 25 hours long.
  return Math.round((new Date(year, month - 1, day).getTime() - startOfToday.getTime()) / MS_PER_DAY);
}
