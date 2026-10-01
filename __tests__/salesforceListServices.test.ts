import { fetchInvoices } from '../src/services/invoiceService';
import { fetchPurchaseOrderDetail } from '../src/services/purchaseOrderDetailService';
import { fetchPurchaseOrders } from '../src/services/purchaseOrderService';
import { salesforceGet } from '../src/services/salesforceClient';

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

    expect(items[0]).toEqual({ id: 'a1w2', name: '', status: '', paidAmount: 0, vendor: '' });
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

  it('throws when the purchase order is missing', async () => {
    mockedGet.mockResolvedValue({ success: false, purchaseOrder: null, message: 'poId is required.' });

    await expect(fetchPurchaseOrderDetail('001ACCOUNT', '')).rejects.toThrow('poId is required.');
  });
});
