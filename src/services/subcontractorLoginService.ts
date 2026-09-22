import axios from 'axios';
import { SALESFORCE_SUBCONTRACTOR_LOGIN_URL } from '../constants/config';
import { SubcontractorLoginResponse } from '../types';
import { fetchSalesforceAccessToken, getStoredSalesforceAccessToken } from './salesforceAuthService';

export async function loginSubcontractor(email: string, password: string): Promise<SubcontractorLoginResponse> {
  const postWithToken = (accessToken: string) =>
    axios.post<SubcontractorLoginResponse>(
      SALESFORCE_SUBCONTRACTOR_LOGIN_URL,
      { email, password },
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

      // Other Apex REST endpoints on this org respond with a non-2xx status
      // for expected "failure" cases while still returning a normal JSON
      // body — recover that body here instead of surfacing it as a thrown
      // error, so invalid-credentials responses are handled the same way.
      const data = error.response?.data as Partial<SubcontractorLoginResponse> | undefined;
      if (data && typeof data.success === 'boolean') {
        return data as SubcontractorLoginResponse;
      }
    }
    throw error;
  }
}
