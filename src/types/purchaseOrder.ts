import type { SignatureFontId } from '../constants/signatureFonts';

export interface PurchaseOrder {
  id: string;
  name: string;
  status: string;
  paidAmount: number;
  vendor: string;
  /** The PO's date (when it was created), as a local YYYY-MM-DD; null when unknown. */
  createdDate: string | null;
}

export interface PurchaseOrderLineItem {
  id: string;
  /** Groups the items, e.g. "HVAC Service". */
  category: string;
  productOrService: string;
  /** Plain text (the API sends rich text). */
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
}

export interface PurchaseOrderPaymentTerm {
  id: string;
  /** e.g. 25 for 25%. */
  percentage: number | null;
  description: string;
  amount: number | null;
}

/** A validated term to save: every field is required. */
export interface PaymentTermUpdate {
  description: string;
  percentage: number;
}

/** The vendor's signature on a signed PO, drawn on the PDF's "Vendor:" line. */
export interface PurchaseOrderSignature {
  /** The signer's full name, written in the chosen signature font. */
  name: string;
  fontId: SignatureFontId;
  /** Signing date as YYYY-MM-DD. */
  date: string;
}

/** A change order or invoice listed on a signed purchase order. */
export interface PurchaseOrderLedgerEntry {
  id: string;
  /** e.g. "CO-1001" or "BR-1001". */
  name: string;
  status: string;
  amount: number;
  /** Change orders only, e.g. "Labor and Material are included". */
  description?: string;
}

export interface PurchaseOrderDetail {
  id: string;
  name: string;
  status: string;
  project: string;
  /** One line, e.g. "666 Post Street, San Francisco, CA 94109". */
  projectAddress: string;
  totalAmount: number;
  lineItems: PurchaseOrderLineItem[];
  paymentTerms: PurchaseOrderPaymentTerm[];
  /** The PO's date, as YYYY-MM-DD, printed in the PDF's "Date :" box; null when unknown. */
  poDate: string | null;
  /** When the vendor signed, as YYYY-MM-DD; null when unknown or not signed. */
  signedDate: string | null;
  /** The signature made in this app on this device, if any (the API doesn't store it). */
  vendorSignature: PurchaseOrderSignature | null;
  /** null when they couldn't be loaded (the screen offers a retry). */
  changeOrders: PurchaseOrderLedgerEntry[] | null;
  /** null when they couldn't be loaded (the screen offers a retry). */
  invoices: PurchaseOrderLedgerEntry[] | null;
}

/** Line items grouped by category, in the order the categories first appear. */
export interface PurchaseOrderLineItemGroup {
  category: string;
  items: PurchaseOrderLineItem[];
}
