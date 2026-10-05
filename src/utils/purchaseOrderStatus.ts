/** Only a PO waiting on the subcontractor's signature can be signed. */
export function isAwaitingSignature(status: string): boolean {
  return /ready for signature/i.test(status);
}

/** An invoice that has been paid in full ("Paid"), not "Unpaid" / "Not Paid" / "Partially Paid". */
export function isPaid(status: string): boolean {
  return /^\s*paid\s*$/i.test(status);
}

/** The colour family for a PO, change order or invoice status: done, waiting, or neither. */
export function statusTone(status: string): 'success' | 'warning' | null {
  if (isSigned(status) || isPaid(status)) {
    return 'success';
  }
  return isAwaitingSignature(status) ? 'warning' : null;
}

/** "Signed" / "Signed by both sides", but not "Unsigned" or "Not Signed". */
export function isSigned(status: string): boolean {
  return /\bsigned\b/i.test(status) && !/\bnot\s+signed\b/i.test(status);
}
