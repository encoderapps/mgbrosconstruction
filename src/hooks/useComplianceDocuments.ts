import { useMemo } from 'react';
import { useSubcontractorSession } from '../context/SubcontractorSessionContext';
import { fetchComplianceDocuments } from '../services/complianceDocumentService';
import { ComplianceDocument } from '../types/document';
import { AsyncResource, useAsyncResource } from './useAsyncResource';

/**
 * Loads the logged-in account's compliance documents (W9, General Liability,
 * Workers' Comp, Master Subcontract Agreement). Each load also brings the
 * account's current paperwork status, which updates the header's Documents
 * pill (so it turns green once an upload completes the paperwork).
 */
export function useComplianceDocuments(): AsyncResource<ComplianceDocument[]> {
  const { company, setPaperworkStatus } = useSubcontractorSession();
  const accountId = company?.accountId;
  // No account yet → null, which useAsyncResource reports as an error.
  const load = useMemo(
    () =>
      accountId
        ? async () => {
            const { documents, paperworkStatus } = await fetchComplianceDocuments(accountId);
            if (paperworkStatus !== null) {
              setPaperworkStatus(paperworkStatus);
            }
            return documents;
          }
        : null,
    [accountId, setPaperworkStatus],
  );
  return useAsyncResource(load);
}
