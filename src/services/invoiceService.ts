import { SALESFORCE_INVOICES_URL } from '../constants/config';
import { AccountListResult } from '../types/list';
import { InvoiceApiRecord, InvoicesApiResponse, InvoicesView } from '../types';
import { Invoice } from '../types/invoice';
import { PurchaseOrderLedgerEntry } from '../types/purchaseOrder';
import { toNumber } from '../utils/toNumber';
import { salesforceGet } from './salesforceClient';

/** Maps one invoice (bookkeeping record) from the API to the app's Invoice. */
function toInvoice(record: InvoiceApiRecord, index: number): Invoice {
  return {
    id: record.id || record.invoiceId || `invoice-${index}`,
    invoiceNumber: record.invoiceNumber?.trim() ?? '',
    // Sent as vendorNumber (vendorInvoiceNumber in older responses).
    vendorInvoiceNumber: record.vendorNumber?.trim() || record.vendorInvoiceNumber?.trim() || '',
    // invoiceAmount is the invoice's own; totalAmount (older responses' amount) is now the PO's total.
    amount: toNumber(record.invoiceAmount ?? record.totalAmount),
    status: record.status?.trim() ?? '',
    // `project` is usually null; the job it's related to names the project then.
    projectName: (typeof record.project === 'string' && record.project.trim()) || record.relatedToJobName?.trim() || '',
  };
}

/**
 * The invoices against one purchase order, from GET /bookkeeping/fetch
 * (view=all, matched on jobPurchaseOrderId), as rows of the PO's invoice
 * table. Its invoiceAmount is the amount the PO detail API's records lack.
 */
export async function fetchPurchaseOrderInvoices(accountId: string, poId: string): Promise<PurchaseOrderLedgerEntry[]> {
  const data = await salesforceGet<InvoicesApiResponse>(SALESFORCE_INVOICES_URL, { accountId, view: 'all' });
  if (!data.success) {
    throw new Error(data.message || 'Unable to load invoices.');
  }
  return (data.invoices ?? [])
    .filter((record) => record.jobPurchaseOrderId === poId)
    .map((record, index) => {
      const invoice = toInvoice(record, index);
      return {
        id: invoice.id,
        name: invoice.invoiceNumber,
        vendorInvoiceNumber: invoice.vendorInvoiceNumber,
        status: invoice.status,
        amount: invoice.amount ?? 0,
        projectName: invoice.projectName,
      };
    });
}

/**
 * Fetches the account's invoices: view=recent returns the latest 5, view=all
 * returns every invoice. `count` is the account's total (totalRecords).
 */
export async function fetchInvoices(accountId: string, view: InvoicesView): Promise<AccountListResult<Invoice>> {
  const data = await salesforceGet<InvoicesApiResponse>(SALESFORCE_INVOICES_URL, { accountId, view });
  if (!data.success) {
    throw new Error(data.message || 'Unable to load invoices.');
  }
  const items = (data.invoices ?? []).map(toInvoice);
  return { items, count: data.totalRecords ?? items.length };
}
