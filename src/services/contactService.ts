import axios from 'axios';
import { SALESFORCE_CONTACT_URL } from '../constants/config';
import { CreateContactApiPayload, CreateContactResponse, UpdateContactApiPayload } from '../types';
import { salesforceRequest } from './salesforceClient';

/** Sends a contact request with the stored Salesforce token, refreshing it once on a 401. */
async function sendContactRequest(
  method: 'post' | 'patch',
  url: string,
  payload: CreateContactApiPayload,
): Promise<CreateContactResponse> {
  try {
    return await salesforceRequest<CreateContactResponse>({
      method,
      url,
      data: payload,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    // Like the other Apex REST endpoints on this org, a failure may come
    // back as a non-2xx status with a normal { success, message } body —
    // recover it so the screen can show the message.
    if (axios.isAxiosError(error)) {
      const data = error.response?.data as Partial<CreateContactResponse> | undefined;
      if (data && typeof data.success === 'boolean') {
        return data as CreateContactResponse;
      }
    }
    throw error;
  }
}

/** Creates a Contact in Salesforce and associates it with the subcontractor's Account. */
export function createContact(payload: CreateContactApiPayload): Promise<CreateContactResponse> {
  return sendContactRequest('post', SALESFORCE_CONTACT_URL, payload);
}

/** Updates an existing Salesforce Contact (PATCH /contact/{contactId}). */
export function updateContact(contactId: string, payload: UpdateContactApiPayload): Promise<CreateContactResponse> {
  return sendContactRequest('patch', `${SALESFORCE_CONTACT_URL}/${encodeURIComponent(contactId)}`, payload);
}
