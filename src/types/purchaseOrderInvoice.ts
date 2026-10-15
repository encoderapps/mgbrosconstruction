/** What the Add Invoice form sends for a signed purchase order. Dates are YYYY-MM-DD. */
export interface NewPurchaseOrderInvoice {
  poId: string;
  /** The PO's job (Salesforce Opportunity); null when the PO detail didn't include it (it's looked up then). */
  opportunityId: string | null;
  /** The subcontractor's own invoice number, e.g. "VN-123121". */
  vendorInvoiceNumber: string;
  /** One of INVOICE_STATUS_OPTIONS. */
  status: string;
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
