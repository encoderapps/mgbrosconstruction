import axios from 'axios';
import { API_TIMEOUT_MS, SALESFORCE_FORGOT_PASSWORD_URL } from '../constants/config';
import { ForgotPasswordResponse } from '../types';
import { fetchSalesforceAccessToken, getStoredSalesforceAccessToken } from './salesforceAuthService';

/**
 * Thrown by the steps of the reset flow whose backend contract hasn't been
 * provided yet, so screens can show a clear message instead of a generic
 * failure.
 */
export class PasswordResetNotAvailableError extends Error {
  constructor() {
    super('Password reset API contract has not been provided yet.');
    this.name = 'PasswordResetNotAvailableError';
  }
}

/**
 * Maps a thrown request error to a user-friendly message, without exposing
 * raw Salesforce error text.
 */
export function getResetRequestErrorMessage(error: unknown): string {
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
  return 'Something went wrong while sending the reset code. Please try again.';
}

/**
 * Asks Salesforce to email a password reset code. The backend deliberately
 * responds the same way whether or not the email has an account, so a
 * `success: true` here does not mean the email exists.
 */
export async function requestPasswordResetCode(email: string): Promise<ForgotPasswordResponse> {
  const postWithToken = (accessToken: string) =>
    axios.post<ForgotPasswordResponse>(
      SALESFORCE_FORGOT_PASSWORD_URL,
      { action: 'SEND_RESET', email },
      {
        timeout: API_TIMEOUT_MS,
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
 * TODO: Integrate once the backend provides the password-reset contract
 * (endpoint/action, request body, and response shape). The backend is the
 * authority on the reset code: correctness, 15-minute expiry, and reuse. If
 * it exposes a separate code-verification step, call it from
 * VerifyResetCodeScreen before navigating to ChangePassword.
 */
export async function resetPassword(
  _email: string,
  _resetCode: string,
  _newPassword: string,
): Promise<never> {
  throw new PasswordResetNotAvailableError();
}
