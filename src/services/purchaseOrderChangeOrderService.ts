import { SALESFORCE_PURCHASE_ORDER_CHANGE_ORDERS_URL } from '../constants/config';
import {
  ChangeOrderApiRecord,
  PurchaseOrderChangeOrdersApiPayload,
  PurchaseOrderChangeOrdersApiResponse,
  PurchaseOrderInvoiceApiRecord,
} from '../types';
import { PurchaseOrderLedgerEntry } from '../types/purchaseOrder';
import { toNumber } from '../utils/toNumber';
import { salesforceSend } from './salesforceClient';

const DEFAULT_ERROR_MESSAGE = 'Unable to load the change orders for this purchase order.';

export interface PurchaseOrderChangeOrders {
  changeOrders: PurchaseOrderLedgerEntry[];
  invoices: PurchaseOrderLedgerEntry[];
}

function toChangeOrder(record: ChangeOrderApiRecord, index: number): PurchaseOrderLedgerEntry {
  return {
    id: record.id || `change-order-${index}`,
    name: record.changeOrderNo ?? '',
    status: record.status ?? '',
    amount: toNumber(record.amount) ?? 0,
    description: record.description?.trim() ?? '',
  };
}

/** NOTE: the invoice field names are assumed (see PurchaseOrderInvoiceApiRecord). */
function toInvoice(record: PurchaseOrderInvoiceApiRecord, index: number): PurchaseOrderLedgerEntry {
  return {
    id: record.id || `invoice-${index}`,
    name: record.invoiceNo ?? record.name ?? '',
    status: record.status ?? '',
    amount: toNumber(record.amount) ?? 0,
  };
}

/**
 * A purchase order's change orders and invoices (POST /purchaseorderchangeorder).
 * Throws an Error with a message fit to show the user if they can't be loaded.
 */
export async function fetchPurchaseOrderChangeOrders(
  accountId: string,
  poId: string,
): Promise<PurchaseOrderChangeOrders> {
  const payload: PurchaseOrderChangeOrdersApiPayload = { accountId, poId };
  const data = await salesforceSend<PurchaseOrderChangeOrdersApiResponse>(
    { method: 'post', url: SALESFORCE_PURCHASE_ORDER_CHANGE_ORDERS_URL, data: payload },
    DEFAULT_ERROR_MESSAGE,
  );
  if (!data.success) {
    // A PO signed only by the subcontractor ("Signed", not yet "Signed by both
    // sides") can't have change orders or invoices yet: show none, not an error.
    if (/\bnot signed\b/i.test(data.message ?? '')) {
      return { changeOrders: [], invoices: [] };
    }
    throw new Error(data.message || DEFAULT_ERROR_MESSAGE);
  }
  return {
    changeOrders: (data.changeOrders ?? []).map(toChangeOrder),
    invoices: (data.invoices ?? []).map(toInvoice),
  };
}
