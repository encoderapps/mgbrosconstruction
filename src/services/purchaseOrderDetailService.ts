import { SALESFORCE_PURCHASE_ORDER_DETAIL_URL } from '../constants/config';
import {
  PurchaseOrderDetailApiResponse,
  PurchaseOrderLineItemApiRecord,
  PurchaseOrderPaymentTermApiRecord,
} from '../types';
import { PurchaseOrderDetail, PurchaseOrderLineItem, PurchaseOrderPaymentTerm } from '../types/purchaseOrder';
import { decodeHtmlEntities, htmlToPlainText } from '../utils/html';
import { withCalculatedAmounts } from '../utils/paymentTerms';
import { toNumber } from '../utils/toNumber';
import { salesforceGet } from './salesforceClient';

/**
 * The API sends paymentTerms as an HTML-escaped JSON string; accept a real
 * array too. Malformed data yields no terms rather than failing the screen.
 */
export function parsePaymentTerms(
  raw: string | PurchaseOrderPaymentTermApiRecord[] | null | undefined,
): PurchaseOrderPaymentTerm[] {
  let records: unknown = raw;
  if (typeof raw === 'string') {
    try {
      records = JSON.parse(decodeHtmlEntities(raw));
    } catch {
      return [];
    }
  }
  if (!Array.isArray(records)) {
    return [];
  }

  return (records as unknown[])
    // A null or non-object entry would otherwise throw and fail the whole screen.
    .filter((record): record is PurchaseOrderPaymentTermApiRecord => typeof record === 'object' && record !== null)
    .map((record, index) => ({
      id: record.id ?? `term-${index}`,
      percentage: toNumber(record.percentage),
      // The API sends `false` for a term without a description.
      description: typeof record.description === 'string' ? htmlToPlainText(record.description) : '',
      amount: toNumber(record.amount),
    }));
}

function toLineItem(record: PurchaseOrderLineItemApiRecord, index: number): PurchaseOrderLineItem {
  return {
    id: `item-${index}`,
    category: record.category ?? '',
    productOrService: record.productOrService ?? '',
    description: record.description ? htmlToPlainText(record.description) : '',
    quantity: toNumber(record.quantity) ?? 0,
    unitPrice: toNumber(record.unitPrice) ?? 0,
    amount: toNumber(record.amount) ?? 0,
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
  const lineItems = (po.poDetails ?? []).map(toLineItem);
  const lineItemsTotal = lineItems.reduce((sum, item) => sum + item.amount, 0);
  // Some POs report a total of 0 despite having priced line items; fall back to their sum.
  const totalAmount = po.totalAmount || lineItemsTotal;

  return {
    id: po.id,
    name: po.name ?? '',
    status: po.status ?? '',
    project: po.project ?? '',
    projectAddress: [address?.street, cityLine].filter(Boolean).join(', '),
    totalAmount,
    lineItems,
    paymentTerms: withCalculatedAmounts(parsePaymentTerms(po.paymentTerms), totalAmount),
    // NOTE: the detail API doesn't return these. usePurchaseOrderDetail adds the PO
    // date (from the Purchase Orders list), the signing (from this device) and the
    // change orders and invoices (from the change order API).
    poDate: null,
    signedDate: null,
    vendorSignature: null,
    changeOrders: null,
    invoices: null,
  };
}
