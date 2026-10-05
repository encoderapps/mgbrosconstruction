import axios, { AxiosRequestConfig } from 'axios';
import { API_TIMEOUT_MS } from '../constants/config';
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

const NETWORK_ERROR_MESSAGE = 'Unable to reach the server. Check your connection and try again.';
const TIMEOUT_ERROR_MESSAGE = 'The server took too long to respond. Please try again.';

/**
 * Sends a write request (POST/PATCH) to an Apex REST endpoint and returns its
 * { success, … } body. Like the other endpoints on this org, a failure may come
 * back as a non-2xx status with a normal { success, message } body, which is
 * returned as-is so the caller can show the message. Any other failure throws
 * an Error whose message is fit to show the user (`fallbackMessage` for server
 * errors). The caller still has to check `success`.
 */
export async function salesforceSend<Response extends { success: boolean }>(
  config: AxiosRequestConfig,
  fallbackMessage: string,
): Promise<Response> {
  if (__DEV__) {
    console.log(`[Salesforce ${config.method?.toUpperCase()}]`, config.url, JSON.stringify(config.data));
  }
  let data: Partial<Response> | undefined;
  try {
    data = await salesforceRequest<Response>({
      timeout: API_TIMEOUT_MS,
      ...config,
      headers: { 'Content-Type': 'application/json', ...config.headers },
    });
  } catch (error) {
    if (!axios.isAxiosError(error)) {
      throw new Error(fallbackMessage);
    }
    if (__DEV__) {
      const { status, data: body } = error.response ?? {};
      console.log(`[Salesforce ${config.method?.toUpperCase()}] failed`, status, JSON.stringify(body));
    }
    data = error.response?.data as Partial<Response> | undefined;
    if (!data || typeof data.success !== 'boolean') {
      if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
        throw new Error(TIMEOUT_ERROR_MESSAGE);
      }
      throw new Error(error.response ? fallbackMessage : NETWORK_ERROR_MESSAGE);
    }
  }
  // A 2xx with an unexpected body (e.g. an HTML error page) is a failure too.
  if (!data || typeof data.success !== 'boolean') {
    throw new Error(fallbackMessage);
  }
  return data as Response;
}

/** GETs an Apex REST endpoint with the stored Salesforce token, refreshing it once on a 401. */
export function salesforceGet<Response>(url: string, params: Record<string, string>): Promise<Response> {
  if (__DEV__) {
    // Shows which account a list is being loaded for (Metro logs).
    console.log('[Salesforce GET]', url, params);
  }
  return salesforceRequest<Response>({ method: 'get', url, params });
}
