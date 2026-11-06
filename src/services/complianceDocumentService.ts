import { SALESFORCE_SUBCONTRACTOR_DOCUMENT_UPLOAD_URL, SALESFORCE_SUBCONTRACTOR_DOCUMENTS_URL } from '../constants/config';
import {
  COMPLIANCE_DOCUMENT_INFO,
  COMPLIANCE_DOCUMENT_ORDER,
  SIGNED_DOCUMENT_VALID_YEARS,
} from '../constants/complianceDocuments';
import { EMPTY_VALUE } from '../constants/display';
import {
  SubcontractorDocumentApiRecord,
  SubcontractorDocumentGroupApiRecord,
  SubcontractorDocumentsApiResponse,
  SubcontractorDocumentUploadApiPayload,
  SubcontractorDocumentUploadApiResponse,
  SubcontractorDocumentUploadDates,
} from '../types';
import { ComplianceDocument, ComplianceDocumentFile, ComplianceDocumentType } from '../types/document';
import { isInsuranceCertificate } from '../utils/complianceDocument';
import { addYears, timestampToLocalDate } from '../utils/dateValidation';
import { salesforceGet, salesforceSend } from './salesforceClient';

/** The API's documentType (also each record's recordTypeName), lower-cased, → the app's document type. */
const DOCUMENT_TYPES_BY_API_NAME: Record<string, ComplianceDocumentType> = {
  w9: 'w9',
  'coi - general liability': 'generalLiability',
  'coi - workers comp': 'workersComp',
  'master subcontract agreement': 'masterSubcontractAgreement',
  'master subcontractor agreement': 'masterSubcontractAgreement',
  msa: 'masterSubcontractAgreement',
};

function toDocumentType(apiName: string | null | undefined): ComplianceDocumentType | null {
  return DOCUMENT_TYPES_BY_API_NAME[apiName?.trim().toLowerCase() ?? ''] ?? null;
}

/** "W9 - ABC" + "pdf" → "W9 - ABC.pdf"; the record name when the file has no name. */
function toFileName(record: SubcontractorDocumentApiRecord): string {
  const baseName = record.fileName?.trim() || record.name?.trim() || EMPTY_VALUE;
  const extension = record.fileExtension?.trim().replace(/^\./, '');
  return extension && !baseName.toLowerCase().endsWith(`.${extension.toLowerCase()}`)
    ? `${baseName}.${extension}`
    : baseName;
}

/** Bytes when given, else the KB figure converted (the API sends both, either may be null). */
function toFileSizeBytes(record: SubcontractorDocumentApiRecord): number | null {
  if (record.fileSizeBytes != null) {
    return record.fileSizeBytes;
  }
  return record.fileSizeKB != null ? Math.round(record.fileSizeKB * 1024) : null;
}

function toComplianceDocumentFile(
  type: ComplianceDocumentType,
  record: SubcontractorDocumentApiRecord,
): ComplianceDocumentFile {
  return {
    id: record.id,
    recordName: record.name?.trim() || record.id,
    fileName: toFileName(record),
    fileUrl: record.fileUrl || null,
    contentBase64: record.fileContentBase64?.trim() || null,
    fileSizeBytes: toFileSizeBytes(record),
    uploadedOn: timestampToLocalDate(record.uploadedOn),
    uploadedBy: record.uploadedBy?.trim() || null,
    taxClassification: record.taxClassification?.trim() || null,
    taxId: record.taxId?.trim() || null,
    signedDate: record.signedDate || null,
    insuranceCompanyName: record.insuranceCompanyName?.trim() || null,
    policyNumber: record.policyNumber?.trim() || null,
    additionalInsured: record.additionalInsured ?? null,
    effectiveDate: record.effectiveDate || null,
    expirationDate: toExpirationDate(type, record),
  };
}

