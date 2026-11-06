import { ComplianceDocumentType } from '../types/document';

interface ComplianceDocumentInfo {
  /** Name in the Documents list and page titles, e.g. "Workers' Comp". */
  label: string;
  /** Heading on the document's own screen, e.g. "W9 Form". */
  title: string;
  /** Its Salesforce record type, sent as recordTypeName when uploading a new copy. */
  recordTypeName: string;
}

export const COMPLIANCE_DOCUMENT_INFO: Record<ComplianceDocumentType, ComplianceDocumentInfo> = {
  w9: { label: 'W9', title: 'W9 Form', recordTypeName: 'W9' },
  generalLiability: {
    label: 'General Liability',
    title: 'General Liability',
    recordTypeName: 'COI - General Liability',
  },
  workersComp: { label: "Workers' Comp", title: "Workers' Comp", recordTypeName: 'COI - Workers Comp' },
  masterSubcontractAgreement: {
    label: 'Master Subcontract Agreement',
    title: 'Master Subcontract Agreement',
    recordTypeName: 'Master Subcontract Agreement',
  },
};

/** The order the documents are listed in. */
export const COMPLIANCE_DOCUMENT_ORDER: readonly ComplianceDocumentType[] = [
  'w9',
  'generalLiability',
  'workersComp',
  'masterSubcontractAgreement',
];

/** The login's subsPaperworkMG when the account's paperwork is all in order; any other value means it isn't. */
export const PAPERWORK_COMPLETE_STATUS = 'Complete';

/** A W9 or Master Subcontract Agreement is valid for this many years from the date it was signed. */
export const SIGNED_DOCUMENT_VALID_YEARS = 1;

/** An insurance certificate this many days (or fewer) from expiring gets a warning. */
export const EXPIRY_WARNING_DAYS = 60;
