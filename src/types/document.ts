/** The compliance documents a subcontractor keeps on file with MG Bros. */
export type ComplianceDocumentType = 'w9' | 'generalLiability' | 'workersComp';

/** One copy of a compliance document. Dates are YYYY-MM-DD. */
export interface ComplianceDocumentFile {
  id: string;
  /** Salesforce record name, e.g. "Ext-File-0000000350"; shown as the document's ID. */
  recordName: string;
  /** With its extension when known, e.g. "W9 - ABC Construction Services.pdf". */
  fileName: string;
  /** Server-relative download path; null when the record has no file attached yet. */
  fileUrl: string | null;
  fileSizeBytes: number | null;
  /** The device's local date of the upload; null when nothing has been uploaded. */
  uploadedOn: string | null;
  uploadedBy: string | null;
  /** W9 only, e.g. "LLC". */
  taxClassification: string | null;
  /** W9 only: the full EIN as sent by the API; mask it before display (maskTaxId). */
  taxId: string | null;
  /** W9 only. */
  signedDate: string | null;
  /** Insurance certificates only. */
  insuranceCompanyName: string | null;
  /** Insurance certificates only. */
  policyNumber: string | null;
  /** General Liability only: whether MG Bros is named as additional insured; null when unknown. */
  additionalInsured: boolean | null;
  /** Insurance certificates only. */
  effectiveDate: string | null;
  /** Insurance certificates only. */
  expirationDate: string | null;
}

export interface ComplianceDocument {
  type: ComplianceDocumentType;
  /** The copy used for compliance; null when none is on file. */
  current: ComplianceDocumentFile | null;
  /** Older copies, newest first. */
  previousVersions: ComplianceDocumentFile[];
}
