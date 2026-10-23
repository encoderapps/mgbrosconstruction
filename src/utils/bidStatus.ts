import { Tone } from '../theme';

const TONES_BY_STATUS: Record<string, Tone> = {
  submitted: 'info',
  requested: 'warning',
  pending: 'warning',
  won: 'success',
  completed: 'success',
  draft: 'neutral',
  lost: 'danger',
};

/** Statuses after which a bid can no longer be changed. */
const CLOSED_STATUSES = new Set(['completed', 'won', 'lost']);

function normalise(status: string): string {
  return status.trim().toLowerCase();
}

/** The colour family for a bid status (case-insensitive); neutral for anything unrecognised. */
export function bidStatusTone(status: string): Tone {
  return TONES_BY_STATUS[normalise(status)] ?? 'neutral';
}

/** Whether the bid's line items can still be changed and the bid marked as complete. */
export function isBidEditable(status: string): boolean {
  return !CLOSED_STATUSES.has(normalise(status));
}

/** Sum of line item amounts, rounded to cents so float error never shows. */
export function sumBidLineItems(lineItems: readonly { amount: number }[]): number {
  return Math.round(lineItems.reduce((sum, item) => sum + item.amount * 100, 0)) / 100;
}
