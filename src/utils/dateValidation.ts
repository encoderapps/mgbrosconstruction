/*
 * Dates in the registration forms are calendar dates stored as "YYYY-MM-DD"
 * strings. They're compared as strings (which sort chronologically in this
 * format) against today's local date, so the time of day and timezone never
 * cause today to be rejected.
 */

/** Formats a Date as a local "YYYY-MM-DD" calendar date. */
export function toDateOnlyString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/** "2026-09-29T20:21:34.000Z" → the device's calendar date, "2026-09-29"; null if missing or invalid. */
export function timestampToLocalDate(timestamp: string | null | undefined): string | null {
  const date = timestamp ? new Date(timestamp) : null;
  return date && !Number.isNaN(date.getTime()) ? toDateOnlyString(date) : null;
}

/**
 * Parses "YYYY-MM-DD" as a LOCAL date. (`new Date("YYYY-MM-DD")` parses it as
 * UTC midnight, which is the previous day in timezones west of UTC.)
 */
export function parseDateOnlyString(value: string): Date {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day);
}

/** Today's local calendar date as "YYYY-MM-DD", read from the device at call time. */
export function todayDateString(): string {
  return toDateOnlyString(new Date());
}

/** Today at local midnight, for date picker bounds. */
export function startOfToday(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

export interface DateValidationError {
  title: string;
  message: string;
}

/**
 * Insurance policy date rules:
 *  - Effective date: today or earlier.
 *  - Expiration date: today or later, and not before the effective date.
 */
export function validateInsuranceDates(effectiveDate: string, expirationDate: string): DateValidationError | null {
  const today = todayDateString();
  if (effectiveDate > today) {
    return { title: 'Invalid effective date', message: 'Effective date cannot be in the future.' };
  }
  if (expirationDate < today) {
    return { title: 'Invalid expiration date', message: 'Expiration date cannot be before today.' };
  }
  if (expirationDate < effectiveDate) {
    return { title: 'Invalid expiration date', message: 'Expiration date cannot be before the effective date.' };
  }
  return null;
}
