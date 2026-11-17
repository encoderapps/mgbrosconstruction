/** Only a PO waiting on the subcontractor's signature can be signed. */
export function isAwaitingSignature(status: string): boolean {
  return /ready for signature/i.test(status);
}

/** An invoice that has been paid in full ("Paid"), not "Unpaid" / "Not Paid" / "Partially Paid". */
export function isPaid(status: string): boolean {
  return /^\s*paid\s*$/i.test(status);
}

/**
 * A change order submitted for approval and not yet decided, e.g. "Pending
 * Approval", "Awaiting Approval" or "Submitted". The exact value is the
 * backend's; this only recognises it.
 */
export function isPendingApproval(status: string): boolean {
  return /\bpending\b|\bawaiting\s+approval\b|\bsubmitted\b/i.test(status);
}

/** "Rejected" / "Approval Rejected". */
export function isRejected(status: string): boolean {
  return /\brejected\b/i.test(status);
}

/** The colour family for a PO, change order or invoice status: done, waiting, refused, or neither. */
export function statusTone(status: string): 'success' | 'warning' | 'danger' | null {
  if (isSigned(status) || isPaid(status)) {
    return 'success';
  }
  if (isRejected(status)) {
    return 'danger';
  }
  return isAwaitingSignature(status) || isPendingApproval(status) ? 'warning' : null;
}

/** "Signed" / "Signed by both sides", but not "Unsigned" or "Not Signed". */
export function isSigned(status: string): boolean {
  return /\bsigned\b/i.test(status) && !/\bnot\s+signed\b/i.test(status);
}

/** "  Signed  by Both Sides " → "signed by both sides", so statuses compare exactly but loosely. */
function normaliseStatus(status: string): string {
  return status.trim().replace(/\s+/g, ' ').toLowerCase();
}

/** The statuses whose tables come first on the Purchase Orders screen, in display order. */
const STATUS_GROUP_ORDER = ['ready for signature', 'signed', 'draft', 'signed by both sides'];

/**
 * Statuses the backend uses internally (e.g. a freshly created "New" PO) that
 * get no table on the Purchase Orders screen; their POs are left out.
 */
const HIDDEN_STATUSES = new Set(['new']);

/** Shown for a PO whose status is blank. */
export const NO_STATUS_LABEL = 'No Status';

export interface PurchaseOrderStatusGroup<Order> {
  /** Unique per group: the normalised status ('' for no status). */
  key: string;
  /** The status as the API spells it (from its first PO), or NO_STATUS_LABEL. */
  status: string;
  orders: Order[];
}

/**
 * Splits POs (and change orders) into one group per status: Ready for
 * Signature, Signed, Draft and Signed by both sides first (in that order), then any other status in the order it
 * first appears, then POs with no status. Statuses match ignoring case and
 * spacing, but exactly, so "Signed" and "Signed by both sides" stay apart.
 * Each group keeps the POs' original order; statuses with no POs are left out,
 * as are POs with a hidden status ("New").
 */
export function groupPurchaseOrdersByStatus<Order extends { status: string }>(
  orders: readonly Order[],
): PurchaseOrderStatusGroup<Order>[] {
  const groups = new Map<string, PurchaseOrderStatusGroup<Order>>();
  for (const order of orders) {
    const key = normaliseStatus(order.status);
    if (HIDDEN_STATUSES.has(key)) {
      continue;
    }
    const group = groups.get(key);
    if (group) {
      group.orders.push(order);
    } else {
      groups.set(key, { key, status: order.status.trim() || NO_STATUS_LABEL, orders: [order] });
    }
  }

  const rank = (key: string): number => {
    const index = STATUS_GROUP_ORDER.indexOf(key);
    if (index !== -1) {
      return index;
    }
    return key ? STATUS_GROUP_ORDER.length : STATUS_GROUP_ORDER.length + 1;
  };
  // Array.prototype.sort is stable, so other statuses keep their first-appearance order.
  return [...groups.values()].sort((a, b) => rank(a.key) - rank(b.key));
}
