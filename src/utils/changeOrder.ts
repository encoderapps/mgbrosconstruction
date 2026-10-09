import { ChangeOrderDetail } from '../types/changeOrder';
import { isSigned } from './purchaseOrderStatus';

export function roundToCents(value: number): number {
  return Math.round(value * 100) / 100;
}

/**
 * quantity × unit price in dollars, rounded half-up to the cent. Both have at
 * most 2 decimals, so it's worked out in whole cents: 2.5 × $33.33 is exactly
 * $83.325 → $83.33 (plain floating point gives 83.32499… → $83.32).
 */
export function lineItemAmount(quantity: number, unitPrice: number): number {
  const quantityHundredths = Math.round(quantity * 100);
  const priceCents = Math.round(unitPrice * 100);
  return Math.round((quantityHundredths * priceCents) / 100) / 100;
}

/** Signed in this app, or already signed according to the API; either way it can't be changed. */
export function isChangeOrderSigned(changeOrder: Pick<ChangeOrderDetail, 'status' | 'signature'>): boolean {
  return changeOrder.signature !== null || isSigned(changeOrder.status);
}
