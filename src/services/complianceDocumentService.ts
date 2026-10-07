import { COMPLIANCE_DOCUMENT_ORDER } from '../constants/complianceDocuments';
import { MOCK_COMPLIANCE_DOCUMENTS } from '../constants/mockDocuments';
import { ComplianceDocument } from '../types/document';

/**
 * Fetches the account's W9, General Liability and Workers' Comp, in display
 * order, each with its current copy and previous versions.
 *
 * TODO: no documents endpoint exists yet, so this returns mock data. Replace
 * the body with a salesforceGet call (and map the response) once it ships;
 * the screens already handle loading and errors.
 */
export async function fetchComplianceDocuments(_accountId: string): Promise<ComplianceDocument[]> {
  return [...MOCK_COMPLIANCE_DOCUMENTS].sort(
    (a, b) => COMPLIANCE_DOCUMENT_ORDER.indexOf(a.type) - COMPLIANCE_DOCUMENT_ORDER.indexOf(b.type),
  );
}
