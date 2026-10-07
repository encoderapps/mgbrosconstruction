import { useMemo } from 'react';
import { useSubcontractorSession } from '../context/SubcontractorSessionContext';
import { fetchComplianceDocuments } from '../services/complianceDocumentService';
import { ComplianceDocument } from '../types/document';
import { AsyncResource, useAsyncResource } from './useAsyncResource';

/** Loads the logged-in account's compliance documents (W9, General Liability, Workers' Comp). */
export function useComplianceDocuments(): AsyncResource<ComplianceDocument[]> {
  const accountId = useSubcontractorSession().company?.accountId;
  // No account yet → null, which useAsyncResource reports as an error.
  const load = useMemo(() => (accountId ? () => fetchComplianceDocuments(accountId) : null), [accountId]);
  return useAsyncResource(load);
}
