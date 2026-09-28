import { SubcontractorRegistrationParams } from '../navigation/types';
import { RegistrationData } from '../types/registration';

export function buildRegistrationData(params: SubcontractorRegistrationParams): RegistrationData {
  return {
    firstName: params.identity.firstName,
    lastName: params.identity.lastName,
    phone: params.identity.phone,
    email: params.identity.email,
    homeAddress: params.identity.homeAddress,

    companyName: params.company.company,
    companyAddress1: params.company.companyAddress.address1,
    companyAddress2: params.company.companyAddress.address2,
    companyCity: params.company.companyAddress.city,
    companyState: params.company.companyAddress.state,
    companyCountry: params.company.companyAddress.country,
    companyPincode: params.company.companyAddress.pincode,
    service: params.company.service,
    yearsOfExperience: params.company.yearsOfExperience,
    numberOfEmployees: params.company.numberOfEmployees,

    federalTaxClassification: params.w9.federalTaxClassification,
    taxIdentificationNumber: params.w9.taxIdentificationNumber,
    w9SignedDate: params.w9.w9SignedDate,
    w9FileName: params.w9.w9File.name,

    glInsuranceCompanyName: params.generalLiability.insuranceCompanyName,
    glPolicyNumber: params.generalLiability.policyNumber,
    glEffectiveDate: params.generalLiability.effectiveDate,
    glExpirationDate: params.generalLiability.expirationDate,
    glAdditionalInsured: params.generalLiability.additionalInsured,
    glFileName: params.generalLiability.coiFile.name,

    wcInsuranceCompanyName: params.workersComp.insuranceCompanyName,
    wcPolicyNumber: params.workersComp.policyNumber,
    wcEffectiveDate: params.workersComp.effectiveDate,
    wcExpirationDate: params.workersComp.expirationDate,
    wcFileName: params.workersComp.coiFile.name,
  };
}

const OPTIONAL_REGISTRATION_FIELDS: (keyof RegistrationData)[] = ['companyAddress2'];

export function findMissingRegistrationFields(data: RegistrationData): (keyof RegistrationData)[] {
  return (Object.keys(data) as (keyof RegistrationData)[]).filter((key) => {
    if (OPTIONAL_REGISTRATION_FIELDS.includes(key)) {
      return false;
    }
    const value = data[key];
    if (typeof value === 'boolean') {
      // A boolean (e.g. an unchecked checkbox) is always a valid answer.
      return false;
    }
    if (Array.isArray(value)) {
      return value.length === 0;
    }
    return !value.trim();
  });
}
