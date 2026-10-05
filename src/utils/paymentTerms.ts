import { PurchaseOrderPaymentTerm } from '../types/purchaseOrder';

/** Payment terms must add up to exactly this. */
export const FULL_PERCENTAGE = 100;

/** Percentages are kept to two decimals (33.33%), so the maths runs in hundredths of a percent. */
const HUNDREDTHS = 100;

/** A payment term being edited on the Modify Payment Terms screen. */
export interface PaymentTermDraft {
  /** Stable React key; not sent to the API. */
  key: string;
  description: string;
  /** What's in the % field, e.g. "30" or "33.33" ("" while being retyped). */
  percentageText: string;
}

export function roundToHundredths(value: number): number {
  return Math.round(value * HUNDREDTHS) / HUNDREDTHS;
}

/** 33.333… → "33.33%", 100 → "100%". */
export function formatPercentage(value: number): string {
  return `${roundToHundredths(value)}%`;
}

/** Sum rounded to two decimals, so 33.33 + 33.33 + 33.34 is exactly 100 (not 99.99999…). */
export function sumPercentages(percentages: number[]): number {
  return roundToHundredths(percentages.reduce((total, percentage) => total + percentage, 0));
}

export function isFullPercentage(total: number): boolean {
  return roundToHundredths(total) === FULL_PERCENTAGE;
}

/**
 * `count` two-decimal percentages that add up to exactly 100; the rounding
 * remainder goes on the last one (3 → 33.33, 33.33, 33.34).
 */
export function distributePercentagesEvenly(count: number): number[] {
  if (count <= 0) {
    return [];
  }
  const totalHundredths = FULL_PERCENTAGE * HUNDREDTHS;
  const share = Math.floor(totalHundredths / count);
  return Array.from(
    { length: count },
    (_, index) => (index === count - 1 ? totalHundredths - share * (count - 1) : share) / HUNDREDTHS,
  );
}

/** PO total × percentage / 100, rounded to cents ($19,750 × 30% → $5,925.00). */
export function calculatePaymentTermAmount(totalAmount: number, percentage: number): number {
  // total × percentage / 100 dollars is total × percentage cents.
  return Math.round(totalAmount * percentage) / 100;
}

/**
 * Each term's amount. When the terms cover 100%, the last one absorbs the
 * rounding so the amounts add up to the PO total to the cent.
 */
export function calculatePaymentTermAmounts(totalAmount: number, percentages: number[]): number[] {
  const amounts = percentages.map((percentage) => calculatePaymentTermAmount(totalAmount, percentage));
  if (amounts.length > 0 && isFullPercentage(sumPercentages(percentages))) {
    const totalCents = Math.round(totalAmount * 100);
    const otherCents = amounts.slice(0, -1).reduce((sum, amount) => sum + Math.round(amount * 100), 0);
    amounts[amounts.length - 1] = (totalCents - otherCents) / 100;
  }
  return amounts;
}

/**
 * Recalculates the terms' amounts from the PO total. The API stores amounts
 * as "0.00", so the percentage is the source of truth; a term without a
 * percentage keeps whatever amount the API sent.
 */
export function withCalculatedAmounts(
  terms: PurchaseOrderPaymentTerm[],
  totalAmount: number,
): PurchaseOrderPaymentTerm[] {
  const amounts = calculatePaymentTermAmounts(
    totalAmount,
    terms.map((term) => term.percentage ?? 0),
  );
  return terms.map((term, index) => (term.percentage === null ? term : { ...term, amount: amounts[index] }));
}

/** Keeps a typed percentage to digits and up to two decimals ("12.345" → "12.34", "1a" → "1"). */
export function sanitizePercentageInput(text: string): string {
  const [whole, ...decimals] = text.replace(/[^\d.]/g, '').split('.');
  return decimals.length === 0 ? whole : `${whole}.${decimals.join('').slice(0, 2)}`;
}

/** "30" / "33.33" / "5." → a number; "" or "." → null. */
export function parsePercentage(text: string): number | null {
  if (text.trim() === '') {
    return null;
  }
  const percentage = Number(text);
  return Number.isFinite(percentage) ? percentage : null;
}

/** Sum of the drafts' percentages, treating a blank or invalid field as 0. */
export function sumDraftPercentages(drafts: PaymentTermDraft[]): number {
  return sumPercentages(drafts.map((draft) => parsePercentage(draft.percentageText) ?? 0));
}

/** The same drafts with their percentages spread evenly to total 100% (after adding or deleting a term). */
export function withEvenPercentages(drafts: PaymentTermDraft[]): PaymentTermDraft[] {
  const percentages = distributePercentagesEvenly(drafts.length);
  return drafts.map((draft, index) => ({ ...draft, percentageText: String(percentages[index]) }));
}

/** The first problem that should stop the terms being saved, or null when they're valid. */
export function validatePaymentTermDrafts(drafts: PaymentTermDraft[]): string | null {
  if (drafts.length === 0) {
    return 'Add at least one payment term.';
  }
  for (const [index, draft] of drafts.entries()) {
    const termLabel = `payment term ${index + 1}`;
    if (!draft.description.trim()) {
      return `Select a description for ${termLabel}.`;
    }
    const percentage = parsePercentage(draft.percentageText);
    if (percentage === null) {
      return `Enter a percentage for ${termLabel}.`;
    }
    if (percentage <= 0 || percentage > FULL_PERCENTAGE) {
      return `The percentage for ${termLabel} must be more than 0 and at most 100.`;
    }
  }
  const total = sumDraftPercentages(drafts);
  if (!isFullPercentage(total)) {
    return `Payment terms must total 100% (currently ${formatPercentage(total)}).`;
  }
  return null;
}
