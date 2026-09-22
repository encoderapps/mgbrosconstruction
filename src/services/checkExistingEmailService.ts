import axios from 'axios';
import { SALESFORCE_CHECK_EXISTING_EMAIL_URL } from '../constants/config';
import { CheckExistingEmailResponse } from '../types';
import { fetchSalesforceAccessToken, getStoredSalesforceAccessToken } from './salesforceAuthService';

export async function checkExistingEmail(email: string): Promise<CheckExistingEmailResponse> {
  const postWithToken = (accessToken: string) =>
    axios.post<CheckExistingEmailResponse>(
      SALESFORCE_CHECK_EXISTING_EMAIL_URL,
      { email },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      },
    );

  const storedToken = await getStoredSalesforceAccessToken();
  try {
    const accessToken = storedToken ?? (await fetchSalesforceAccessToken());
    const { data } = await postWithToken(accessToken);
    return data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      if (error.response?.status === 401) {
        const refreshedToken = await fetchSalesforceAccessToken();
        const { data } = await postWithToken(refreshedToken);
        return data;
      }

      // This endpoint responds with HTTP 400 (not 200) for an existing
      // email, but still with a normal { success, message, accountId }
      // body — axios treats any non-2xx as a thrown error, so recover the
      // body here instead of surfacing it as a failure.
      const data = error.response?.data as Partial<CheckExistingEmailResponse> | undefined;
      if (data && typeof data.success === 'boolean') {
        return data as CheckExistingEmailResponse;
      }
    }
    throw error;
  }
}
