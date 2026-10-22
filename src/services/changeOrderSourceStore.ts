/*
 * The source ("Job Change Order", "My Job Change Order") the create API
 * returned for each change order made in this app, kept in memory (until the
 * app restarts). The PO's change-order list and the change order detail may
 * leave the source out; this fills it in so the right Add Line Item form shows.
 */
const sourceById = new Map<string, string>();

export function rememberChangeOrderSource(changeOrderId: string, source: string | null | undefined): void {
  const trimmed = source?.trim();
  if (changeOrderId && trimmed) {
    sourceById.set(changeOrderId, trimmed);
  }
}

/** The API's source when it sent one, else the one remembered from creating it; undefined when neither. */
export function changeOrderSource(changeOrderId: string, apiSource: string | null | undefined): string | undefined {
  return apiSource?.trim() || sourceById.get(changeOrderId);
}
