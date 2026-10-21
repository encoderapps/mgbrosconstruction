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

/** What the Add Change Order form sends: a new change order on a purchase order (always created as a Draft). */
export interface NewChangeOrder {
  poId: string;
  /** The PO's job, when the PO detail sent it; looked up otherwise. */
  opportunityId: string | null;
  /** The change order's amount, in dollars (> 0). */
  amount: number;
  description: string;
  /** YYYY-MM-DD. */
  dateOfIssue: string;
  /** Optional; empty when none. */
  specialInstructions: string;
}

/** A change order as the create API returned it. */
export interface CreatedChangeOrder {
  id: string;
  /** e.g. "CO#08"; empty when the API leaves it out. */
  changeOrderNumber: string;
  /** e.g. "Draft". */
  status: string;
  /** e.g. "Pending"; empty when the API leaves it out. */
  approvalStatus: string;
  /** The API's message, fit to show the user. */
  message: string;
}

/** What the Add Line Item form sends. */
export type NewChangeOrderItem = Pick<ChangeOrderItem, 'description' | 'quantity' | 'unitPrice'>;

/** Who signed a change order, with the signature the API has on file for them. */
export interface ChangeOrderSignature {
  /** The signer's full name. */
  name: string;
  /** The signature on file, as a base64 PNG. */
  imageBase64: string;
  /** Signing date, YYYY-MM-DD. */
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
