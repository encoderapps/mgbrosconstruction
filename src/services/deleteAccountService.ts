import { SALESFORCE_SUBCONTRACTOR_DELETE_URL } from '../constants/config';
import { salesforceSend } from './salesforceClient';

interface DeleteAccountApiPayload {
  email: string;
  password: string;
}

interface DeleteAccountApiResponse {
  success: boolean;
  message?: string | null;
}

const DEFAULT_ERROR_MESSAGE = 'Unable to delete your account. Please try again.';

/**
 * Deletes the subcontractor's account (POST /subcontractordelete). The API
 * checks the password against the registered email first. Returns the API's
 * message (e.g. "Account deleted successfully."); throws an Error with a
 * message fit to show the user, e.g. for a wrong password.
 */
export async function deleteSubcontractorAccount(email: string, password: string): Promise<string> {
  const payload: DeleteAccountApiPayload = { email: email.trim(), password };
  const data = await salesforceSend<DeleteAccountApiResponse>(
    { method: 'post', url: SALESFORCE_SUBCONTRACTOR_DELETE_URL, data: payload },
    DEFAULT_ERROR_MESSAGE,
    { hideBody: true },
  );
  if (!data.success) {
    throw new Error(data.message?.trim() || DEFAULT_ERROR_MESSAGE);
  }
  return data.message?.trim() || 'Account deleted successfully.';
}