/** A certificate's own expiration date; a W9 or MSA expires SIGNED_DOCUMENT_VALID_YEARS after it was signed. */
function toExpirationDate(type: ComplianceDocumentType, record: SubcontractorDocumentApiRecord): string | null {
  if (!isInsuranceCertificate(type) && record.signedDate) {
    return addYears(record.signedDate, SIGNED_DOCUMENT_VALID_YEARS);
  }
  return record.expirationDate || null;
}

/** Newest first, by when the record was created (ISO timestamps sort as strings). */
function byNewest(a: SubcontractorDocumentApiRecord, b: SubcontractorDocumentApiRecord): number {
  return (b.createdDate ?? '').localeCompare(a.createdDate ?? '');
}

function toComplianceDocument(
  type: ComplianceDocumentType,
  group: SubcontractorDocumentGroupApiRecord | undefined,
): ComplianceDocument {
  const current = group?.currentDocument ?? null;
  const previousVersions = (group?.previousVersions ?? []).filter((record) => record.id !== current?.id);
  return {
    type,
    current: current && toComplianceDocumentFile(type, current),
    previousVersions: [...previousVersions].sort(byNewest).map((record) => toComplianceDocumentFile(type, record)),
  };
}

export interface ComplianceDocumentsResult {
  documents: ComplianceDocument[];
  /** The account's subsPaperworkMG now; null when the API leaves it out. */
  paperworkStatus: string | null;
}

/**
 * Fetches the account's W9, General Liability, Workers' Comp and Master
 * Subcontract Agreement, each with its
 * current copy and previous versions, and the account's paperwork status.
 * All four are always returned, in
 * display order: a type the API leaves out comes back with nothing on file.
 * Unrecognised document types are ignored.
 */
export async function fetchComplianceDocuments(accountId: string): Promise<ComplianceDocumentsResult> {
  const data = await salesforceGet<SubcontractorDocumentsApiResponse>(SALESFORCE_SUBCONTRACTOR_DOCUMENTS_URL, {
    accountId,
  });
  if (!data.success) {
    throw new Error(data.message || 'Unable to load documents.');
  }

  const groupsByType = new Map<ComplianceDocumentType, SubcontractorDocumentGroupApiRecord>();
  for (const group of data.documents ?? []) {
    const type = toDocumentType(group.documentType ?? group.currentDocument?.recordTypeName);
    if (type && !groupsByType.has(type)) {
      groupsByType.set(type, group);
    }
  }
  return {
    documents: COMPLIANCE_DOCUMENT_ORDER.map((type) => toComplianceDocument(type, groupsByType.get(type))),
    paperworkStatus: data.subsPaperworkMG ?? null,
  };
}

export interface ComplianceDocumentUpload {
  accountId: string;
  type: ComplianceDocumentType;
  /** The picked PDF, base64-encoded. */
  fileBase64: string;
  /** A signed date for a W9 or MSA; effective and expiration dates for General Liability or Workers' Comp. */
  dates: SubcontractorDocumentUploadDates;
}

const UPLOAD_ERROR_MESSAGE = 'Unable to upload the document. Please try again.';

/**
 * Uploads a new copy of a W9, General Liability, Workers' Comp or Master
 * Subcontract Agreement (POST /subcontractordocumentupload), which becomes its
 * current copy. Returns the API's success message; throws an Error with a
 * message fit to show the user.
 */
export async function uploadComplianceDocument(upload: ComplianceDocumentUpload): Promise<string> {
  const payload: SubcontractorDocumentUploadApiPayload = {
    accountId: upload.accountId,
    recordTypeName: COMPLIANCE_DOCUMENT_INFO[upload.type].recordTypeName,
    ...upload.dates,
    fileBase64: upload.fileBase64,
  };
  const data = await salesforceSend<SubcontractorDocumentUploadApiResponse>(
    { method: 'post', url: SALESFORCE_SUBCONTRACTOR_DOCUMENT_UPLOAD_URL, data: payload },
    UPLOAD_ERROR_MESSAGE,
  );
  if (!data.success) {
    throw new Error(data.message || UPLOAD_ERROR_MESSAGE);
  }
  return data.message || 'Document uploaded successfully.';
}
