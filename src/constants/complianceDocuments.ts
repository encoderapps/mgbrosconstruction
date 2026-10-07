import { ComplianceDocumentType } from '../types/document';

interface ComplianceDocumentInfo {
  /** Name in the Documents list and page titles, e.g. "Workers' Comp". */
  label: string;
  /** Heading on the document's own screen, e.g. "W9 Form". */
  title: string;
}

export const COMPLIANCE_DOCUMENT_INFO: Record<ComplianceDocumentType, ComplianceDocumentInfo> = {
  w9: { label: 'W9', title: 'W9 Form' },
  generalLiability: { label: 'General Liability', title: 'General Liability' },
  workersComp: { label: "Workers' Comp", title: "Workers' Comp" },
};

/** The order the documents are listed in. */
export const COMPLIANCE_DOCUMENT_ORDER: readonly ComplianceDocumentType[] = ['w9', 'generalLiability', 'workersComp'];

/** An insurance certificate this many days (or fewer) from expiring gets a warning. */
export const EXPIRY_WARNING_DAYS = 60;
