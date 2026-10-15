import { useMemo } from 'react';
import { useSubcontractorSession } from '../context/SubcontractorSessionContext';
import { fetchPaymentSettings } from '../services/paymentSettingsService';
import { PaymentSettings } from '../types/paymentSettings';
import { AsyncResource, useAsyncResource } from './useAsyncResource';

/** Loads the logged-in account's ACH details, payment terms and due date term. */
export function usePaymentSettings(): AsyncResource<PaymentSettings> {
  const accountId = useSubcontractorSession().company?.accountId;
  // No account yet → null, which useAsyncResource reports as an error.
  const load = useMemo(() => (accountId ? () => fetchPaymentSettings(accountId) : null), [accountId]);
  return useAsyncResource(load);
}
