export interface RegistrationData {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  homeAddress: string;

  companyName: string;
  companyStreetAddress: string;
  companyCity: string;
  companyState: string;
  companyZipCode: string;
  service: string[];
  yearsOfExperience: string;
  numberOfEmployees: string;

  federalTaxClassification: string;
  taxIdentificationNumber: string;
  w9SignedDate: string;
  w9FileName: string;

  glInsuranceCompanyName: string;
  glPolicyNumber: string;
  glEffectiveDate: string;
  glExpirationDate: string;
  glAdditionalInsured: boolean;
  glFileName: string;

  wcInsuranceCompanyName: string;
  wcPolicyNumber: string;
  wcEffectiveDate: string;
  wcExpirationDate: string;
  wcFileName: string;

  signatureName: string;
  signatureFont: string;
  signatureInitials: string;
  signatureDate: string;
}
