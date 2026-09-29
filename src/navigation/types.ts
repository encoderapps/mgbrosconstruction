import { NavigatorScreenParams } from '@react-navigation/native';
import type { CertificateTemplate } from '../services/certificateTemplateService';

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

export type SubcontractorRegistrationParams = {
  identity: SubcontractorIdentityData;
  company: SubcontractorCompanyData;
  w9: SubcontractorW9Data;
  generalLiability: SubcontractorGeneralLiabilityData;
  workersComp: SubcontractorWorkersCompData;
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
  AcceptPolicyTerms: SubcontractorRegistrationParams;
  CreatePassword: SubcontractorRegistrationParams;
  RegistrationComplete: undefined;
  ForgotPassword: undefined;
  CheckYourEmail: { email: string };
  VerifyResetCode: { email: string };
  ChangePassword: { email: string; resetCode: string };
  PasswordResetSuccess: undefined;
  TemplatePreview: { title: string; template: CertificateTemplate; currentStep: number };
  Home: undefined;
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
