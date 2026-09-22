export interface RegistrationData {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  homeAddress: string;

  companyName: string;
  companyAddress: string;
  service: string;
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
  glAdditionalInsured: string;
  glFileName: string;

  wcInsuranceCompanyName: string;
  wcPolicyNumber: string;
  wcEffectiveDate: string;
  wcExpirationDate: string;
  wcFileName: string;
}
