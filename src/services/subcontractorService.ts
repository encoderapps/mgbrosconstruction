import { api } from './api';
import { ApiResponse } from '../types';

export interface CheckEmailAvailabilityResponse {
  available: boolean;
}

// TEMPORARY DEV-ONLY FALLBACK: no backend implements /subcontractors/check-email
// yet, so the real request below always fails. Until the endpoint exists, treat
// these emails as already registered (everything else counts as available) so
// the registration flow can be tested end-to-end in development builds.
// Remove DEV_EXISTING_EMAILS and this catch block once the real API is live.
const DEV_EXISTING_EMAILS = ['existing@mgbros.com', 'test@existing.com'];

export async function checkEmailAvailability(email: string): Promise<boolean> {
  try {
    const { data } = await api.get<ApiResponse<CheckEmailAvailabilityResponse>>(
      '/subcontractors/check-email',
      { params: { email } },
    );
    return (data.data as CheckEmailAvailabilityResponse).available;
  } catch (error) {
    if (__DEV__) {
      return !DEV_EXISTING_EMAILS.includes(email.trim().toLowerCase());
    }
    throw error;
  }
}
