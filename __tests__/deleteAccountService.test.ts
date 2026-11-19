import axios from 'axios';
import { SALESFORCE_SUBCONTRACTOR_DELETE_URL } from '../src/constants/config';
import { deleteSubcontractorAccount } from '../src/services/deleteAccountService';

jest.mock('../src/services/salesforceAuthService', () => ({
  getStoredSalesforceAccessToken: jest.fn().mockResolvedValue('token'),
  fetchSalesforceAccessToken: jest.fn().mockResolvedValue('token'),
}));

const mockedAxiosRequest = jest.spyOn(axios, 'request');

describe('deleteSubcontractorAccount', () => {
  beforeEach(() => mockedAxiosRequest.mockReset());

  it('posts the email and password and returns the API message', async () => {
    mockedAxiosRequest.mockResolvedValue({ data: { success: true, message: 'Account deleted successfully.' } });

    await expect(deleteSubcontractorAccount(' user@example.com ', 'Secret@123')).resolves.toBe(
      'Account deleted successfully.',
    );
    expect(mockedAxiosRequest).toHaveBeenCalledWith(
      expect.objectContaining({
        method: 'post',
        url: SALESFORCE_SUBCONTRACTOR_DELETE_URL,
        data: { email: 'user@example.com', password: 'Secret@123' },
      }),
    );
  });

  it('throws the API message when the password is wrong', async () => {
    mockedAxiosRequest.mockResolvedValue({ data: { success: false, message: 'Invalid password.' } });
    await expect(deleteSubcontractorAccount('user@example.com', 'wrong')).rejects.toThrow('Invalid password.');
  });

  it('falls back to a generic message when the API sends none', async () => {
    mockedAxiosRequest.mockResolvedValue({ data: { success: false } });
    await expect(deleteSubcontractorAccount('user@example.com', 'wrong')).rejects.toThrow(
      'Unable to delete your account. Please try again.',
    );
  });
});
