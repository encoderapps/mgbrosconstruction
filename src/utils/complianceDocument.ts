import { COMPLIANCE_DOCUMENT_INFO, EXPIRY_WARNING_DAYS } from '../constants/complianceDocuments';
import { Tone } from '../theme';
import { ComplianceDocument, InsuranceCertificate } from '../types/document';
import { daysUntil, formatShortDate, formatUsDate } from './formatDate';

export interface DocumentSummaryRow {
  label: string;
  value: string;
}

export interface DocumentStatus {
  tone: Extract<Tone, 'success' | 'warning' | 'danger'>;
  message: string;
}

export function isInsuranceCertificate(document: ComplianceDocument): document is InsuranceCertificate {
  return document.type !== 'w9';
}

/** The key facts shown for a document in the Documents list. */
export function getDocumentSummary(document: ComplianceDocument): DocumentSummaryRow[] {
  if (!isInsuranceCertificate(document)) {
    return [
      { label: 'Federal Tax Classification', value: document.federalTaxClassification },
      { label: 'Tax Identification Number', value: document.taxIdentificationNumber },
      { label: 'W9 Signed Date', value: formatUsDate(document.signedDate) },
    ];
  }
  return [
    { label: 'Insurance Company Name', value: document.insuranceCompanyName },
    { label: 'Policy Number', value: document.policyNumber },
    ...(document.additionalInsured === undefined
      ? []
      : [{ label: 'Additional Insured', value: document.additionalInsured ? 'Yes' : 'No' }]),
    { label: 'Effective Date', value: formatUsDate(document.effectiveDate) },
    { label: 'Expiration Date', value: formatUsDate(document.expirationDate) },
  ];
}

/**
 * Where the document's current copy stands: a W9 is simply on file; an
 * insurance certificate is active, expiring soon (within EXPIRY_WARNING_DAYS)
 * or expired.
 */
export function getDocumentStatus(document: ComplianceDocument, today: Date = new Date()): DocumentStatus {
  if (!isInsuranceCertificate(document)) {
    return { tone: 'success', message: `This is the current ${COMPLIANCE_DOCUMENT_INFO.w9.label} on file.` };
  }

  const days = daysUntil(document.expirationDate, today);
  const date = formatShortDate(document.expirationDate);
  if (days < 0) {
    return { tone: 'danger', message: `Expired on ${date}` };
  }
  if (days === 0) {
    return { tone: 'warning', message: `Expires today (${date})` };
  }
  if (days <= EXPIRY_WARNING_DAYS) {
    return { tone: 'warning', message: `Expires in ${days} ${days === 1 ? 'day' : 'days'} (${date})` };
  }
  return { tone: 'success', message: 'This certificate is active.' };
}
