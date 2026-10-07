import { SALESFORCE_SUBCONTRACTOR_DOCUMENTS_URL } from '../constants/config';
import { COMPLIANCE_DOCUMENT_ORDER } from '../constants/complianceDocuments';
import { EMPTY_VALUE } from '../constants/display';
import {
  SubcontractorDocumentApiRecord,
  SubcontractorDocumentGroupApiRecord,
  SubcontractorDocumentsApiResponse,
} from '../types';
import { ComplianceDocument, ComplianceDocumentFile, ComplianceDocumentType } from '../types/document';
import { timestampToLocalDate } from '../utils/dateValidation';
import { salesforceGet } from './salesforceClient';

/** The API's documentType (also each record's recordTypeName), lower-cased, → the app's document type. */
const DOCUMENT_TYPES_BY_API_NAME: Record<string, ComplianceDocumentType> = {
  w9: 'w9',
  'coi - general liability': 'generalLiability',
  'coi - workers comp': 'workersComp',
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

function toComplianceDocumentFile(record: SubcontractorDocumentApiRecord): ComplianceDocumentFile {
  return {
    id: record.id,
    recordName: record.name?.trim() || record.id,
    fileName: toFileName(record),
    fileUrl: record.fileUrl || null,
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
    expirationDate: record.expirationDate || null,
  };
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
    current: current && toComplianceDocumentFile(current),
    previousVersions: [...previousVersions].sort(byNewest).map(toComplianceDocumentFile),
  };
}

/**
 * Fetches the account's W9, General Liability and Workers' Comp, each with its
 * current copy and previous versions. All three are always returned, in
 * display order: a type the API leaves out comes back with nothing on file.
 * Unrecognised document types are ignored.
 */
export async function fetchComplianceDocuments(accountId: string): Promise<ComplianceDocument[]> {
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
  return COMPLIANCE_DOCUMENT_ORDER.map((type) => toComplianceDocument(type, groupsByType.get(type)));
}
