import axios from 'axios';
import { API_TIMEOUT_MS, SALESFORCE_FORGOT_PASSWORD_URL } from '../constants/config';
import { ForgotPasswordResponse } from '../types';
import { fetchSalesforceAccessToken, getStoredSalesforceAccessToken } from './salesforceAuthService';

type ForgotPasswordRequest =
  | { action: 'SEND_RESET'; email: string }
  | { action: 'RESET_PASSWORD'; token: string; newPassword: string; confirmPassword: string };

/**
 * Maps a thrown request error to a user-friendly message, without exposing
 * raw Salesforce error text.
 */
export function getResetRequestErrorMessage(
  error: unknown,
  fallback = 'Something went wrong while sending the reset code. Please try again.',
): string {
  if (axios.isAxiosError(error)) {
    if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
      return 'The request timed out. Please check your connection and try again.';
    }
    if (!error.response) {
      return 'Unable to connect. Please check your internet connection and try again.';
    }
    if (error.response.status >= 500) {
      return 'The server is having trouble right now. Please try again later.';
    }
  }
  return fallback;
}

/**
 * Both reset steps share one Apex REST endpoint, distinguished by `action`.
 */
async function postForgotPasswordAction(body: ForgotPasswordRequest): Promise<ForgotPasswordResponse> {
  const postWithToken = (accessToken: string) =>
    axios.post<ForgotPasswordResponse>(SALESFORCE_FORGOT_PASSWORD_URL, body, {
      timeout: API_TIMEOUT_MS,
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

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

      // Apex REST can return a non-2xx status with a normal
      // { success, message, accountId } body; recover it so the screen can
      // treat it as a handled `success: false` rather than a crash.
      const data = error.response?.data as Partial<ForgotPasswordResponse> | undefined;
      if (data && typeof data.success === 'boolean') {
        return data as ForgotPasswordResponse;
      }
    }
    throw error;
  }
}

/**
 * Asks Salesforce to email a password reset code. The backend deliberately
 * responds the same way whether or not the email has an account, so a
 * `success: true` here does not mean the email exists.
 */
export function requestPasswordResetCode(email: string): Promise<ForgotPasswordResponse> {
  return postForgotPasswordAction({ action: 'SEND_RESET', email });
}

/**
 * Sets a new password using the emailed reset code. The backend is the
 * authority on the code: correctness, 15-minute expiry, and reuse.
 */
export function resetPassword(
  resetCode: string,
  newPassword: string,
  confirmPassword: string,
): Promise<ForgotPasswordResponse> {
  return postForgotPasswordAction({
    action: 'RESET_PASSWORD',
    token: resetCode,
    newPassword,
    confirmPassword,
  });
}
