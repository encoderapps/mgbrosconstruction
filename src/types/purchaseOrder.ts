export interface PurchaseOrder {
  id: string;
  name: string;
  status: string;
  paidAmount: number;
  vendor: string;
}

export interface PurchaseOrderPaymentTerm {
  id: string;
  /** e.g. 25 for 25%. */
  percentage: number | null;
  description: string;
  amount: number | null;
}

export interface PurchaseOrderDetail {
  id: string;
  name: string;
  status: string;
  project: string;
  /** One line, e.g. "666 Post Street, San Francisco, CA 94109". */
  projectAddress: string;
  totalAmount: number;
  paymentTerms: PurchaseOrderPaymentTerm[];
}
