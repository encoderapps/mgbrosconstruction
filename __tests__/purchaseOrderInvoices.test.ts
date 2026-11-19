import axios from 'axios';
import { fetchPurchaseOrderInvoices } from '../src/services/invoiceService';
import { PurchaseOrderLedgerEntry } from '../src/types/purchaseOrder';
import { mergePurchaseOrderInvoices } from '../src/utils/purchaseOrderLedger';

jest.mock('../src/services/salesforceAuthService', () => ({
  getStoredSalesforceAccessToken: jest.fn().mockResolvedValue('token'),
  fetchSalesforceAccessToken: jest.fn().mockResolvedValue('token'),
}));

const mockedAxiosRequest = jest.spyOn(axios, 'request');
const ACCOUNT_ID = '001QL00002WQD8ZYAX';
const PO_ID = 'a1wQL000009KVs5YAG';

beforeAll(() => {
  jest.spyOn(console, 'log').mockImplementation(() => undefined);
});

afterEach(() => {
  mockedAxiosRequest.mockReset();
});

describe('fetchPurchaseOrderInvoices', () => {
  it("loads every invoice and keeps this PO's, with invoiceAmount (not the PO's totalAmount) as the amount", async () => {
    mockedAxiosRequest.mockResolvedValue({
      data: {
        success: true,
        invoices: [
          {
            id: 'a1kQL0000ceK1jpYAC',
            invoiceNumber: 'INV-000027404',
            vendorNumber: 'INV-4317665',
            status: 'Created',
            invoiceAmount: 200.0,
            totalAmount: 5000.0,
            amount: 0.0,
            jobPurchaseOrderId: PO_ID,
          },
          {
            id: 'a1kQL0000ceKfULYA0',
            invoiceNumber: 'INV-000027405',
            vendorNumber: 'INV-0017059',
            status: 'Created',
            invoiceAmount: 20.0,
            totalAmount: 1000.0,
            jobPurchaseOrderId: 'a1wQL000008jY5sYAE',
          },
        ],
      },
    });

    await expect(fetchPurchaseOrderInvoices(ACCOUNT_ID, PO_ID)).resolves.toEqual([
      {
        id: 'a1kQL0000ceK1jpYAC',
        name: 'INV-000027404',
        vendorInvoiceNumber: 'INV-4317665',
        status: 'Created',
        amount: 200,
        projectName: '',
      },
    ]);
    expect(mockedAxiosRequest).toHaveBeenCalledWith(
      expect.objectContaining({
        method: 'get',
        url: expect.stringMatching(/\/bookkeeping\/fetch$/),
        params: { accountId: ACCOUNT_ID, view: 'all' },
      }),
    );
  });

  it("throws the API's message on success: false", async () => {
    mockedAxiosRequest.mockResolvedValue({ data: { success: false, message: 'No access.' } });
    await expect(fetchPurchaseOrderInvoices(ACCOUNT_ID, PO_ID)).rejects.toThrow('No access.');
  });
});

describe('mergePurchaseOrderInvoices', () => {
  const entry = (id: string, amount: number, name = id): PurchaseOrderLedgerEntry => ({
    id,
    name,
    status: 'Created',
    amount,
    vendorInvoiceNumber: '',
  });

  it("takes the bookkeeping API's amount for invoices both list, and adds the ones only it lists", () => {
    expect(
      mergePurchaseOrderInvoices([entry('a', 0, 'BR-1'), entry('b', 0)], [entry('a', 200, 'INV-1'), entry('c', 50)]),
    ).toEqual([entry('a', 200, 'INV-1'), entry('b', 0), entry('c', 50)]);
  });

  it('keeps the listed name when the bookkeeping API sends none', () => {
    expect(mergePurchaseOrderInvoices([entry('a', 0, 'BR-1')], [entry('a', 200, '')])).toEqual([entry('a', 200, 'BR-1')]);
  });

  it('falls back to whichever list loaded', () => {
    expect(mergePurchaseOrderInvoices([entry('a', 0)], null)).toEqual([entry('a', 0)]);
    expect(mergePurchaseOrderInvoices(null, [entry('a', 200)])).toEqual([entry('a', 200)]);
    expect(mergePurchaseOrderInvoices(null, null)).toBeNull();
  });
});
