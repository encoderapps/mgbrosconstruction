import { ChangeOrderDetail, ChangeOrderSignature, ChangeOrderSummary } from '../types/changeOrder';
import { isAwaitingSignature, isPendingApproval, isRejected, isSigned } from './purchaseOrderStatus';

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

/** A loaded change order's latest list-level fields, to pass to the next change-order screen. */
export function toChangeOrderSummary({ id, name, status, amount, description }: ChangeOrderSummary): ChangeOrderSummary {
  return { id, name, status, amount, description };
}

/**
 * Where a change order is in its workflow:
 * Draft → (approval requested) Pending Approval → Ready For Signature → Signed,
 * or Rejected when the approval request is refused. Anything else is `unknown`
 * and gets no actions.
 */
export type ChangeOrderStage = 'draft' | 'pendingApproval' | 'rejected' | 'readyForSignature' | 'signed' | 'unknown';

/**
 * The workflow stage for a change order's status, as the backend reports it
 * (the backend is the source of truth; a signature is only known once the
 * signing API has confirmed it).
 */
export function changeOrderStage(changeOrder: {
  status: string;
  signature?: ChangeOrderSignature | null;
}): ChangeOrderStage {
  const { status } = changeOrder;
  if (isChangeOrderSigned({ status, signature: changeOrder.signature ?? null })) {
    return 'signed';
  }
  if (isRejected(status)) {
    return 'rejected';
  }
  // Before the pending check, so "Ready for Signature" never reads as waiting.
  if (isAwaitingSignature(status)) {
    return 'readyForSignature';
  }
  if (isPendingApproval(status)) {
    return 'pendingApproval';
  }
  return /^\s*draft\s*$/i.test(status) ? 'draft' : 'unknown';
}
