/** Text fields are empty, and the amount null, when the API leaves them out (the table shows a dash). */
export interface Invoice {
  id: string;
  invoiceNumber: string;
  vendorInvoiceNumber: string;
  /** In dollars; null when the API didn't send one (not 0, which would read as a real amount). */
  amount: number | null;
  status: string;
}
