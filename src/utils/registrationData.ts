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
    companyAddress: params.company.companyAddress,
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

export function findMissingRegistrationFields(data: RegistrationData): (keyof RegistrationData)[] {
  return (Object.keys(data) as (keyof RegistrationData)[]).filter((key) => !data[key]?.trim());
}
