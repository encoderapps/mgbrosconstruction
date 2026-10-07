/** The compliance documents a subcontractor keeps on file with MG Bros. */
export type ComplianceDocumentType = 'w9' | 'generalLiability' | 'workersComp';

export type InsuranceCertificateType = Exclude<ComplianceDocumentType, 'w9'>;

/** One uploaded copy of a compliance document. Dates are YYYY-MM-DD. */
export interface ComplianceDocumentFile {
  id: string;
  fileName: string;
  uploadedOn: string;
  uploadedBy?: string;
  /**
   * Insurance certificates' previous versions only (a W9 doesn't expire). The
   * current copy's dates are the certificate's own effectiveDate/expirationDate.
   */
  expirationDate?: string;
  fileSizeKb: number;
}

interface ComplianceDocumentBase {
  /** The copy used for compliance: the most recent upload. */
  current: ComplianceDocumentFile;
  /** Older copies, newest first. */
  previousVersions: ComplianceDocumentFile[];
}

export interface W9Document extends ComplianceDocumentBase {
  type: 'w9';
  federalTaxClassification: string;
  /** Already masked by the server, e.g. "XX-XXXXXXX". */
  taxIdentificationNumber: string;
  signedDate: string;
}

export interface InsuranceCertificate extends ComplianceDocumentBase {
  type: InsuranceCertificateType;
  /** Certificate ID, e.g. "WC-5829". */
  referenceId: string;
  insuranceCompanyName: string;
  policyNumber: string;
  /** General Liability only: whether MG Bros is named as additional insured. */
  additionalInsured?: boolean;
  effectiveDate: string;
  expirationDate: string;
}

export type ComplianceDocument = W9Document | InsuranceCertificate;
