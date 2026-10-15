/** "Job-PO#0001142" → "Job-PO_0001142": letters, digits and dashes, other runs as one underscore. */
function toFileNamePart(text: string): string {
  return text
    .trim()
    .replace(/[^A-Za-z0-9-]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

/** "Job-PO#0001142" → "Signed_PO_Job-PO_0001142.pdf". */
export function signedPurchaseOrderFileName(purchaseOrderName: string): string {
  return `Signed_PO_${toFileNamePart(purchaseOrderName) || 'Purchase_Order'}.pdf`;
}

/** "Job-CO#0000556", "Bennett Mechanical Solutions" → "Signed_CO_Job-CO_0000556_Bennett_Mechanical_Solutions.pdf". */
export function signedChangeOrderFileName(changeOrderName: string, companyName: string): string {
  const parts = [toFileNamePart(changeOrderName), toFileNamePart(companyName)].filter(Boolean);
  return `Signed_CO_${parts.join('_') || 'Change_Order'}.pdf`;
}
