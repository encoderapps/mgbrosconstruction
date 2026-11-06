import {
  COMPLIANCE_DOCUMENT_INFO,
  COMPLIANCE_DOCUMENT_ORDER,
  EXPIRY_WARNING_DAYS,
  PAPERWORK_COMPLETE_STATUS,
} from '../constants/complianceDocuments';
import { EMPTY_VALUE } from '../constants/display';
import { Tone } from '../theme';
import { ComplianceDocument, ComplianceDocumentFile, ComplianceDocumentType } from '../types/document';
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

/** General Liability and Workers' Comp are certificates of insurance. */
export function isInsuranceCertificate(type: ComplianceDocumentType): boolean {
  return type === 'generalLiability' || type === 'workersComp';
}

/** Whether the login's subsPaperworkMG says the account's paperwork is in order. */
export function isPaperworkComplete(status: string | null | undefined): boolean {
  return status?.trim().toLowerCase() === PAPERWORK_COMPLETE_STATUS.toLowerCase();
}

function toUsDate(isoDate: string | null): string {
  return isoDate ? formatUsDate(isoDate) : EMPTY_VALUE;
}

function toYesNo(value: boolean | null): string {
  return value === null ? EMPTY_VALUE : value ? 'Yes' : 'No';
}

/** The key facts of the current copy, shown in the Documents list; none when nothing is on file. */
export function getDocumentSummary(
  type: ComplianceDocumentType,
  current: ComplianceDocumentFile | null,
): DocumentSummaryRow[] {
  if (!current) {
    return [];
  }
  if (type === 'masterSubcontractAgreement') {
    // Its expiration (a year after signing) isn't shown, only its status.
    return [{ label: 'Signed Date', value: toUsDate(current.signedDate) }];
  }
  if (!isInsuranceCertificate(type)) {
    return [
      { label: 'Federal Tax Classification', value: current.taxClassification || EMPTY_VALUE },
      { label: 'Tax Identification Number', value: current.taxId ? maskTaxId(current.taxId) : EMPTY_VALUE },
      { label: 'W9 Signed Date', value: toUsDate(current.signedDate) },
    ];
  }
  return [
    { label: 'Insurance Company Name', value: current.insuranceCompanyName || EMPTY_VALUE },
    { label: 'Policy Number', value: current.policyNumber || EMPTY_VALUE },
    // Only General Liability names MG Bros as additional insured.
    ...(type === 'generalLiability'
      ? [{ label: 'Additional Insured', value: toYesNo(current.additionalInsured) }]
      : []),
    { label: 'Effective Date', value: toUsDate(current.effectiveDate) },
    { label: 'Expiration Date', value: toUsDate(current.expirationDate) },
  ];
}

/**
 * Where the document stands: nothing on file; or active, expiring soon (within
 * EXPIRY_WARNING_DAYS), expired, or missing its expiration date. (A W9 or MSA
 * expires a year after it was signed; see complianceDocumentService.)
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
  const noun = isInsuranceCertificate(type) ? 'certificate' : type === 'w9' ? label : 'agreement';
  if (!current.expirationDate) {
    return { tone: 'warning', message: `This ${noun} has no expiration date.` };
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
  return { tone: 'success', message: `This ${noun} is active.` };
}

/** The documents whose current copy's expiration date has passed (today itself is still valid), in display order. */
export function getExpiredDocumentTypes(
  documents: readonly ComplianceDocument[],
  today: Date = new Date(),
): ComplianceDocumentType[] {
  return documents
    .filter(({ current }) => !!current?.expirationDate && daysUntil(current.expirationDate, today) < 0)
    .map(({ type }) => type);
}

/** The documents with nothing on file (no current copy), in display order. */
export function getMissingDocumentTypes(documents: readonly ComplianceDocument[]): ComplianceDocumentType[] {
  return documents.filter(({ current }) => !current).map(({ type }) => type);
}

/** ['w9'] → "W9"; ['w9', 'generalLiability', 'workersComp'] → "W9, General Liability and Workers' Comp". */
export function joinDocumentLabels(types: readonly ComplianceDocumentType[]): string {
  const labels = types.map((type) => COMPLIANCE_DOCUMENT_INFO[type].label);
  return labels.length > 1 ? `${labels.slice(0, -1).join(', ')} and ${labels[labels.length - 1]}` : labels.join('');
}

/** The documents that must be uploaded before the rest of the portal opens: expired, or not on file. */
export interface DocumentsToUpload {
  expired: ComplianceDocumentType[];
  missing: ComplianceDocumentType[];
}

export function getDocumentsToUpload(
  documents: readonly ComplianceDocument[],
  today: Date = new Date(),
): DocumentsToUpload {
  return { expired: getExpiredDocumentTypes(documents, today), missing: getMissingDocumentTypes(documents) };
}

/**
 * Why the portal is locked and what to upload, e.g. "Your General Liability has
 * expired and your Master Subcontract Agreement is missing. Upload General
 * Liability and Master Subcontract Agreement to open Purchase Orders, …".
 */
export function describeDocumentsToUpload({ expired, missing }: DocumentsToUpload, lockedSections: string): string {
  const reasons = [
    expired.length > 0 && `${joinDocumentLabels(expired)} ${expired.length === 1 ? 'has' : 'have'} expired`,
    missing.length > 0 && `${joinDocumentLabels(missing)} ${missing.length === 1 ? 'is' : 'are'} missing`,
  ].filter(Boolean);
  // Upload in display order, whichever reason each one has.
  const toUpload = COMPLIANCE_DOCUMENT_ORDER.filter((type) => expired.includes(type) || missing.includes(type));
  return `Your ${reasons.join(' and your ')}. Upload ${joinDocumentLabels(toUpload)} to open ${lockedSections}.`;
}
