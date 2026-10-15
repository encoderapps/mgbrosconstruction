import axios from 'axios';
import { submitSubcontractorRegistration } from '../src/services/subcontractorRegistrationService';
import { SignedSubcontractorRegistrationParams, SubcontractorSignatureData } from '../src/navigation/types';
import { toUserSignature, userSignatureFromLogin } from '../src/utils/signature';

jest.mock('axios', () => ({
  __esModule: true,
  default: { post: jest.fn().mockResolvedValue({ data: { success: true } }), isAxiosError: () => false },
}));
jest.mock('../src/services/salesforceAuthService', () => ({
  getStoredSalesforceAccessToken: jest.fn(async () => 'token'),
  fetchSalesforceAccessToken: jest.fn(async () => 'token'),
}));

const SIGNATURE: SubcontractorSignatureData = {
  signatureName: 'Maya Bennett',
  signatureFont: 'SignatureFont3',
  signatureInitials: 'MB',
  signatureDate: '2026-10-13',
  signatureImageBase64: 'iVBORw0KGgoSIGNATURE',
  initialsImageBase64: 'iVBORw0KGgoINITIALS',
};

const FILE = { uri: 'file:///w9.pdf', name: 'W9.pdf', base64: 'JVBERi0x' };

const PARAMS: SignedSubcontractorRegistrationParams = {
  identity: {
    firstName: 'Maya',
    lastName: 'Bennett',
    phone: '4805551746',
    email: 'maya@example.com',
    homeAddress: '7428 Juniper Ridge Road, Phoenix, Arizona',
  },
  company: {
    company: 'Bennett Mechanical Solutions',
    companyStreetAddress: '1850 East Harbor Avenue',
    companyCity: 'Phoenix',
    companyState: 'AZ',
    companyZipCode: '85001',
    service: ['HVAC'],
    yearsOfExperience: '9',
    numberOfEmployees: '18',
  },
  w9: { taxClassification: 'LLC', taxId: '86-4217359', w9SignedDate: '2026-10-10', w9File: FILE },
  generalLiability: {
    insuranceCompanyName: 'Travelers',
    policyNumber: 'GL-TEST-610284',
    effectiveDate: '2026-10-01',
    expirationDate: '2027-10-01',
    additionalInsured: true,
    coiFile: FILE,
  },
  workersComp: {
    insuranceCompanyName: 'Liberty Mutual',
    policyNumber: 'WC-TEST-381725',
    effectiveDate: '2026-10-01',
    expirationDate: '2027-10-01',
    coiFile: FILE,
  },
  signature: SIGNATURE,
  agreement: { fileName: 'MSA_Bennett_Mechanical_Solutions.pdf', base64: 'JVBERi0xLjQK', signedDate: '2026-10-14' },
};

describe('registration signature', () => {
  it('sends the signer name and the signature and initials images with the registration', async () => {
    await submitSubcontractorRegistration(PARAMS, 'MayaTest@482', 'MayaTest@482');

    const payload = (axios.post as jest.Mock).mock.calls[0][1];
    expect(payload).toMatchObject({
      subcontractorFullName: 'Maya Bennett',
      signatureBase64Data: 'iVBORw0KGgoSIGNATURE',
      signatureInitialsBase64Data: 'iVBORw0KGgoINITIALS',
    });
  });

  it('sends the signed Master Subcontract Agreement with the registration', async () => {
    await submitSubcontractorRegistration(PARAMS, 'MayaTest@482', 'MayaTest@482');

    const payload = (axios.post as jest.Mock).mock.calls.at(-1)[1];
    expect(payload).toMatchObject({
      msaFileName: 'MSA_Bennett_Mechanical_Solutions.pdf',
      msaSignedDate: '2026-10-14',
      msaFileType: 'Internal',
      msaDescription: 'Signed Master Subcontract Agreement',
      msaBase64Data: 'JVBERi0xLjQK',
    });
  });

  it('keeps the registration signature for signing after login', () => {
    expect(toUserSignature(SIGNATURE)).toEqual({
      name: 'Maya Bennett',
      initials: 'MB',
      imageBase64: 'iVBORw0KGgoSIGNATURE',
      initialsImageBase64: 'iVBORw0KGgoINITIALS',
      fontId: 'SignatureFont3',
    });
  });

  it('takes the signature from the login response when it returns one', () => {
    const base = { success: true, message: '', IsLoginSuccessful: true, IsApproved: true, accountId: '001' };

    expect(
      userSignatureFromLogin({
        ...base,
        subcontractorFullName: ' Maya Bennett ',
        signatureBase64Data: 'iVBORw0KGgoSIGNATURE',
        signatureInitialsBase64Data: 'iVBORw0KGgoINITIALS',
      }),
    ).toEqual({
      name: 'Maya Bennett',
      initials: 'MB',
      imageBase64: 'iVBORw0KGgoSIGNATURE',
      initialsImageBase64: 'iVBORw0KGgoINITIALS',
      fontId: null,
    });
    // Not returned (today) or incomplete: none, so the copy kept on the device is used.
    expect(userSignatureFromLogin(base)).toBeNull();
    expect(userSignatureFromLogin({ ...base, subcontractorFullName: 'Maya Bennett' })).toBeNull();
  });
});
