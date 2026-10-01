import { SALESFORCE_INVOICES_URL } from '../constants/config';
import { AccountListResult } from '../types/list';
import { InvoiceApiRecord, InvoicesApiResponse, InvoicesView } from '../types';
import { Invoice } from '../types/invoice';
import { salesforceGet } from './salesforceClient';

/**
 * Maps one invoice from the API to the app's Invoice.
 * NOTE: the field names below are assumed — the sandbox accounts tested so far
 * returned no invoices. Adjust them to match the real response.
 */
function toInvoice(record: InvoiceApiRecord, index: number): Invoice {
  return {
    id: record.invoiceId ?? record.id ?? `invoice-${index}`,
    company: record.company ?? '',
    toFrom: record.toFrom ?? '',
    status: record.status ?? '',
    vendorNumber: record.vendorNumber ?? '',
  };
}

/**
 * Fetches the account's invoices: view=recent returns the latest 5, view=all
 * returns every invoice. `count` is the account's total (totalInvoices).
 */
export async function fetchInvoices(accountId: string, view: InvoicesView): Promise<AccountListResult<Invoice>> {
  const data = await salesforceGet<InvoicesApiResponse>(SALESFORCE_INVOICES_URL, { accountId, view });
  if (!data.success) {
    throw new Error(data.message || 'Unable to load invoices.');
  }
  const items = (data.invoices ?? []).map(toInvoice);
  return { items, count: data.totalInvoices ?? items.length };
}
