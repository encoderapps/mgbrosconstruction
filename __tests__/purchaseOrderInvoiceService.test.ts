import axios, { AxiosError, AxiosHeaders } from 'axios';
import { createPurchaseOrderInvoice, parseInvoiceAmount } from '../src/services/purchaseOrderInvoiceService';
import { NewPurchaseOrderInvoice } from '../src/types/purchaseOrderInvoice';

jest.mock('../src/services/salesforceAuthService', () => ({
  getStoredSalesforceAccessToken: jest.fn().mockResolvedValue('token'),
  fetchSalesforceAccessToken: jest.fn().mockResolvedValue('token'),
}));

const mockedAxiosRequest = jest.spyOn(axios, 'request');
/** Resolves the HTTP request with `body` as its JSON. */
const respondWith = (body: unknown): void => {
  mockedAxiosRequest.mockResolvedValue({ data: body });
};

const ACCOUNT_ID = '001QL00002WQD8ZYAX';
const PO_ID = 'a1wQL000008jY5sYAE';
// Fixed "today", so the due-date check is predictable.
const TODAY = new Date(2026, 9, 15, 10, 30);

function newInvoice(overrides: Partial<NewPurchaseOrderInvoice> = {}): NewPurchaseOrderInvoice {
  return {
    poId: PO_ID,
    amount: '150',
    vendorInvoiceNumber: 'INV-0017655',
    dueDate: '2026-12-19',
    ...overrides,
  };
}

/** The API's response for a created invoice. */
function createdResponse(overrides: Record<string, unknown> = {}) {
  return {
    success: true,
    message: 'Invoice created successfully',
    invoice: {
      status: 'Draft',
      dueDate: '2026-12-19',
      vendorInvoiceNumber: 'INV-0017655',
      invoiceNumber: 'BR-000027390',
      id: 'a0nQL00000GkUl3YAF',
      ...overrides,
    },
  };
}

beforeAll(() => {
  jest.useFakeTimers({ now: TODAY, doNotFake: ['nextTick', 'setImmediate', 'setTimeout', 'clearTimeout'] });
  jest.spyOn(console, 'log').mockImplementation(() => undefined);
});

afterAll(() => {
  jest.useRealTimers();
});

afterEach(() => {
  mockedAxiosRequest.mockReset();
});

describe('parseInvoiceAmount', () => {
  it('reads a positive amount with up to 2 decimals, ignoring $, commas and spaces', () => {
    expect(parseInvoiceAmount('150')).toBe(150);
    expect(parseInvoiceAmount(' $1,250.50 ')).toBe(1250.5);
    expect(parseInvoiceAmount('0.75')).toBe(0.75);
  });

  it('rejects empty, zero, negative, non-numeric or over-precise amounts', () => {
    for (const value of ['', '0', '0.00', '-5', 'abc', '1.234', '1.2.3']) {
      expect(parseInvoiceAmount(value)).toBeNull();
    }
  });
});

describe('createPurchaseOrderInvoice', () => {
  it('POSTs the invoice to bookkeeping/invoice/create and returns it as created', async () => {
    respondWith(createdResponse());

    await expect(
      createPurchaseOrderInvoice(ACCOUNT_ID, newInvoice({ amount: '1,250.50', vendorInvoiceNumber: '  INV-0017655 ' })),
    ).resolves.toEqual({
      id: 'a0nQL00000GkUl3YAF',
      invoiceNumber: 'BR-000027390',
      vendorInvoiceNumber: 'INV-0017655',
      status: 'Draft',
      dueDate: '2026-12-19',
    });
    expect(mockedAxiosRequest).toHaveBeenCalledTimes(1);
    expect(mockedAxiosRequest).toHaveBeenCalledWith(
      expect.objectContaining({
        method: 'post',
        url: expect.stringMatching(/\/services\/apexrest\/bookkeeping\/invoice\/create\/$/),
        // No notes and no status: the API creates it as Draft.
        data: {
          jobPurchaseOrderId: PO_ID,
          accountId: ACCOUNT_ID,
          invoiceAmount: 1250.5,
          vendorNumber: 'INV-0017655',
          dueDate: '2026-12-19',
        },
        headers: expect.objectContaining({ Authorization: 'Bearer token' }),
      }),
    );
  });

  it('falls back to what was sent, as a Draft, when the API returns no invoice', async () => {
    respondWith({ success: true, message: 'Invoice created successfully' });
    await expect(createPurchaseOrderInvoice(ACCOUNT_ID, newInvoice())).resolves.toEqual({
      id: '',
      invoiceNumber: '',
      vendorInvoiceNumber: 'INV-0017655',
      status: 'Draft',
      dueDate: '2026-12-19',
    });
  });

  it('refuses a bad amount, a missing vendor invoice number or due date, or a past due date, without calling the API', async () => {
    await expect(createPurchaseOrderInvoice(ACCOUNT_ID, newInvoice({ amount: '0' }))).rejects.toThrow(
      'Please enter an amount greater than 0',
    );
    await expect(createPurchaseOrderInvoice(ACCOUNT_ID, newInvoice({ vendorInvoiceNumber: '  ' }))).rejects.toThrow(
      'Please enter the vendor invoice number.',
    );
    await expect(createPurchaseOrderInvoice(ACCOUNT_ID, newInvoice({ dueDate: '' }))).rejects.toThrow(
      'Please select a due date.',
    );
    await expect(createPurchaseOrderInvoice(ACCOUNT_ID, newInvoice({ dueDate: '2026-10-14' }))).rejects.toThrow(
      'The due date cannot be in the past.',
    );
    expect(mockedAxiosRequest).not.toHaveBeenCalled();
  });

  it('accepts a due date of today', async () => {
    respondWith(createdResponse({ dueDate: '2026-10-15' }));

    await expect(createPurchaseOrderInvoice(ACCOUNT_ID, newInvoice({ dueDate: '2026-10-15' }))).resolves.toMatchObject({
      dueDate: '2026-10-15',
    });
  });

  it("throws the API's message when the invoice isn't created", async () => {
    respondWith({ success: false, message: 'Purchase order not found.' });
    await expect(createPurchaseOrderInvoice(ACCOUNT_ID, newInvoice())).rejects.toThrow('Purchase order not found.');

    respondWith({ success: false });
    await expect(createPurchaseOrderInvoice(ACCOUNT_ID, newInvoice())).rejects.toThrow(
      'Unable to create the invoice. Please try again.',
    );
  });

  it("throws the API's message from an error status, and a connection message when the server can't be reached", async () => {
    const config = { headers: new AxiosHeaders() };
    mockedAxiosRequest.mockRejectedValue(
      new AxiosError('Request failed', 'ERR_BAD_REQUEST', config, undefined, {
        status: 400,
        statusText: '',
        headers: {},
        config,
        data: { success: false, message: 'Vendor invoice number already exists.' },
      }),
    );
    await expect(createPurchaseOrderInvoice(ACCOUNT_ID, newInvoice())).rejects.toThrow(
      'Vendor invoice number already exists.',
    );

    mockedAxiosRequest.mockRejectedValue(new AxiosError('Network Error', 'ERR_NETWORK', config));
    await expect(createPurchaseOrderInvoice(ACCOUNT_ID, newInvoice())).rejects.toThrow(
      'Unable to reach the server. Check your connection and try again.',
    );
  });
});
