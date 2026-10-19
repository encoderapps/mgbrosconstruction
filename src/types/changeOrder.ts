import type { SignatureFontId } from '../constants/signatureFonts';

/** What the purchase order's change-order table already knows about a change order (from the API). */
export interface ChangeOrderSummary {
  id: string;
  /** e.g. "CO#01". */
  name: string;
  /** e.g. "Draft", "Signed by Both Parties". */
  status: string;
  /** The change order's total, in dollars. */
  amount: number;
  description: string;
}

export interface ChangeOrderItem {
  id: string;
  /** Plain text (the API sends rich text). */
  description: string;
  /** e.g. "HVAC Service"; empty when unknown. */
  category: string;
  quantity: number;
  unitPrice: number;
  /** quantity × unitPrice, rounded to cents. */
  amount: number;
}

/** What the Add Change Order form sends: a new change order on a purchase order, always a Draft. */
export interface NewChangeOrder {
  poId: string;
  /** Always the Draft status: a change order starts as a Draft and only the backend moves it on. */
  status: string;
  /** The change order's amount, in dollars (> 0). */
  amount: number;
  description: string;
}

/** What the Add Line Item form sends. */
export type NewChangeOrderItem = Pick<ChangeOrderItem, 'description' | 'quantity' | 'unitPrice'>;

export interface ChangeOrderSignature {
  /** The signer's name as typed. */
  name: string;
  /** The handwriting style it's shown in. */
  fontId: SignatureFontId;
  /** YYYY-MM-DD. */
  date: string;
}

/** A change order with everything its screen shows. */
export interface ChangeOrderDetail extends ChangeOrderSummary {
  items: ChangeOrderItem[];
  /** e.g. "Labor and Material are included". */
  notes: string;
  /** null until the subcontractor signs it in the app. */
  signature: ChangeOrderSignature | null;
}
