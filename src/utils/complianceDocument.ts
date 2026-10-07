import { COMPLIANCE_DOCUMENT_INFO, EXPIRY_WARNING_DAYS } from '../constants/complianceDocuments';
import { EMPTY_VALUE } from '../constants/display';
import { Tone } from '../theme';
import { ComplianceDocumentFile, ComplianceDocumentType } from '../types/document';
import { daysUntil, formatShortDate, formatUsDate } from './formatDate';
import { maskTaxId } from './taxId';

export interface DocumentSummaryRow {
  label: string;
  value: string;
}

export interface DocumentStatus {
  tone: Extract<Tone, 'success' | 'warning' | 'danger'>;
  message: string;
}

/** General Liability and Workers' Comp are certificates of insurance, which expire; a W9 doesn't. */
export function isInsuranceCertificate(type: ComplianceDocumentType): boolean {
  return type !== 'w9';
}

function toUsDate(isoDate: string | null): string {
  return isoDate ? formatUsDate(isoDate) : EMPTY_VALUE;
}

/** The key dates of the current copy, shown in the Documents list; none when nothing is on file. */
export function getDocumentSummary(
  type: ComplianceDocumentType,
  current: ComplianceDocumentFile | null,
): DocumentSummaryRow[] {
  if (!current) {
    return [];
  }
  if (!isInsuranceCertificate(type)) {
    return [
      { label: 'Federal Tax Classification', value: current.taxClassification || EMPTY_VALUE },
      { label: 'Tax Identification Number', value: current.taxId ? maskTaxId(current.taxId) : EMPTY_VALUE },
      { label: 'W9 Signed Date', value: toUsDate(current.signedDate) },
    ];
  }
  return [
    { label: 'Effective Date', value: toUsDate(current.effectiveDate) },
    { label: 'Expiration Date', value: toUsDate(current.expirationDate) },
  ];
}

/**
 * Where the document stands: nothing on file; a W9 on file; or an insurance
 * certificate that's active, expiring soon (within EXPIRY_WARNING_DAYS),
 * expired, or missing its expiration date.
 */
export function getDocumentStatus(
  type: ComplianceDocumentType,
  current: ComplianceDocumentFile | null,
  today: Date = new Date(),
): DocumentStatus {
  const { label } = COMPLIANCE_DOCUMENT_INFO[type];
  if (!current) {
    return { tone: 'danger', message: `No ${label} on file.` };
  }
  if (!isInsuranceCertificate(type)) {
    return { tone: 'success', message: `This is the current ${label} on file.` };
  }
  if (!current.expirationDate) {
    return { tone: 'warning', message: 'This certificate has no expiration date.' };
  }

  const days = daysUntil(current.expirationDate, today);
  const date = formatShortDate(current.expirationDate);
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
