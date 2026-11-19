import { SALESFORCE_CREATE_INVOICE_URL, SALESFORCE_QUERY_URL } from '../constants/config';
import { CreateInvoiceApiPayload, CreateInvoiceApiResponse, SoqlQueryResponse } from '../types';
import {
  CreatedPurchaseOrderInvoice,
  NEW_INVOICE_STATUS,
  NewPurchaseOrderInvoice,
} from '../types/purchaseOrderInvoice';
import { isDateOnlyString, todayDateString } from '../utils/dateValidation';
import { salesforceGet, salesforceSend } from './salesforceClient';

const DEFAULT_ERROR_MESSAGE = 'Unable to create the invoice. Please try again.';

/** A Salesforce record Id: 15 or 18 letters and digits (checked before it goes into a query). */
const SALESFORCE_ID_PATTERN = /^[A-Za-z0-9]{15}(?:[A-Za-z0-9]{3})?$/;

/**
 * The job (Opportunity) a purchase order belongs to: its Job__c, read with a
 * SOQL query limited to the subcontractor's own POs. null when it has none.
 * Used when creating change orders on a PO.
 *
 * TODO: the PO detail API doesn't return the job yet. Once it returns
 * opportunityId (Job__c), this lookup is no longer called and can be removed.
 */
export async function fetchPurchaseOrderJobId(accountId: string, poId: string): Promise<string | null> {
  if (!SALESFORCE_ID_PATTERN.test(accountId) || !SALESFORCE_ID_PATTERN.test(poId)) {
    return null;
  }
  const data = await salesforceGet<SoqlQueryResponse<{ Job__c: string | null }>>(SALESFORCE_QUERY_URL, {
    q: `SELECT Job__c FROM Job_Purchase_Order__c WHERE Id = '${poId}' AND Vendor__c = '${accountId}' LIMIT 1`,
  });
  return data.records?.[0]?.Job__c || null;
}

/** "1,250.50" / "$150" → 1250.5 / 150; null unless it's a positive amount with at most 2 decimals. */
export function parseInvoiceAmount(value: string): number | null {
  const cleaned = value.replace(/[$,\s]/g, '');
  if (!/^\d+(\.\d{1,2})?$/.test(cleaned)) {
    return null;
  }
  const amount = Number(cleaned);
  return amount > 0 ? amount : null;
}

/**
 * Creates a Draft invoice on one of the account's signed purchase orders
 * (POST /bookkeeping/invoice/create) and returns it as created. Throws an
 * Error with a message fit to show the user if the input isn't valid or the
 * API doesn't create it.
 */
export async function createPurchaseOrderInvoice(
  accountId: string,
  input: NewPurchaseOrderInvoice,
): Promise<CreatedPurchaseOrderInvoice> {
  const amount = parseInvoiceAmount(input.amount);
  const vendorInvoiceNumber = input.vendorInvoiceNumber.trim();
  if (amount === null) {
    throw new Error('Please enter an amount greater than 0, e.g. 150 or 150.75.');
  }
  if (!vendorInvoiceNumber) {
    throw new Error('Please enter the vendor invoice number.');
  }
  if (!isDateOnlyString(input.dueDate)) {
    throw new Error('Please select a due date.');
  }
  // YYYY-MM-DD strings compare in date order.
  if (input.dueDate < todayDateString()) {
    throw new Error('The due date cannot be in the past.');
  }

  const payload: CreateInvoiceApiPayload = {
    jobPurchaseOrderId: input.poId,
    accountId,
    invoiceAmount: amount,
    vendorNumber: vendorInvoiceNumber,
    dueDate: input.dueDate,
  };
  const data = await salesforceSend<CreateInvoiceApiResponse>(
    { method: 'post', url: SALESFORCE_CREATE_INVOICE_URL, data: payload },
    DEFAULT_ERROR_MESSAGE,
  );
  if (!data.success) {
    throw new Error(data.message || DEFAULT_ERROR_MESSAGE);
  }
  const invoice = data.invoice;
  return {
    id: invoice?.id ?? '',
    invoiceNumber: invoice?.invoiceNumber?.trim() ?? '',
    vendorInvoiceNumber: invoice?.vendorInvoiceNumber?.trim() || vendorInvoiceNumber,
    status: invoice?.status?.trim() || NEW_INVOICE_STATUS,
    dueDate: invoice?.dueDate || input.dueDate,
  };
}
