import { PurchaseOrderDetail, PurchaseOrderLedgerEntry } from '../types/purchaseOrder';
import { isPaid, isSigned } from './purchaseOrderStatus';

export interface PurchaseOrderTotals {
  /** The PO's own amount (its line items). */
  poAmount: number;
  /** PO amount plus its signed change orders (unsigned ones aren't owed yet); null if they couldn't be loaded. */
  totalAmount: number | null;
  /** Total amount less the invoices already paid; null if either couldn't be loaded. */
  balanceDue: number | null;
}

/**
 * The PO's invoice rows with the bookkeeping API's amounts: a row it also
 * lists (same id) takes its version, with the real invoiceAmount; invoices only
 * it lists are added after. `listed` null (couldn't be loaded) → `fetched` alone;
 * `fetched` null (that call failed) → `listed` as is.
 */
export function mergePurchaseOrderInvoices(
  listed: PurchaseOrderLedgerEntry[] | null,
  fetched: PurchaseOrderLedgerEntry[] | null,
): PurchaseOrderLedgerEntry[] | null {
  if (!fetched) {
    return listed;
  }
  if (!listed) {
    return fetched;
  }
  const fetchedById = new Map(fetched.map((invoice) => [invoice.id, invoice]));
  const listedIds = new Set(listed.map((invoice) => invoice.id));
  return [
    ...listed.map((invoice) => {
      const match = fetchedById.get(invoice.id);
      return match ? { ...invoice, ...match, name: match.name || invoice.name } : invoice;
    }),
    ...fetched.filter((invoice) => !listedIds.has(invoice.id)),
  ];
}

const sumAmounts =(amounts: number[]): number =>
  Math.round(amounts.reduce((sum, amount) => sum + amount, 0) * 100) / 100;

/** The signed PO's running totals, e.g. $15,750 + $2,500 signed CO = $18,250; less $4,000 paid = $14,250 due. */
export function calculatePurchaseOrderTotals(purchaseOrder: PurchaseOrderDetail): PurchaseOrderTotals {
  const { changeOrders, invoices } = purchaseOrder;
  const totalAmount = changeOrders
    ? sumAmounts([
        purchaseOrder.totalAmount,
        ...changeOrders.filter((changeOrder) => isSigned(changeOrder.status)).map((entry) => entry.amount),
      ])
    : null;
  const balanceDue =
    totalAmount !== null && invoices
      ? sumAmounts([totalAmount, ...invoices.filter((invoice) => isPaid(invoice.status)).map((entry) => -entry.amount)])
      : null;
  return { poAmount: purchaseOrder.totalAmount, totalAmount, balanceDue };
}
