import { PurchaseOrderDetail } from '../src/types/purchaseOrder';
import { calculatePurchaseOrderTotals } from '../src/utils/purchaseOrderLedger';
import { isPaid, statusTone } from '../src/utils/purchaseOrderStatus';

const PO: PurchaseOrderDetail = {
  id: 'a1w1',
  name: 'PO-1007',
  status: 'Signed',
  project: '',
  projectAddress: '445 Maple Dr, Evanston, IL',
  totalAmount: 15750,
  lineItems: [],
  paymentTerms: [],
  poDate: null,
  signedDate: '2026-08-24',
  vendorSignature: null,
  changeOrders: [
    { id: 'co1', name: 'CO-1001', status: 'Signed', amount: 2500 },
    { id: 'co2', name: 'CO-1002', status: 'Ready for Signature', amount: 500 },
  ],
  invoices: [{ id: 'inv1', name: 'BR-1001', status: 'Paid', amount: 4000 }],
};

describe('calculatePurchaseOrderTotals', () => {
  it('adds signed change orders and subtracts paid invoices', () => {
    expect(calculatePurchaseOrderTotals(PO)).toEqual({ poAmount: 15750, totalAmount: 18250, balanceDue: 14250 });
  });

  it('is just the PO amount with no change orders or invoices', () => {
    expect(calculatePurchaseOrderTotals({ ...PO, changeOrders: [], invoices: [] })).toEqual({
      poAmount: 15750,
      totalAmount: 15750,
      balanceDue: 15750,
    });
  });

  it("doesn't count unpaid invoices and keeps cents exact", () => {
    const totals = calculatePurchaseOrderTotals({
      ...PO,
      totalAmount: 0.1,
      changeOrders: [{ id: 'co', name: 'CO', status: 'Signed', amount: 0.2 }],
      invoices: [
        { id: 'a', name: 'A', status: 'Unpaid', amount: 0.3 },
        { id: 'b', name: 'B', status: 'Paid', amount: 0.1 },
      ],
    });
    expect(totals).toEqual({ poAmount: 0.1, totalAmount: 0.3, balanceDue: 0.2 });
  });
});

describe('status helpers', () => {
  it('only treats a fully paid invoice as paid', () => {
    expect(isPaid('Paid')).toBe(true);
    expect(isPaid(' paid ')).toBe(true);
    expect(isPaid('Unpaid')).toBe(false);
    expect(isPaid('Not Paid')).toBe(false);
    expect(isPaid('Partially Paid')).toBe(false);
  });

  it('colours done, waiting and other statuses', () => {
    expect(statusTone('Signed')).toBe('success');
    expect(statusTone('Paid')).toBe('success');
    expect(statusTone('Ready for Signature')).toBe('warning');
    expect(statusTone('Draft')).toBeNull();
  });
});
