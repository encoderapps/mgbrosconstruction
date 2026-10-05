import axios, { AxiosError, AxiosHeaders } from 'axios';
import { buildModifyPaymentTermsPayload, modifyPaymentTerms } from '../src/services/paymentTermsService';

jest.mock('../src/services/salesforceAuthService', () => ({
  getStoredSalesforceAccessToken: jest.fn().mockResolvedValue('token'),
  fetchSalesforceAccessToken: jest.fn().mockResolvedValue('token'),
}));

const mockedAxiosRequest = jest.spyOn(axios, 'request');
/** Resolves the HTTP request with `body` as its JSON. */
const respondWith = (body: unknown): void => {
  mockedAxiosRequest.mockResolvedValue({ data: body });
};

beforeAll(() => {
  jest.spyOn(console, 'log').mockImplementation(() => undefined);
});

const ACCOUNT_ID = '001QL00002WQD8ZYAX';
const PO_ID = 'a1wQL000008jUa1YAE';
const TERMS = [
  { description: 'Down Payment', percentage: 40 },
  { description: 'Final Payment', percentage: 60 },
];

/** An axios error with a response (status given) or without one (network failure). */
function axiosError(status?: number, data?: unknown): AxiosError {
  const config = { headers: new AxiosHeaders() };
  return new AxiosError(
    'Request failed',
    status ? 'ERR_BAD_RESPONSE' : 'ERR_NETWORK',
    config,
    undefined,
    status ? { status, statusText: '', headers: {}, config, data } : undefined,
  );
}

afterEach(() => {
  mockedAxiosRequest.mockReset();
});

describe('buildModifyPaymentTermsPayload', () => {
  it('sends the account, the PO and each term percentage and description', () => {
    expect(buildModifyPaymentTermsPayload(ACCOUNT_ID, PO_ID, TERMS)).toEqual({
      accountId: ACCOUNT_ID,
      poId: PO_ID,
      paymentTerms: [
        { percentage: 40, description: 'Down Payment' },
        { percentage: 60, description: 'Final Payment' },
      ],
    });
  });
});

describe('modifyPaymentTerms', () => {
  it('PATCHes modifyPaymentTerms and returns the paymentTermsList', async () => {
    respondWith({
      success: true,
      poId: 'a1w1',
      paymentTermsList: [
        { percentage: 40, description: 'Down Payment', amount: '0.00' },
        { percentage: 60, description: 'Final Payment', amount: '0.00' },
      ],
      paymentTerms: '[]',
      message: 'Payment terms updated successfully.',
    });

    const result = await modifyPaymentTerms(ACCOUNT_ID, PO_ID, TERMS);

    expect(mockedAxiosRequest).toHaveBeenCalledWith(
      expect.objectContaining({
        method: 'patch',
        url: expect.stringMatching(/\/services\/apexrest\/modifyPaymentTerms$/),
        data: buildModifyPaymentTermsPayload(ACCOUNT_ID, PO_ID, TERMS),
      }),
    );
    expect(result).toEqual({
      message: 'Payment terms updated successfully.',
      paymentTerms: [
        { id: 'term-0', percentage: 40, description: 'Down Payment', amount: 0 },
        { id: 'term-1', percentage: 60, description: 'Final Payment', amount: 0 },
      ],
    });
  });

  it('throws the API message on success: false', async () => {
    respondWith({ success: false, message: 'PO is locked.' });
    await expect(modifyPaymentTerms(ACCOUNT_ID, PO_ID, TERMS)).rejects.toThrow('PO is locked.');
  });

  it('recovers the message from a non-2xx { success, message } body', async () => {
    mockedAxiosRequest.mockRejectedValue(axiosError(400, { success: false, message: 'Invalid poId.' }));
    await expect(modifyPaymentTerms(ACCOUNT_ID, PO_ID, TERMS)).rejects.toThrow('Invalid poId.');
  });

  it('throws a generic message on a server error and a connection message on a network error', async () => {
    mockedAxiosRequest.mockRejectedValue(axiosError(500, '<html>Server Error</html>'));
    await expect(modifyPaymentTerms(ACCOUNT_ID, PO_ID, TERMS)).rejects.toThrow(/Unable to update the payment terms/);

    mockedAxiosRequest.mockRejectedValue(axiosError());
    await expect(modifyPaymentTerms(ACCOUNT_ID, PO_ID, TERMS)).rejects.toThrow(/Check your connection/);
  });

  it('throws when a successful response has no paymentTermsList', async () => {
    respondWith({ success: true, message: 'ok' });
    await expect(modifyPaymentTerms(ACCOUNT_ID, PO_ID, TERMS)).rejects.toThrow(/Unable to update the payment terms/);
  });
});
