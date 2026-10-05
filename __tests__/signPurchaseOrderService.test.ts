import axios, { AxiosError, AxiosHeaders } from 'axios';
import { signPurchaseOrder } from '../src/services/signPurchaseOrderService';

jest.mock('../src/services/salesforceAuthService', () => ({
  getStoredSalesforceAccessToken: jest.fn().mockResolvedValue('token'),
  fetchSalesforceAccessToken: jest.fn().mockResolvedValue('token'),
}));

const mockedAxiosRequest = jest.spyOn(axios, 'request');
/** Resolves the HTTP request with `body` as its JSON. */
const respondWith = (body: unknown): void => {
  mockedAxiosRequest.mockResolvedValue({ data: body });
};

/** An axios error with a response (status given) or without one (network failure / timeout). */
function axiosError(code: string, status?: number, data?: unknown): AxiosError {
  const config = { headers: new AxiosHeaders() };
  return new AxiosError(
    'Request failed',
    code,
    config,
    undefined,
    status ? { status, statusText: '', headers: {}, config, data } : undefined,
  );
}

const ACCOUNT_ID = '001QL00002WQD8ZYAX';
const PO_ID = 'a1wQL000008jUa1YAE';

beforeAll(() => {
  jest.spyOn(console, 'log').mockImplementation(() => undefined);
});

afterEach(() => {
  mockedAxiosRequest.mockReset();
});

describe('signPurchaseOrder', () => {
  it('PATCHes { accountId, poId } and returns the new status', async () => {
    respondWith({
      success: true,
      status: 'Signed',
      poId: PO_ID,
      message: 'Purchase Order signed successfully.',
    });

    await expect(signPurchaseOrder(ACCOUNT_ID, PO_ID)).resolves.toEqual({
      status: 'Signed',
      message: 'Purchase Order signed successfully.',
    });
    expect(mockedAxiosRequest).toHaveBeenCalledWith(
      expect.objectContaining({
        method: 'patch',
        url: expect.stringMatching(/\/services\/apexrest\/signPurchaseOrder$/),
        data: { accountId: ACCOUNT_ID, poId: PO_ID },
        headers: expect.objectContaining({ Authorization: 'Bearer token' }),
      }),
    );
  });

  it('defaults the status to Signed when a successful response leaves it out', async () => {
    respondWith({ success: true });
    await expect(signPurchaseOrder(ACCOUNT_ID, PO_ID)).resolves.toMatchObject({ status: 'Signed' });
  });

  it('throws the API message on success: false, even with HTTP 200', async () => {
    respondWith({ success: false, message: 'This purchase order is already signed.' });
    await expect(signPurchaseOrder(ACCOUNT_ID, PO_ID)).rejects.toThrow('This purchase order is already signed.');
  });

  it('recovers the message from a non-2xx { success, message } body', async () => {
    mockedAxiosRequest.mockRejectedValue(
      axiosError('ERR_BAD_REQUEST', 400, { success: false, message: 'poId is required.' }),
    );
    await expect(signPurchaseOrder(ACCOUNT_ID, PO_ID)).rejects.toThrow('poId is required.');
  });

  it('throws a generic message on a server error or an invalid response', async () => {
    mockedAxiosRequest.mockRejectedValue(axiosError('ERR_BAD_RESPONSE', 500, '<html>Error</html>'));
    await expect(signPurchaseOrder(ACCOUNT_ID, PO_ID)).rejects.toThrow(/Unable to sign the purchase order/);

    respondWith('<html>Maintenance</html>');
    await expect(signPurchaseOrder(ACCOUNT_ID, PO_ID)).rejects.toThrow(/Unable to sign the purchase order/);
  });

  it('throws a connection message on a network failure and a timeout message on a timeout', async () => {
    mockedAxiosRequest.mockRejectedValue(axiosError('ERR_NETWORK'));
    await expect(signPurchaseOrder(ACCOUNT_ID, PO_ID)).rejects.toThrow(/Check your connection/);

    mockedAxiosRequest.mockRejectedValue(axiosError('ECONNABORTED'));
    await expect(signPurchaseOrder(ACCOUNT_ID, PO_ID)).rejects.toThrow(/took too long/);
  });

  it('sends the request with a timeout', async () => {
    respondWith({ success: true, status: 'Signed' });
    await signPurchaseOrder(ACCOUNT_ID, PO_ID);
    expect(mockedAxiosRequest).toHaveBeenCalledWith(expect.objectContaining({ timeout: expect.any(Number) }));
  });
});
