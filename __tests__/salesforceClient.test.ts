import { toSalesforceErrorMessage } from '../src/services/salesforceClient';

jest.mock('../src/services/salesforceAuthService', () => ({
  fetchSalesforceAccessToken: jest.fn(),
  getStoredSalesforceAccessToken: jest.fn(),
}));

describe('toSalesforceErrorMessage', () => {
  it("reads the message from Salesforce's own error body", () => {
    expect(
      toSalesforceErrorMessage([
        { errorCode: 'METHOD_NOT_ALLOWED', message: " HTTP Method 'POST' not allowed. Allowed are PATCH " },
      ]),
    ).toBe("HTTP Method 'POST' not allowed. Allowed are PATCH");
    expect(toSalesforceErrorMessage({ errorCode: 'NOT_FOUND', message: 'Could not find a match for URL' })).toBe(
      'Could not find a match for URL',
    );
  });

  it('is null for any other body', () => {
    expect(toSalesforceErrorMessage('<html>Error</html>')).toBeNull();
    expect(toSalesforceErrorMessage([])).toBeNull();
    expect(toSalesforceErrorMessage([{ errorCode: 'X', message: ' ' }])).toBeNull();
    expect(toSalesforceErrorMessage(undefined)).toBeNull();
  });
});
