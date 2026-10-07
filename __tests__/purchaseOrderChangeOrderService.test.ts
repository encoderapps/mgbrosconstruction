import axios from 'axios';
import { fetchPurchaseOrderChangeOrders } from '../src/services/purchaseOrderChangeOrderService';

jest.mock('../src/services/salesforceAuthService', () => ({
  getStoredSalesforceAccessToken: jest.fn().mockResolvedValue('token'),
  fetchSalesforceAccessToken: jest.fn().mockResolvedValue('token'),
}));

const mockedAxiosRequest = jest.spyOn(axios, 'request');

const ACCOUNT_ID = '001QL00002WQD8ZYAX';
const PO_ID = 'a1wQL000008jUa1YAE';

/** The API's response for Job-PO#0001115. */
const RESPONSE = {
  totalAmount: 200.0,
  success: true,
  status: 'Signed',
  project: '[TEST] 666 Post Street - Test Account',
  poName: 'Job-PO#0001115',
  poId: PO_ID,
  poAmount: 0.0,
  paidInvoiceAmount: 0,
  message: 'Purchase Order details fetched successfully.',
  invoices: [],
  changeOrders: [
    { status: 'Signed by Both Parties', id: 'a1uQL00000J9OxpYAF', description: null, changeOrderNo: 'CO#01', amount: 200.0 },
    { status: 'Draft', id: 'a1uQL00000JJlRhYAL', description: null, changeOrderNo: 'CO#02', amount: 500.0 },
  ],
  changeOrderDetail: null,
  balanceDue: 200.0,
};

beforeAll(() => {
  jest.spyOn(console, 'log').mockImplementation(() => undefined);
});

afterEach(() => {
  mockedAxiosRequest.mockReset();
});

describe('fetchPurchaseOrderChangeOrders', () => {
  it('POSTs { accountId, poId } and maps the change orders and invoices', async () => {
    mockedAxiosRequest.mockResolvedValue({ data: RESPONSE });

    await expect(fetchPurchaseOrderChangeOrders(ACCOUNT_ID, PO_ID)).resolves.toEqual({
      changeOrders: [
        { id: 'a1uQL00000J9OxpYAF', name: 'CO#01', status: 'Signed by Both Parties', amount: 200 },
        { id: 'a1uQL00000JJlRhYAL', name: 'CO#02', status: 'Draft', amount: 500 },
      ],
      invoices: [],
    });
    expect(mockedAxiosRequest).toHaveBeenCalledWith(
      expect.objectContaining({
        method: 'post',
        url: expect.stringMatching(/\/services\/apexrest\/purchaseorderchangeorder$/),
        data: { accountId: ACCOUNT_ID, poId: PO_ID },
      }),
    );
  });

  it('fills in missing fields and lists', async () => {
    mockedAxiosRequest.mockResolvedValue({
      data: {
        success: true,
        changeOrders: [{ id: '', changeOrderNo: null, status: null, description: null, amount: '75.50' }],
        invoices: null,
      },
    });

    await expect(fetchPurchaseOrderChangeOrders(ACCOUNT_ID, PO_ID)).resolves.toEqual({
      changeOrders: [{ id: 'change-order-0', name: '', status: '', amount: 75.5 }],
      invoices: [],
    });
  });

  it('throws the API message on success: false', async () => {
    mockedAxiosRequest.mockResolvedValue({ data: { success: false, message: 'poId is required.' } });
    await expect(fetchPurchaseOrderChangeOrders(ACCOUNT_ID, '')).rejects.toThrow('poId is required.');
  });

  it('returns no change orders or invoices for a PO not yet signed by both sides', async () => {
    mockedAxiosRequest.mockResolvedValue({ data: { success: false, message: 'Purchase Order is not signed.' } });
    await expect(fetchPurchaseOrderChangeOrders(ACCOUNT_ID, PO_ID)).resolves.toEqual({ changeOrders: [], invoices: [] });
  });
});
