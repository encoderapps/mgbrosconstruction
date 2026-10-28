import { SALESFORCE_PURCHASE_ORDER_DETAIL_URL } from '../constants/config';
import {
  PurchaseOrderDetailApiResponse,
  PurchaseOrderLineItemApiRecord,
  PurchaseOrderPaymentTermApiRecord,
} from '../types';
import {
  PurchaseOrderDetail,
  PurchaseOrderLineItem,
  PurchaseOrderPaymentTerm,
  SignatureOnFile,
} from '../types/purchaseOrder';
import { decodeHtmlEntities, htmlToPlainText } from '../utils/html';
import { withCalculatedAmounts } from '../utils/paymentTerms';
import { isSigned } from '../utils/purchaseOrderStatus';
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

type PurchaseOrderApiRecord = NonNullable<PurchaseOrderDetailApiResponse['purchaseOrder']>;

/** The registration signature the API returns with the PO, or null when it doesn't return a complete one. */
function toSignatureOnFile(po: PurchaseOrderApiRecord): SignatureOnFile | null {
  const name = po.subcontractorFullName?.trim();
  const imageBase64 = po.signatureBase64Data?.replace(/\s/g, '');
  if (!name || !imageBase64) {
    return null;
  }
  return {
    name,
    imageBase64,
    initialsImageBase64: po.signatureInitialsBase64Data?.replace(/\s/g, '') ?? '',
    date: po.signedDate || null,
  };
}

/**
 * The signed PO PDF to show: the newest of signedPurchaseOrderFiles, else the
 * older pdfBase64Data field. Any "data:application/pdf;base64," prefix and line
 * breaks are stripped, so it can be written straight to a file.
 */
function toSignedPdfBase64(po: PurchaseOrderApiRecord): string | null {
  const newestFile = (po.signedPurchaseOrderFiles ?? [])
    .filter((file) => file.pdfBase64Data)
    .sort((a, b) => (b.signedDate ?? '').localeCompare(a.signedDate ?? ''))[0];
  const base64 = newestFile?.pdfBase64Data || po.pdfBase64Data;
  return base64?.replace(/^data:[^,]*,/, '').replace(/\s/g, '') || null;
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
  const signatureOnFile = toSignatureOnFile(po);
  // When the vendor has signed, the API's date of signing and its signature on file are the PO's signature.
  const hasVendorSigned = !!po.vendorSigned || isSigned(po.status ?? '');
  const vendorSignedDate = hasVendorSigned ? po.vendorSignedDate || po.signedDate || null : null;
  const signedPdfBase64 = toSignedPdfBase64(po);
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
    signedDate: vendorSignedDate,
    vendorSignature:
      vendorSignedDate && signatureOnFile
        ? { name: signatureOnFile.name, fontId: null, imageBase64: signatureOnFile.imageBase64, date: vendorSignedDate }
        : null,
    signatureOnFile,
    // A signed file from signedPurchaseOrderFiles means it's signed, even if the status lags behind.
    signedPdfBase64: hasVendorSigned || po.signedPurchaseOrderFiles?.length ? signedPdfBase64 : null,
    opportunityId: po.opportunityId?.trim() || null,
    // NOTE: the detail API doesn't return these. usePurchaseOrderDetail adds the PO
    // date (from the Purchase Orders list), a signature made on this device (for POs
    // the API has no signature for) and the change orders and invoices.
    poDate: null,
    changeOrders: null,
    invoices: null,
  };
}
