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
  /**
   * Where it came from, as the API names it: "Change Order" (from the job) or
   * "My Change Order". Decides the Add Line Item form. Absent when the API
   * doesn't say.
   */
  source?: string;
}

export interface ChangeOrderItem {
  id: string;
  /** Plain text (the API sends rich text). */
  description: string;
  /** e.g. "HVAC Service"; empty when unknown. */
  category: string;
  /** The category's Salesforce Id (serviceCategoryId); absent when the API doesn't send it. */
  categoryId?: string;
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

/** A Job Purchase Order item a "My Job Change Order" line item can relate to. */
export interface MyJobPurchaseOrderItem {
  id: string;
  /** e.g. "J-POI#00000004 – Item #1". */
  label: string;
}

/** What the Add Line Item form sends for a "My Job Change Order". Amounts in dollars. */
export interface NewMyJobChangeOrderItem {
  /** The related Job Purchase Order item (optional); null when none was picked. */
  purchaseOrderItemId: string | null;
  description: string;
  itemCost: number;
  itemPrice: number;
}

/** What the Add Line Item form sends for a "Job Change Order". Amounts in dollars. */
export interface NewJobChangeOrderItem {
  serviceItem: string;
  category: string;
  product: string;
  description: string;
  /** ≥ 0. */
  markup: number;
  cost: number;
  poCost: number;
}

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
