import { SALESFORCE_SERVICE_ITEMS_URL } from '../constants/config';
import { ServiceItemsApiResponse } from '../types';
import { salesforceGet } from './salesforceClient';

const LOAD_ERROR_MESSAGE = 'Unable to load the services.';

/**
 * The services a subcontractor can pick at registration (GET /serviceitems),
 * trimmed, without blanks or repeats, in the API's order. Throws an Error with
 * a message fit to show the user.
 */
export async function fetchServiceItems(): Promise<string[]> {
  const data = await salesforceGet<ServiceItemsApiResponse>(SALESFORCE_SERVICE_ITEMS_URL, {});
  if (!data.success) {
    throw new Error(data.message || LOAD_ERROR_MESSAGE);
  }
  const items = (data.serviceItems ?? []).map((item) => item?.trim() ?? '').filter(Boolean);
  return [...new Set(items)];
}
