/** Only a PO waiting on the subcontractor's signature can be signed. */
export function isAwaitingSignature(status: string): boolean {
  return /ready for signature/i.test(status);
}

/** "Signed" / "Signed by both sides", but not "Unsigned" or "Not Signed". */
export function isSigned(status: string): boolean {
  return /\bsigned\b/i.test(status) && !/\bnot\s+signed\b/i.test(status);
}
