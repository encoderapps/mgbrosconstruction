export interface SalesforceTokenResponse {
  access_token: string;
  signature: string;
  scope: string;
  instance_url: string;
  id: string;
  token_type: string;
  issued_at: string;
}

export interface CheckExistingEmailResponse {
  success: boolean;
  message: string;
  accountId: string | null;
}

export interface SubcontractorLoginResponse {
  success: boolean;
  message: string;
  IsLoginSuccessful: boolean;
  IsApproved: boolean;
  accountId: string | null;
}

export interface SubcontractorRegistrationApiPayload {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  homeAddress: string;
  password: string;
  confirmPassword: string;

  companyName: string;
  companyAddress: string;
  yearsOfExperience: string;
  service: string;
  numberOfEmployees: string;

  federalTaxClassification: string;
  taxIdentificationNumber: string;
  w9SignedDate: string;
  w9FileName: string;
  w9Base64Data: string;

  glInsuranceCompanyName: string;
  glPolicyNumber: string;
  glEffectiveDate: string;
  glExpirationDate: string;
  glAdditionalInsured: boolean;
  glFileName: string;
  glBase64Data: string;

  wcInsuranceCompanyName: string;
  wcPolicyNumber: string;
  wcEffectiveDate: string;
  wcExpirationDate: string;
  wcFileName: string;
  wcBase64Data: string;
}
