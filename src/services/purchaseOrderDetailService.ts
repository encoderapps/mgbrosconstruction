import { SALESFORCE_PURCHASE_ORDER_DETAIL_URL } from '../constants/config';
import { PurchaseOrderDetailApiResponse, PurchaseOrderPaymentTermApiRecord } from '../types';
import { PurchaseOrderDetail, PurchaseOrderPaymentTerm } from '../types/purchaseOrder';
import { salesforceGet } from './salesforceClient';

/**
 * NOTE: the payment-term field names are assumed — every purchase order
 * tested so far returned an empty paymentTerms list. Adjust to match.
 */
function toPaymentTerm(record: PurchaseOrderPaymentTermApiRecord, index: number): PurchaseOrderPaymentTerm {
  return {
    id: record.id ?? `term-${index}`,
    percentage: record.percentage ?? null,
    description: record.description ?? '',
    amount: record.amount ?? null,
  };
}

/** Fetches one purchase order's details (GET /purchaseorderdetail?poId=…&accountId=…). */
export async function fetchPurchaseOrderDetail(accountId: string, poId: string): Promise<PurchaseOrderDetail> {
  const data = await salesforceGet<PurchaseOrderDetailApiResponse>(SALESFORCE_PURCHASE_ORDER_DETAIL_URL, {
    poId,
    accountId,
  });
  const po = data.purchaseOrder;
  if (!data.success || !po) {
    throw new Error(data.message || 'Unable to load this purchase order.');
  }

  const address = po.projectAddress;
  const cityLine = [address?.city, [address?.state, address?.postalCode].filter(Boolean).join(' ')]
    .filter(Boolean)
    .join(', ');
  return {
    id: po.id,
    name: po.name ?? '',
    status: po.status ?? '',
    project: po.project ?? '',
    projectAddress: [address?.street, cityLine].filter(Boolean).join(', '),
    totalAmount: po.totalAmount ?? 0,
    paymentTerms: (po.paymentTerms ?? []).map(toPaymentTerm),
  };
}
