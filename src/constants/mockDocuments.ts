import { ComplianceDocument } from '../types/document';

/**
 * Placeholder compliance documents: there's no documents API yet. Remove once
 * complianceDocumentService calls the real endpoint.
 */
export const MOCK_COMPLIANCE_DOCUMENTS: ComplianceDocument[] = [
  {
    type: 'w9',
    federalTaxClassification: 'S Corporation',
    taxIdentificationNumber: 'XX-XXXXXXX',
    signedDate: '2025-05-20',
    current: {
      id: 'w9-3',
      fileName: 'W9 - 2025.pdf',
      uploadedOn: '2025-05-20',
      uploadedBy: 'John Smith',
      fileSizeKb: 210,
    },
    previousVersions: [
      { id: 'w9-2', fileName: 'W9 - Jan 2025.pdf', uploadedOn: '2025-01-15', fileSizeKb: 210 },
      { id: 'w9-1', fileName: 'W9 - 2024.pdf', uploadedOn: '2024-05-10', fileSizeKb: 205 },
    ],
  },
  {
    type: 'generalLiability',
    referenceId: 'GL-9872',
    insuranceCompanyName: 'State Farm Insurance',
    policyNumber: 'GL-2025-001234',
    additionalInsured: true,
    effectiveDate: '2026-05-18',
    expirationDate: '2027-05-18',
    current: {
      id: 'gl-3',
      fileName: 'GL - 5/18/2026 - 5/18/2027.pdf',
      uploadedOn: '2026-05-18',
      uploadedBy: 'John Smith',
      fileSizeKb: 315,
    },
    previousVersions: [
      {
        id: 'gl-2',
        fileName: 'GL - 5/18/2025 - 5/18/2026.pdf',
        uploadedOn: '2025-05-18',
        expirationDate: '2026-05-18',
        fileSizeKb: 315,
      },
      {
        id: 'gl-1',
        fileName: 'GL - 1/12/2025 - 1/12/2026.pdf',
        uploadedOn: '2025-01-12',
        expirationDate: '2026-01-12',
        fileSizeKb: 310,
      },
    ],
  },
  {
    type: 'workersComp',
    referenceId: 'WC-5829',
    insuranceCompanyName: 'Liberty Mutual',
    policyNumber: 'WC-2025-005678',
    effectiveDate: '2025-11-21',
    expirationDate: '2026-11-21',
    current: {
      id: 'wc-3',
      fileName: 'WC - 2025.pdf',
      uploadedOn: '2025-11-21',
      uploadedBy: 'John Smith',
      fileSizeKb: 260,
    },
    previousVersions: [
      { id: 'wc-2', fileName: 'WC - 2024.pdf', uploadedOn: '2024-05-05', expirationDate: '2025-05-05', fileSizeKb: 260 },
      { id: 'wc-1', fileName: 'WC - 2023.pdf', uploadedOn: '2023-05-02', expirationDate: '2024-05-02', fileSizeKb: 254 },
    ],
  },
];
