import { SALESFORCE_MODIFY_PAYMENT_TERMS_URL } from '../constants/config';
import { ModifyPaymentTermsApiPayload, ModifyPaymentTermsApiResponse } from '../types';
import { PaymentTermUpdate, PurchaseOrderPaymentTerm } from '../types/purchaseOrder';
import { parsePaymentTerms } from './purchaseOrderDetailService';
import { salesforceSend } from './salesforceClient';

const DEFAULT_ERROR_MESSAGE = 'Unable to update the payment terms. Please try again.';

export interface ModifyPaymentTermsResult {
  paymentTerms: PurchaseOrderPaymentTerm[];
  message: string;
}

/** The PATCH /modifyPaymentTerms request body. */
export function buildModifyPaymentTermsPayload(
  accountId: string,
  poId: string,
  terms: PaymentTermUpdate[],
): ModifyPaymentTermsApiPayload {
  return {
    accountId,
    poId,
    paymentTerms: terms.map((term) => ({
      percentage: term.percentage,
      description: term.description,
    })),
  };
}

/**
 * Replaces a purchase order's payment terms (PATCH /modifyPaymentTerms) and
 * returns the saved terms from the response's paymentTermsList. Throws an
 * Error with a message fit to show the user when the update didn't happen.
 */
export async function modifyPaymentTerms(
  accountId: string,
  poId: string,
  terms: PaymentTermUpdate[],
): Promise<ModifyPaymentTermsResult> {
  const data = await salesforceSend<ModifyPaymentTermsApiResponse>(
    { method: 'patch', url: SALESFORCE_MODIFY_PAYMENT_TERMS_URL, data: buildModifyPaymentTermsPayload(accountId, poId, terms) },
    DEFAULT_ERROR_MESSAGE,
  );
  if (!data.success) {
    throw new Error(data.message || DEFAULT_ERROR_MESSAGE);
  }
  if (!Array.isArray(data.paymentTermsList)) {
    throw new Error(DEFAULT_ERROR_MESSAGE);
  }
  return {
    paymentTerms: parsePaymentTerms(data.paymentTermsList),
    message: data.message || 'Payment terms updated successfully.',
  };
}
