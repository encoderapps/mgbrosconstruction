import { fetchInvoices } from '../src/services/invoiceService';
import { fetchPurchaseOrderDetail } from '../src/services/purchaseOrderDetailService';
import { fetchPurchaseOrders } from '../src/services/purchaseOrderService';
import { salesforceGet } from '../src/services/salesforceClient';
import { toDateOnlyString } from '../src/utils/dateValidation';

jest.mock('../src/services/salesforceClient', () => ({
  salesforceGet: jest.fn(),
}));

const mockedGet = salesforceGet as jest.MockedFunction<typeof salesforceGet>;

afterEach(() => {
  mockedGet.mockReset();
});

describe('fetchPurchaseOrders', () => {
  it('requests the given view for the account and maps the records', async () => {
    mockedGet.mockResolvedValue({
      success: true,
      count: 1,
      purchaseOrders: [
        {
          id: 'a1w1',
          name: 'Job-PO#0001122',
          status: 'Signed by both sides',
          paidAmount: 0,
          vendor: 'ABC Construction Services',
          createdDate: '2026-09-29T20:21:34.000Z',
        },
      ],
    });

    const result = await fetchPurchaseOrders('001ACCOUNT', 'home');

    expect(mockedGet).toHaveBeenCalledWith(expect.stringMatching(/\/purchaseorders$/), {
      accountId: '001ACCOUNT',
      view: 'home',
    });
    expect(result).toEqual({
      count: 1,
      items: [
        {
          id: 'a1w1',
          name: 'Job-PO#0001122',
          status: 'Signed by both sides',
          paidAmount: 0,
          vendor: 'ABC Construction Services',
          // The timestamp's calendar date on this machine (it differs by time zone).
          createdDate: toDateOnlyString(new Date('2026-09-29T20:21:34.000Z')),
        },
      ],
    });
  });

  it('fills in missing fields', async () => {
    mockedGet.mockResolvedValue({
      success: true,
      count: 1,
      purchaseOrders: [{ id: 'a1w2', name: null, status: null, paidAmount: null, vendor: null, createdDate: null }],
    });

    const { items } = await fetchPurchaseOrders('001ACCOUNT', 'all');

    expect(items[0]).toEqual({ id: 'a1w2', name: '', status: '', paidAmount: 0, vendor: '', createdDate: null });
  });

  it('throws the API message when the request is unsuccessful', async () => {
    mockedGet.mockResolvedValue({ success: false, message: 'accountId is required.', count: 0, purchaseOrders: [] });

    await expect(fetchPurchaseOrders('', 'all')).rejects.toThrow('accountId is required.');
  });
});

describe('fetchInvoices', () => {
  it('uses totalInvoices as the count', async () => {
    mockedGet.mockResolvedValue({ success: true, view: 'recent', totalInvoices: 55, invoices: [] });

    const result = await fetchInvoices('001ACCOUNT', 'recent');

    expect(mockedGet).toHaveBeenCalledWith(expect.stringMatching(/\/invoices\/fetch$/), {
      accountId: '001ACCOUNT',
      view: 'recent',
    });
    expect(result).toEqual({ items: [], count: 55 });
  });

  it('maps each invoice, reading text amounts and leaving missing values empty (shown as a dash)', async () => {
    mockedGet.mockResolvedValue({
      success: true,
      view: 'all',
      totalInvoices: 2,
      invoices: [
        { invoiceId: 'a0n1', invoiceNumber: 'INV-000004645', vendorInvoiceNumber: 'V-77', amount: '1000.00', status: 'New' },
        { id: 'a0n2', invoiceNumber: null, vendorInvoiceNumber: null, amount: null, status: null },
      ],
    });

    const { items } = await fetchInvoices('001ACCOUNT', 'all');

    expect(items).toEqual([
      { id: 'a0n1', invoiceNumber: 'INV-000004645', vendorInvoiceNumber: 'V-77', amount: 1000, status: 'New' },
      { id: 'a0n2', invoiceNumber: '', vendorInvoiceNumber: '', amount: null, status: '' },
    ]);
  });
});

describe('fetchPurchaseOrderDetail', () => {
  it('joins the project address into one line', async () => {
    mockedGet.mockResolvedValue({
      success: true,
      purchaseOrder: {
        id: 'a1w1',
        name: 'Job-PO#0001122',
        status: 'Signed by both sides',
        project: '[TEST] 666 Post Street - Test Account',
        projectAddress: {
          street: '666 Post Street',
          city: 'San Francisco',
          state: 'CA',
          postalCode: '94109',
          country: 'US',
        },
        totalAmount: 0,
        paymentTerms: [],
      },
    });

    const detail = await fetchPurchaseOrderDetail('001ACCOUNT', 'a1w1');

    expect(mockedGet).toHaveBeenCalledWith(expect.stringMatching(/\/purchaseorderdetail$/), {
      poId: 'a1w1',
      accountId: '001ACCOUNT',
    });
    expect(detail.projectAddress).toBe('666 Post Street, San Francisco, CA 94109');
    expect(detail.paymentTerms).toEqual([]);
  });

  it('maps line items and falls back to their sum when the total is 0', async () => {
    mockedGet.mockResolvedValue({
      success: true,
      purchaseOrder: {
        id: 'a1w1',
        name: 'Job-PO#0001115',
        status: 'Signed by both sides',
        project: null,
        projectAddress: null,
        totalAmount: 0,
        poDetails: [
          {
            unitPrice: 400,
            quantity: 1,
            productOrService: 'Service',
            description: '<p>Duct work 1st floor</p>',
            category: 'HVAC Service',
            amount: 400,
          },
          {
            unitPrice: 400,
            quantity: 1,
            productOrService: 'Service',
            description: null,
            category: 'Plumbing Service',
            amount: 400,
          },
        ],
        paymentTerms: '[{&quot;description&quot;:false,&quot;percentage&quot;:25,&quot;amount&quot;:&quot;100.00&quot;}]',
      },
    });

    const detail = await fetchPurchaseOrderDetail('001ACCOUNT', 'a1w1');

    expect(detail.totalAmount).toBe(800);
    expect(detail.lineItems.map((lineItem) => lineItem.description)).toEqual(['Duct work 1st floor', '']);
    // The amount is recalculated from the total (25% of $800), not the API's "100.00".
    expect(detail.paymentTerms).toEqual([{ id: 'term-0', percentage: 25, description: '', amount: 200 }]);
  });

  it('coerces numeric strings in line items and treats unparseable values as 0', async () => {
    mockedGet.mockResolvedValue({
      success: true,
      purchaseOrder: {
        id: 'a1w1',
        name: 'Job-PO#0001115',
        status: 'Ready for Signature',
        project: null,
        projectAddress: null,
        totalAmount: null,
        poDetails: [
          { unitPrice: '250.50', quantity: '2', productOrService: null, description: null, category: null, amount: 'abc' },
        ],
        paymentTerms: null,
      },
    });

    const detail = await fetchPurchaseOrderDetail('001ACCOUNT', 'a1w1');

    expect(detail.lineItems[0]).toMatchObject({ quantity: 2, unitPrice: 250.5, amount: 0 });
    expect(detail.totalAmount).toBe(0);
  });

  it('throws when the purchase order is missing', async () => {
    mockedGet.mockResolvedValue({ success: false, purchaseOrder: null, message: 'poId is required.' });

    await expect(fetchPurchaseOrderDetail('001ACCOUNT', '')).rejects.toThrow('poId is required.');
  });
});
