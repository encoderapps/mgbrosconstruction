import axios, { AxiosRequestConfig } from 'axios';
import { fetchSalesforceAccessToken, getStoredSalesforceAccessToken } from './salesforceAuthService';

/** Sends a request to an Apex REST endpoint with the stored Salesforce token, refreshing it once on a 401. */
export async function salesforceRequest<Response>(config: AxiosRequestConfig): Promise<Response> {
  const sendWithToken = (accessToken: string) =>
    axios.request<Response>({
      ...config,
      headers: { ...config.headers, Authorization: `Bearer ${accessToken}` },
    });

  const storedToken = await getStoredSalesforceAccessToken();
  try {
    const accessToken = storedToken ?? (await fetchSalesforceAccessToken());
    const { data } = await sendWithToken(accessToken);
    return data;
  } catch (error) {
    if (!axios.isAxiosError(error) || error.response?.status !== 401) {
      throw error;
    }
    const refreshedToken = await fetchSalesforceAccessToken();
    const { data } = await sendWithToken(refreshedToken);
    return data;
  }
}

/** GETs an Apex REST endpoint with the stored Salesforce token, refreshing it once on a 401. */
export function salesforceGet<Response>(url: string, params: Record<string, string>): Promise<Response> {
  if (__DEV__) {
    // Shows which account a list is being loaded for (Metro logs).
    console.log('[Salesforce GET]', url, params);
  }
  return salesforceRequest<Response>({ method: 'get', url, params });
}
