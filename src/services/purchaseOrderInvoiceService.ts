import { SALESFORCE_CREATE_INVOICE_URL, SALESFORCE_QUERY_URL } from '../constants/config';
import { CreateInvoiceApiPayload, CreateInvoiceApiResponse, SoqlQueryResponse } from '../types';
import { CreatedPurchaseOrderInvoice, NewPurchaseOrderInvoice } from '../types/purchaseOrderInvoice';
import { isDateOnlyString, todayDateString } from '../utils/dateValidation';
import { salesforceGet, salesforceSend } from './salesforceClient';

const DEFAULT_ERROR_MESSAGE = 'Unable to create the invoice. Please try again.';

const JOB_NOT_FOUND_MESSAGE = 'This purchase order is not linked to a job, so an invoice cannot be added to it.';
/** A Salesforce record Id: 15 or 18 letters and digits (checked before it goes into a query). */
const SALESFORCE_ID_PATTERN = /^[A-Za-z0-9]{15}(?:[A-Za-z0-9]{3})?$/;

/**
 * The job (Opportunity) a purchase order belongs to: its Job__c, read with a
 * SOQL query limited to the subcontractor's own POs. null when it has none.
 * Used when creating invoices and change orders on a PO.
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

/**
 * Creates an invoice on one of the account's signed purchase orders
 * (POST /invoices/create), dated today, and returns it as created. Throws an
 * Error with a message fit to show the user if the input isn't valid or the
 * API doesn't create it.
 */
export async function createPurchaseOrderInvoice(
  accountId: string,
  input: NewPurchaseOrderInvoice,
): Promise<CreatedPurchaseOrderInvoice> {
  const vendorInvoiceNumber = input.vendorInvoiceNumber.trim();
  const status = input.status.trim();
  const createdDate = todayDateString();
  if (!vendorInvoiceNumber) {
    throw new Error('Please enter the vendor invoice number.');
  }
  if (!status) {
    throw new Error('Please select a status.');
  }
  if (!isDateOnlyString(input.dueDate)) {
    throw new Error('Please select a due date.');
  }
  // YYYY-MM-DD strings compare in date order.
  if (input.dueDate < createdDate) {
    throw new Error('The due date cannot be in the past.');
  }

  // The API requires the PO's job.
  let opportunityId = input.opportunityId;
  if (!opportunityId) {
    try {
      opportunityId = await fetchPurchaseOrderJobId(accountId, input.poId);
    } catch (error) {
      console.error('Failed to look up the purchase order job:', error);
      throw new Error(DEFAULT_ERROR_MESSAGE);
    }
  }
  if (!opportunityId) {
    throw new Error(JOB_NOT_FOUND_MESSAGE);
  }

  const payload: CreateInvoiceApiPayload = {
    poId: input.poId,
    opportunityId,
    vendorInvoiceNumber,
    createdDate,
    dueDate: input.dueDate,
    status,
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
    status: invoice?.status?.trim() || status,
    dueDate: invoice?.dueDate || input.dueDate,
  };
}
