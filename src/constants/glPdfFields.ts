/**
 * Coordinates for the 4 General Liability values drawn onto the ACORD 25
 * template (see src/assets/pdf/glCertificateTemplate.ts). Derived by
 * extracting the exact text positions already on that PDF page (its own
 * "POLICY NUMBER"/"POLICY EFF"/"POLICY EXP" column headers, and the sample
 * Workers Comp row, which shares those same columns) using pdfjs-dist.
 *
 * The PDF page is 612 x 792 points, origin bottom-left (pdf-lib uses the
 * same origin, so these coordinates are used as-is with no axis flipping).
 *
 * `rect` is a whiteout box drawn first to cover any existing sample value in
 * that cell. `text` is where the new value is drawn (baseline x/y).
 * Re-measure with the same pdfjs-dist technique if the template PDF changes.
 */
export const GL_PDF_FIELDS = {
  insuranceCompanyName: {
    rect: { x: 352, y: 596, width: 186, height: 12 },
    text: { x: 354, y: 599, fontSize: 9, maxWidth: 180 },
  },
  policyNumber: {
    rect: { x: 213, y: 452, width: 116, height: 12 },
    text: { x: 216, y: 456, fontSize: 9, maxWidth: 110 },
  },
  effectiveDate: {
    rect: { x: 330, y: 452, width: 49, height: 12 },
    text: { x: 333, y: 456, fontSize: 8, maxWidth: 45 },
  },
  expirationDate: {
    rect: { x: 378, y: 452, width: 49, height: 12 },
    text: { x: 381, y: 456, fontSize: 8, maxWidth: 45 },
  },
} as const;
