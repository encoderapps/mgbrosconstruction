import { NavigatorScreenParams } from '@react-navigation/native';
import type { CertificateTemplate } from '../services/certificateTemplateService';
import type { SignatureFontId } from '../constants/signatureFonts';
import type { PurchaseOrderPaymentTerm } from '../types/purchaseOrder';
import type { ComplianceDocumentType } from '../types/document';

export interface SubcontractorIdentityData {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  homeAddress: string;
}

export interface SubcontractorCompanyData {
  company: string;
  companyStreetAddress: string;
  companyCity: string;
  /** Two-letter US state code, e.g. "IL". */
  companyState: string;
  companyZipCode: string;
  service: string[];
  yearsOfExperience: string;
  numberOfEmployees: string;
}

export interface RegistrationFile {
  uri: string;
  name: string;
  type?: string;
  base64: string;
}

export interface SubcontractorW9Data {
  federalTaxClassification: string;
  taxIdentificationNumber: string;
  w9SignedDate: string;
  w9File: RegistrationFile;
}

export interface SubcontractorGeneralLiabilityData {
  insuranceCompanyName: string;
  policyNumber: string;
  effectiveDate: string;
  expirationDate: string;
  additionalInsured: boolean;
  coiFile: RegistrationFile;
}

export interface SubcontractorWorkersCompData {
  insuranceCompanyName: string;
  policyNumber: string;
  effectiveDate: string;
  expirationDate: string;
  coiFile: RegistrationFile;
}

/** Step 6 digital signature, created from the signer's typed full name. */
export interface SubcontractorSignatureData {
  signatureName: string;
  signatureFont: SignatureFontId;
  /** Derived from signatureName, e.g. "Deepak Rathore" → "DR". */
  signatureInitials: string;
  /** Date the agreement was signed, as YYYY-MM-DD (the device's local date). */
  signatureDate: string;
}

export type SubcontractorRegistrationParams = {
  identity: SubcontractorIdentityData;
  company: SubcontractorCompanyData;
  w9: SubcontractorW9Data;
  generalLiability: SubcontractorGeneralLiabilityData;
  workersComp: SubcontractorWorkersCompData;
};

/** Registration params once the Master Subcontractor Agreement has been signed (Step 6 onward). */
export type SignedSubcontractorRegistrationParams = SubcontractorRegistrationParams & {
  signature: SubcontractorSignatureData;
};

export type AuthStackParamList = {
  Welcome: undefined;
  SubcontractorLogin: undefined;
  Login: undefined;
  Register: undefined;
  RegisterSubcontractor: undefined;
  WhyVerifyIdentity: undefined;
  EmailAlreadyInUse: undefined;
  IdentityVerificationComplete: { identity: SubcontractorIdentityData };
  CompanyDetails: { identity: SubcontractorIdentityData };
  W9: { identity: SubcontractorIdentityData; company: SubcontractorCompanyData };
  GeneralLiability: {
    identity: SubcontractorIdentityData;
    company: SubcontractorCompanyData;
    w9: SubcontractorW9Data;
  };
  WorkersComp: {
    identity: SubcontractorIdentityData;
    company: SubcontractorCompanyData;
    w9: SubcontractorW9Data;
    generalLiability: SubcontractorGeneralLiabilityData;
  };
  MasterSubcontractorAgreement: SubcontractorRegistrationParams;
  AcceptPolicyTerms: SignedSubcontractorRegistrationParams;
  CreatePassword: SignedSubcontractorRegistrationParams;
  RegistrationComplete: undefined;
  ForgotPassword: undefined;
  CheckYourEmail: { email: string };
  VerifyResetCode: { email: string };
  ChangePassword: { email: string; resetCode: string };
  PasswordResetSuccess: undefined;
  TemplatePreview: { title: string; template: CertificateTemplate; currentStep: number };
  Home: undefined;
  AddContact: undefined;
  EditContact: { contactId: string };
  ContactDetails: { contactId: string };
  PurchaseOrders: undefined;
  Notifications: undefined;
  Profile: undefined;
  PurchaseOrderDetails: {
    poId: string;
    /** From the Purchase Orders list, which has the PO's date (the detail API doesn't). */
    poDate?: string;
    /** Set by Modify Payment Terms after a successful save, so the review shows them without reloading. */
    updatedPaymentTerms?: PurchaseOrderPaymentTerm[];
    /** Set by the signing screen once the API confirms the signing, e.g. "Signed". */
    updatedStatus?: string;
    /** With updatedStatus: the signing date, YYYY-MM-DD. */
    signedDate?: string;
  };
  PurchaseOrderSigning: { poId: string; poDate?: string };
  /** The PO's current terms and total, so the screen can edit them without fetching the PO again. */
  ModifyPaymentTerms: { poId: string; totalAmount: number; paymentTerms: PurchaseOrderPaymentTerm[] };
  Invoices: undefined;
  Documents: undefined;
  DocumentDetails: { documentType: ComplianceDocumentType };
  ApprovalNeeded: undefined;
};

export type ProjectsStackParamList = {
  ProjectsList: undefined;
  ProjectDetails: { projectId: string };
};

export type MainTabParamList = {
  Dashboard: undefined;
  Projects: NavigatorScreenParams<ProjectsStackParamList>;
  Tasks: undefined;
  Profile: undefined;
  Settings: undefined;
};

export type RootStackParamList = {
  Auth: NavigatorScreenParams<AuthStackParamList>;
  Main: NavigatorScreenParams<MainTabParamList>;
};
