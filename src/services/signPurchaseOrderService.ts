import { SALESFORCE_SIGN_PURCHASE_ORDER_URL } from '../constants/config';
import { SignPurchaseOrderApiPayload, SignPurchaseOrderApiResponse } from '../types';
import { salesforceSend } from './salesforceClient';

const DEFAULT_ERROR_MESSAGE = 'Unable to sign the purchase order. Please try again.';
/** Used if a successful response leaves out the new status. */
const SIGNED_STATUS = 'Signed';

export interface SignPurchaseOrderResult {
  /** The PO's status after signing, as the API reports it. */
  status: string;
  message: string;
}

/**
 * Signs a purchase order for the subcontractor's account (PATCH /signPurchaseOrder).
 * Only a response with `success: true` counts as signed; anything else throws
 * an Error with a message fit to show the user.
 */
export async function signPurchaseOrder(accountId: string, poId: string): Promise<SignPurchaseOrderResult> {
  const payload: SignPurchaseOrderApiPayload = { accountId, poId };
  const data = await salesforceSend<SignPurchaseOrderApiResponse>(
    { method: 'patch', url: SALESFORCE_SIGN_PURCHASE_ORDER_URL, data: payload },
    DEFAULT_ERROR_MESSAGE,
  );
  if (!data.success) {
    throw new Error(data.message || DEFAULT_ERROR_MESSAGE);
  }
  return {
    status: data.status || SIGNED_STATUS,
    message: data.message || 'Purchase Order signed successfully.',
  };
}
