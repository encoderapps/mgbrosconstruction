/** A signed PDF sent with a sign call, e.g. the signed purchase order. */
export interface SignedPdf {
  /** e.g. "Signed_PO_Job-PO_0001142.pdf". */
  fileName: string;
  /** The PDF, base64. */
  base64: string;
}
