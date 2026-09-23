/**
 * Coordinates for the 4 Workers Comp values drawn onto the ACORD 25
 * template (see src/assets/pdf/acordCertificateTemplate.ts) — the SAME
 * certificate used for General Liability (see glPdfFields.ts), since ACORD
 * 25 is a single page with every coverage type in its own row. Derived by
 * extracting the exact text positions already on that PDF's Workers
 * Compensation row using pdfjs-dist:
 *   - "WC PC 774459-000" (policy number) at x=216, y=274.8
 *   - "05/19/2025" / "05/19/2026" (eff/exp dates) at x=333.6 / x=381.6, y=274.8
 *   - "WORKERS COMPENSATION" / "AND EMPLOYERS' LIABILITY" row labels at
 *     y=278.88 / y=271.92, bracketing that same data row
 *
 * The page is 612 x 792 points, origin bottom-left (pdf-lib uses the same
 * origin, so these coordinates are used as-is with no axis flipping).
 *
 * `insuranceCompanyName` reuses the exact same "INSURER A" field as
 * glPdfFields.ts — there is only one such field on the page, so both the GL
 * and WC template generators point at it (they each produce their own
 * independent output PDF, so there's no conflict between the two).
 *
 * `rect` is a whiteout box drawn first to cover any existing sample value in
 * that cell. `text` is where the new value is drawn (baseline x/y).
 * Re-measure with the same pdfjs-dist technique if the template PDF changes.
 */
export const WC_PDF_FIELDS = {
  insuranceCompanyName: {
    rect: { x: 352, y: 596, width: 186, height: 12 },
    text: { x: 354, y: 599, fontSize: 9, maxWidth: 180 },
  },
  policyNumber: {
    rect: { x: 213, y: 270, width: 116, height: 12 },
    text: { x: 216, y: 275, fontSize: 9, maxWidth: 110 },
  },
  effectiveDate: {
    rect: { x: 330, y: 270, width: 49, height: 12 },
    text: { x: 333, y: 275, fontSize: 8, maxWidth: 45 },
  },
  expirationDate: {
    rect: { x: 378, y: 270, width: 49, height: 12 },
    text: { x: 381, y: 275, fontSize: 8, maxWidth: 45 },
  },
} as const;
