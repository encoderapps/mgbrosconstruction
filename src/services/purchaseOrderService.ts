import { SALESFORCE_PURCHASE_ORDERS_URL } from '../constants/config';
import { AccountListResult } from '../types/list';
import { PurchaseOrderApiRecord, PurchaseOrdersApiResponse, PurchaseOrdersView } from '../types';
import { PurchaseOrder } from '../types/purchaseOrder';
import { timestampToLocalDate } from '../utils/dateValidation';
import { salesforceGet } from './salesforceClient';

function toPurchaseOrder(record: PurchaseOrderApiRecord): PurchaseOrder {
  return {
    id: record.id,
    name: record.name ?? '',
    status: record.status ?? '',
    paidAmount: record.paidAmount ?? 0,
    vendor: record.vendor ?? '',
    createdDate: timestampToLocalDate(record.createdDate),
  };
}

/**
 * Fetches the account's purchase orders: view=home returns the latest 5,
 * view=all returns every one. `count` is the number returned.
 */
export async function fetchPurchaseOrders(
  accountId: string,
  view: PurchaseOrdersView,
): Promise<AccountListResult<PurchaseOrder>> {
  const data = await salesforceGet<PurchaseOrdersApiResponse>(SALESFORCE_PURCHASE_ORDERS_URL, { accountId, view });
  if (!data.success) {
    throw new Error(data.message || 'Unable to load purchase orders.');
  }
  const items = (data.purchaseOrders ?? []).map(toPurchaseOrder);
  return { items, count: data.count ?? items.length };
}
