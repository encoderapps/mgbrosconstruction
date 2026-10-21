import axios, { AxiosError, AxiosHeaders } from 'axios';
import { createPurchaseOrderInvoice } from '../src/services/purchaseOrderInvoiceService';
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
const PO_ID = 'a1wQL000008q8uXYAQ';
const OPPORTUNITY_ID = '006QL00000iYFEtYAO';
// Fixed "today", so the created date and the due-date check are predictable.
const TODAY = new Date(2026, 9, 15, 10, 30);

function newInvoice(overrides: Partial<NewPurchaseOrderInvoice> = {}): NewPurchaseOrderInvoice {
  return {
    poId: PO_ID,
    opportunityId: OPPORTUNITY_ID,
    vendorInvoiceNumber: 'VN-123121',
    status: 'New',
    dueDate: '2026-11-21',
    ...overrides,
  };
}

/** The API's response for a created invoice. */
function createdResponse(overrides: Record<string, unknown> = {}) {
  return {
    success: true,
    message: 'Invoice created successfully',
    invoice: {
      opportunityId: OPPORTUNITY_ID,
      poId: PO_ID,
      status: 'New',
      dueDate: '2026-11-21',
      vendorInvoiceNumber: 'VN-123121',
      createdDate: '2026-10-15T00:00:00.000Z',
      invoiceNumber: 'INV-000004661',
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

describe('createPurchaseOrderInvoice', () => {
  it('POSTs the invoice, dated today, and returns it as created', async () => {
    respondWith(createdResponse());

    await expect(createPurchaseOrderInvoice(ACCOUNT_ID, newInvoice({ vendorInvoiceNumber: '  VN-123121 ' }))).resolves.toEqual({
      id: 'a0nQL00000GkUl3YAF',
      invoiceNumber: 'INV-000004661',
      vendorInvoiceNumber: 'VN-123121',
      status: 'New',
      dueDate: '2026-11-21',
    });
    expect(mockedAxiosRequest).toHaveBeenCalledWith(
      expect.objectContaining({
        method: 'post',
        url: expect.stringMatching(/\/services\/apexrest\/invoices\/create\/\*$/),
        data: {
          poId: PO_ID,
          opportunityId: OPPORTUNITY_ID,
          vendorInvoiceNumber: 'VN-123121',
          createdDate: '2026-10-15',
          dueDate: '2026-11-21',
          status: 'New',
        },
        headers: expect.objectContaining({ Authorization: 'Bearer token' }),
      }),
    );
  });

  it("looks up the PO's job when the PO detail didn't include it, limited to the account's POs", async () => {
    mockedAxiosRequest
      .mockResolvedValueOnce({ data: { totalSize: 1, done: true, records: [{ Job__c: OPPORTUNITY_ID }] } })
      .mockResolvedValueOnce({ data: createdResponse() });

    await expect(createPurchaseOrderInvoice(ACCOUNT_ID, newInvoice({ opportunityId: null }))).resolves.toMatchObject({
      invoiceNumber: 'INV-000004661',
    });

    expect(mockedAxiosRequest).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        method: 'get',
        url: expect.stringMatching(/\/services\/data\/v\d+\.\d\/query$/),
        params: {
          q: `SELECT Job__c FROM Job_Purchase_Order__c WHERE Id = '${PO_ID}' AND Vendor__c = '${ACCOUNT_ID}' LIMIT 1`,
        },
      }),
    );
    expect(mockedAxiosRequest).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({ data: expect.objectContaining({ opportunityId: OPPORTUNITY_ID }) }),
    );
  });

  it("doesn't create the invoice when the PO has no job, isn't the account's, or the lookup fails", async () => {
    respondWith({ totalSize: 1, done: true, records: [{ Job__c: null }] });
    await expect(createPurchaseOrderInvoice(ACCOUNT_ID, newInvoice({ opportunityId: null }))).rejects.toThrow(
      'This purchase order is not linked to a job, so an invoice cannot be added to it.',
    );

    respondWith({ totalSize: 0, done: true, records: [] });
    await expect(createPurchaseOrderInvoice(ACCOUNT_ID, newInvoice({ opportunityId: null }))).rejects.toThrow(
      'This purchase order is not linked to a job',
    );

    jest.spyOn(console, 'error').mockImplementationOnce(() => undefined);
    mockedAxiosRequest.mockRejectedValue(new Error('boom'));
    await expect(createPurchaseOrderInvoice(ACCOUNT_ID, newInvoice({ opportunityId: null }))).rejects.toThrow(
      'Unable to create the invoice. Please try again.',
    );
    // Only lookups: nothing was sent to the create API.
    expect(mockedAxiosRequest.mock.calls.every(([config]) => config.method === 'get')).toBe(true);
  });

  it('never puts a malformed id into the lookup query', async () => {
    await expect(
      createPurchaseOrderInvoice(ACCOUNT_ID, newInvoice({ poId: "x' OR Name != '", opportunityId: null })),
    ).rejects.toThrow('This purchase order is not linked to a job');
    expect(mockedAxiosRequest).not.toHaveBeenCalled();
  });

  it('shows the status the API gives the invoice, and falls back to what was sent', async () => {
    respondWith(createdResponse({ status: 'Paid in Full' }));
    await expect(createPurchaseOrderInvoice(ACCOUNT_ID, newInvoice())).resolves.toMatchObject({ status: 'Paid in Full' });

    respondWith({ success: true, message: 'Invoice created successfully', invoice: null });
    await expect(createPurchaseOrderInvoice(ACCOUNT_ID, newInvoice())).resolves.toEqual({
      id: '',
      invoiceNumber: '',
      vendorInvoiceNumber: 'VN-123121',
      status: 'New',
      dueDate: '2026-11-21',
    });
  });

  it("refuses a missing vendor invoice number, status or due date, or a past due date, without calling the API", async () => {
    await expect(createPurchaseOrderInvoice(ACCOUNT_ID, newInvoice({ vendorInvoiceNumber: '  ' }))).rejects.toThrow(
      'Please enter the vendor invoice number.',
    );
    await expect(createPurchaseOrderInvoice(ACCOUNT_ID, newInvoice({ status: '' }))).rejects.toThrow('Please select a status.');
    await expect(createPurchaseOrderInvoice(ACCOUNT_ID, newInvoice({ dueDate: '' }))).rejects.toThrow('Please select a due date.');
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
    await expect(createPurchaseOrderInvoice(ACCOUNT_ID, newInvoice())).rejects.toThrow('Vendor invoice number already exists.');

    mockedAxiosRequest.mockRejectedValue(new AxiosError('Network Error', 'ERR_NETWORK', config));
    await expect(createPurchaseOrderInvoice(ACCOUNT_ID, newInvoice())).rejects.toThrow(
      'Unable to reach the server. Check your connection and try again.',
    );
  });
});
