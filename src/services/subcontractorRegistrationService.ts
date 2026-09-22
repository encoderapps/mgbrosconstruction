import axios from 'axios';
import { SALESFORCE_SUBCONTRACTOR_REGISTRATION_URL } from '../constants/config';
import { SubcontractorRegistrationParams } from '../navigation/types';
import { SubcontractorRegistrationApiPayload } from '../types';
import { fetchSalesforceAccessToken, getStoredSalesforceAccessToken } from './salesforceAuthService';

function buildApiPayload(
  params: SubcontractorRegistrationParams,
  password: string,
  confirmPassword: string,
): SubcontractorRegistrationApiPayload {
  return {
    firstName: params.identity.firstName,
    lastName: params.identity.lastName,
    phone: params.identity.phone,
    email: params.identity.email,
    homeAddress: params.identity.homeAddress,
    password,
    confirmPassword,

    companyName: params.company.company,
    companyAddress: params.company.companyAddress,
    yearsOfExperience: params.company.yearsOfExperience,
    service: params.company.service,
    numberOfEmployees: params.company.numberOfEmployees,

    federalTaxClassification: params.w9.federalTaxClassification,
    taxIdentificationNumber: params.w9.taxIdentificationNumber,
    w9SignedDate: params.w9.w9SignedDate,
    w9FileName: params.w9.w9File.name,
    w9Base64Data: params.w9.w9File.base64,

    glInsuranceCompanyName: params.generalLiability.insuranceCompanyName,
    glPolicyNumber: params.generalLiability.policyNumber,
    glEffectiveDate: params.generalLiability.effectiveDate,
    glExpirationDate: params.generalLiability.expirationDate,
    glAdditionalInsured: params.generalLiability.additionalInsured === 'Yes',
    glFileName: params.generalLiability.coiFile.name,
    glBase64Data: params.generalLiability.coiFile.base64,

    wcInsuranceCompanyName: params.workersComp.insuranceCompanyName,
    wcPolicyNumber: params.workersComp.policyNumber,
    wcEffectiveDate: params.workersComp.effectiveDate,
    wcExpirationDate: params.workersComp.expirationDate,
    wcFileName: params.workersComp.coiFile.name,
    wcBase64Data: params.workersComp.coiFile.base64,
  };
}

export async function submitSubcontractorRegistration(
  params: SubcontractorRegistrationParams,
  password: string,
  confirmPassword: string,
): Promise<void> {
  const payload = buildApiPayload(params, password, confirmPassword);

  const postWithToken = (accessToken: string) =>
    axios.post(SALESFORCE_SUBCONTRACTOR_REGISTRATION_URL, payload, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

  const storedToken = await getStoredSalesforceAccessToken();
  try {
    const accessToken = storedToken ?? (await fetchSalesforceAccessToken());
    await postWithToken(accessToken);
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      const refreshedToken = await fetchSalesforceAccessToken();
      await postWithToken(refreshedToken);
      return;
    }
    if (axios.isAxiosError(error)) {
      console.error('Subcontractor registration failed. Status:', error.response?.status);
      console.error('Subcontractor registration failed. Response body:', error.response?.data);
    }
    throw error;
  }
}
