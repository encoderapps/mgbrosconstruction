import { PurchaseOrderDetail } from '../types/purchaseOrder';
import { isPaid, isSigned } from './purchaseOrderStatus';

export interface PurchaseOrderTotals {
  /** The PO's own amount (its line items). */
  poAmount: number;
  /** PO amount plus its signed change orders; unsigned ones aren't owed yet. */
  totalAmount: number;
  /** Total amount less the invoices already paid. */
  balanceDue: number;
}

const sumAmounts = (amounts: number[]): number =>
  Math.round(amounts.reduce((sum, amount) => sum + amount, 0) * 100) / 100;

/** The signed PO's running totals, e.g. $15,750 + $2,500 signed CO = $18,250; less $4,000 paid = $14,250 due. */
export function calculatePurchaseOrderTotals(purchaseOrder: PurchaseOrderDetail): PurchaseOrderTotals {
  const signedChangeOrders = purchaseOrder.changeOrders.filter((changeOrder) => isSigned(changeOrder.status));
  const paidInvoices = purchaseOrder.invoices.filter((invoice) => isPaid(invoice.status));
  const totalAmount = sumAmounts([purchaseOrder.totalAmount, ...signedChangeOrders.map((entry) => entry.amount)]);
  return {
    poAmount: purchaseOrder.totalAmount,
    totalAmount,
    balanceDue: sumAmounts([totalAmount, ...paidInvoices.map((entry) => -entry.amount)]),
  };
}
