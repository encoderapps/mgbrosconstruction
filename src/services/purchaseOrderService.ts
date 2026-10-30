import { SALESFORCE_PURCHASE_ORDERS_URL } from '../constants/config';
import { AccountListResult } from '../types/list';
import {
  PurchaseOrderApiRecord,
  PurchaseOrderListChangeOrderApiRecord,
  PurchaseOrdersApiResponse,
  PurchaseOrdersView,
} from '../types';
import { PurchaseOrder, PurchaseOrderListChangeOrder } from '../types/purchaseOrder';
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
    totalAmount: record.totalAmount ?? 0,
    projectName: record.projectName ?? '',
  };
}

function toChangeOrder(
  record: PurchaseOrderListChangeOrderApiRecord,
  poIdsByName: Map<string, string>,
): PurchaseOrderListChangeOrder {
  const purchaseOrderName = record.purchaseOrderName ?? '';
  return {
    id: record.id,
    name: record.name ?? '',
    status: record.status ?? '',
    totalAmount: record.totalAmount ?? 0,
    ...(record.source && { source: record.source }),
    purchaseOrderName,
    purchaseOrderId: poIdsByName.get(purchaseOrderName) ?? null,
    projectName: record.projectName ?? '',
  };
}

async function requestPurchaseOrders(accountId: string, view: PurchaseOrdersView): Promise<PurchaseOrdersApiResponse> {
  const data = await salesforceGet<PurchaseOrdersApiResponse>(SALESFORCE_PURCHASE_ORDERS_URL, { accountId, view });
  if (!data.success) {
    throw new Error(data.message || 'Unable to load purchase orders.');
  }
  return data;
}

function countOf(data: PurchaseOrdersApiResponse): number {
  return data.count ?? data.purchaseOrders?.length ?? 0;
}

/**
 * Fetches the account's purchase orders: view=home returns the latest 5,
 * view=all returns every one. `count` is the account's total either way: the
 * API's count for view=home is only the number returned, so it's read from
 * view=all, requested alongside. That lookup is best-effort; if it fails the
 * list still loads, with the returned count.
 */
export async function fetchPurchaseOrders(
  accountId: string,
  view: PurchaseOrdersView,
): Promise<AccountListResult<PurchaseOrder>> {
  const [data, all] = await Promise.all([
    requestPurchaseOrders(accountId, view),
    view === 'all' ? null : requestPurchaseOrders(accountId, 'all').catch(() => null),
  ]);
  const items = (data.purchaseOrders ?? []).map(toPurchaseOrder);
  return { items, count: countOf(all ?? data) };
}

export interface AllPurchaseOrdersResult extends AccountListResult<PurchaseOrder> {
  /** Every PO's change orders, together. */
  changeOrders: PurchaseOrderListChangeOrder[];
}

/**
 * Every purchase order (view=all) plus the change orders the API lists
 * alongside them. The API names each change order's PO but not its Id, so
 * that's looked up from the returned POs.
 */
export async function fetchAllPurchaseOrders(accountId: string): Promise<AllPurchaseOrdersResult> {
  const data = await requestPurchaseOrders(accountId, 'all');
  const items = (data.purchaseOrders ?? []).map(toPurchaseOrder);
  const poIdsByName = new Map(items.map((order) => [order.name, order.id]));
  const changeOrders = (data.changeOrders ?? []).map((record) => toChangeOrder(record, poIdsByName));
  return { items, count: countOf(data), changeOrders };
}
