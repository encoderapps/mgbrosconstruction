/** A new invoice is always created as a Draft. */
export const NEW_INVOICE_STATUS = 'Draft';

/** What the Add Invoice form sends for a signed purchase order. */
export interface NewPurchaseOrderInvoice {
  poId: string;
  /** As typed, e.g. "150" or "1,250.50"; checked and parsed by the service. */
  amount: string;
  /** The subcontractor's own invoice number, e.g. "INV-0017655". */
  vendorInvoiceNumber: string;
  /** YYYY-MM-DD. */
  dueDate: string;
}

/** An invoice as the create API returns it. */
export interface CreatedPurchaseOrderInvoice {
  id: string;
  /** Assigned by Salesforce, e.g. "INV-000004661"; empty if the API leaves it out. */
  invoiceNumber: string;
  vendorInvoiceNumber: string;
  status: string;
  /** YYYY-MM-DD. */
  dueDate: string;
}
