import { fetchComplianceDocuments, uploadComplianceDocument } from '../src/services/complianceDocumentService';
import { salesforceGet, salesforceSend } from '../src/services/salesforceClient';
import { SubcontractorDocumentApiRecord, SubcontractorDocumentUploadApiResponse } from '../src/types';
import { toDateOnlyString } from '../src/utils/dateValidation';

jest.mock('../src/services/salesforceClient', () => ({
  salesforceGet: jest.fn(),
  salesforceSend: jest.fn(),
}));

const mockedGet = salesforceGet as jest.MockedFunction<typeof salesforceGet>;
// Typed to the upload's response, so mocked results can include its fields.
const mockedSend = salesforceSend as unknown as jest.MockedFunction<
  (...args: Parameters<typeof salesforceSend>) => Promise<SubcontractorDocumentUploadApiResponse>
>;

afterEach(() => {
  mockedGet.mockReset();
  mockedSend.mockReset();
});

function record(overrides: Partial<SubcontractorDocumentApiRecord>): SubcontractorDocumentApiRecord {
  return {
    id: 'a61',
    name: 'Ext-File-0000000350',
    recordTypeName: null,
    recordTypeId: null,
    current: true,
    createdDate: '2026-09-29T11:29:46.000Z',
    description: null,
    fileName: 'File',
    fileExtension: 'pdf',
    fileType: 'Internal',
    fileUrl: '/sfc/servlet.shepherd/version/download/068',
    fileLink: null,
    contentVersionId: '068',
    fileContentBase64: 'JVBERi0xLjQK',
    fileSizeBytes: 580,
    fileSizeKB: 0.57,
    uploadedOn: '2026-09-29T11:29:47.000Z',
    uploadedBy: 'Vikas Gupta',
    taxClassification: null,
    taxId: null,
    signedDate: null,
    insuranceCompanyName: null,
    policyNumber: null,
    additionalInsured: false,
    effectiveDate: null,
    expirationDate: null,
    ...overrides,
  };
}

// Trimmed from the sandbox response for account 001QL00002WQD8ZYAX.
const W9_RECORD = record({
  id: 'a61QL000007VG65YAG',
  fileName: 'W9 - ABC Construction Services',
  taxClassification: 'LLC',
  taxId: '15-5468978',
  signedDate: '2026-09-18',
  recordTypeName: 'W9',
});
const GL_CURRENT = record({
  id: 'a61QL000007anFtYAI',
  name: 'Ext-File-0000000371',
  fileName: 'asd',
  fileExtension: null,
  fileUrl: null,
  fileContentBase64: null,
  fileSizeBytes: null,
  fileSizeKB: null,
  uploadedOn: null,
  uploadedBy: null,
  insuranceCompanyName: 'demo icn',
  policyNumber: '1234567',
  effectiveDate: '2026-10-04',
  expirationDate: '2026-10-06',
  createdDate: '2026-10-04T13:02:36.000Z',
  recordTypeName: 'COI - General Liability',
});
const GL_PREVIOUS = record({
  id: 'a61QL000007VG66YAG',
  name: 'Ext-File-0000000351',
  fileName: 'GL - January 1, 2026 - January 1, 2027 - ABC Construction Services',
  fileSizeBytes: 601,
  insuranceCompanyName: 'ABC Insurance Company',
  policyNumber: 'GL-1234568',
  additionalInsured: true,
  effectiveDate: '2026-01-01',
  expirationDate: '2027-01-01',
  current: false,
  recordTypeName: 'COI - General Liability',
});

describe('fetchComplianceDocuments', () => {
  it('requests the account and maps each document type, in display order', async () => {
    mockedGet.mockResolvedValue({
      success: true,
      documents: [
        { documentType: 'COI - General Liability', currentDocument: GL_CURRENT, previousVersions: [GL_PREVIOUS] },
        { documentType: 'W9', currentDocument: W9_RECORD, previousVersions: [] },
      ],
      subsPaperworkMG: 'Complete',
    });

    const { documents, paperworkStatus } = await fetchComplianceDocuments('001QL00002WQD8ZYAX');

    expect(mockedGet).toHaveBeenCalledWith(expect.stringMatching(/\/subcontractordocuments$/), {
      accountId: '001QL00002WQD8ZYAX',
    });
    // The account's paperwork status now, for the header's Documents pill.
    expect(paperworkStatus).toBe('Complete');
    expect(documents.map((document) => document.type)).toEqual([
      'w9',
      'generalLiability',
      'workersComp',
      'masterSubcontractAgreement',
    ]);

    expect(documents[0]).toEqual({
      type: 'w9',
      current: {
        id: 'a61QL000007VG65YAG',
        recordName: 'Ext-File-0000000350',
        fileName: 'W9 - ABC Construction Services.pdf',
        fileUrl: '/sfc/servlet.shepherd/version/download/068',
        contentBase64: 'JVBERi0xLjQK',
        fileSizeBytes: 580,
        // The timestamp's calendar date on this machine (it differs by time zone).
        uploadedOn: toDateOnlyString(new Date('2026-09-29T11:29:47.000Z')),
        uploadedBy: 'Vikas Gupta',
        taxClassification: 'LLC',
        taxId: '15-5468978',
        signedDate: '2026-09-18',
        insuranceCompanyName: null,
        policyNumber: null,
        additionalInsured: false,
        effectiveDate: null,
        // A year after it was signed.
        expirationDate: '2027-09-18',
      },
      previousVersions: [],
    });
  });

  it('keeps a current record that has no file attached yet', async () => {
    mockedGet.mockResolvedValue({
      success: true,
      documents: [
        { documentType: 'COI - General Liability', currentDocument: GL_CURRENT, previousVersions: [GL_PREVIOUS] },
      ],
    });

    const [, generalLiability] = (await fetchComplianceDocuments('001ACCOUNT')).documents;

    expect(generalLiability.current).toMatchObject({
      recordName: 'Ext-File-0000000371',
      fileName: 'asd',
      fileUrl: null,
      contentBase64: null,
      fileSizeBytes: null,
      uploadedOn: null,
      uploadedBy: null,
      insuranceCompanyName: 'demo icn',
      policyNumber: '1234567',
      additionalInsured: false,
      expirationDate: '2026-10-06',
    });
    expect(generalLiability.previousVersions).toHaveLength(1);
    expect(generalLiability.previousVersions[0]).toMatchObject({
      fileName: 'GL - January 1, 2026 - January 1, 2027 - ABC Construction Services.pdf',
      fileSizeBytes: 601,
      insuranceCompanyName: 'ABC Insurance Company',
      policyNumber: 'GL-1234568',
      additionalInsured: true,
      expirationDate: '2027-01-01',
    });
  });

  it('expires a W9 and an MSA one year after they were signed', async () => {
    mockedGet.mockResolvedValue({
      success: true,
      documents: [
        { documentType: 'W9', currentDocument: { ...W9_RECORD, signedDate: '2025-11-04' }, previousVersions: [] },
        {
          documentType: 'Master Subcontract Agreement',
          // The signed date wins over any expiration date the API sends.
          currentDocument: { ...W9_RECORD, signedDate: '2025-11-10', expirationDate: '2030-01-01' },
          previousVersions: [],
        },
      ],
    });

    const [w9, , , msa] = (await fetchComplianceDocuments('001ACCOUNT')).documents;

    expect(w9.current).toMatchObject({ signedDate: '2025-11-04', expirationDate: '2026-11-04' });
    expect(msa.current).toMatchObject({ signedDate: '2025-11-10', expirationDate: '2026-11-10' });
  });

  it('returns every type, with nothing on file for those the API leaves out', async () => {
    mockedGet.mockResolvedValue({ success: true, documents: [] });

    const { documents, paperworkStatus } = await fetchComplianceDocuments('001ACCOUNT');

    expect(paperworkStatus).toBeNull();

    expect(documents).toEqual([
      { type: 'w9', current: null, previousVersions: [] },
      { type: 'generalLiability', current: null, previousVersions: [] },
      { type: 'workersComp', current: null, previousVersions: [] },
      { type: 'masterSubcontractAgreement', current: null, previousVersions: [] },
    ]);
  });

  it('sorts previous versions newest first and drops a repeat of the current record', async () => {
    const older = record({ id: 'old', createdDate: '2025-01-01T00:00:00.000Z' });
    const newer = record({ id: 'new', createdDate: '2026-01-01T00:00:00.000Z' });
    mockedGet.mockResolvedValue({
      success: true,
      documents: [{ documentType: 'COI - Workers Comp', currentDocument: W9_RECORD, previousVersions: [older, W9_RECORD, newer] }],
    });

    const [, , workersComp] = (await fetchComplianceDocuments('001ACCOUNT')).documents;

    expect(workersComp.previousVersions.map((version) => version.id)).toEqual(['new', 'old']);
  });

  it('falls back to the KB size and the record name, and ignores unknown types', async () => {
    mockedGet.mockResolvedValue({
      success: true,
      documents: [
        { documentType: 'Something Else', currentDocument: W9_RECORD, previousVersions: [] },
        {
          documentType: 'w9',
          currentDocument: record({ fileName: null, fileExtension: null, fileSizeBytes: null, fileSizeKB: 2 }),
          previousVersions: null,
        },
      ],
    });

    const [w9, generalLiability] = (await fetchComplianceDocuments('001ACCOUNT')).documents;

    expect(w9.current).toMatchObject({ fileName: 'Ext-File-0000000350', fileSizeBytes: 2048 });
    expect(generalLiability.current).toBeNull();
  });

  it('throws the API message when the request fails', async () => {
    mockedGet.mockResolvedValue({ success: false, message: 'Account not found.', documents: null });

    await expect(fetchComplianceDocuments('001ACCOUNT')).rejects.toThrow('Account not found.');
  });
});

describe('uploadComplianceDocument', () => {
  const UPLOAD = {
    accountId: '001QL00002ffLe9YAE',
    type: 'generalLiability' as const,
    fileBase64: 'JVBERi0xLjQK',
    dates: { effectiveDate: '2026-11-05', expirationDate: '2027-11-05' },
  };

  it('posts a certificate with its effective and expiration dates', async () => {
    mockedSend.mockResolvedValue({ success: true, message: 'Document uploaded successfully.' });

    await expect(uploadComplianceDocument(UPLOAD)).resolves.toBe('Document uploaded successfully.');
    expect(mockedSend).toHaveBeenCalledWith(
      {
        method: 'post',
        url: expect.stringMatching(/\/subcontractordocumentupload$/),
        data: {
          accountId: '001QL00002ffLe9YAE',
          recordTypeName: 'COI - General Liability',
          effectiveDate: '2026-11-05',
          expirationDate: '2027-11-05',
          fileBase64: 'JVBERi0xLjQK',
        },
      },
      expect.any(String),
    );
  });

  it('posts a W9 or MSA with only its signed date', async () => {
    mockedSend.mockResolvedValue({ success: true });

    await uploadComplianceDocument({ ...UPLOAD, type: 'w9', dates: { signedDate: '2026-11-07' } });
    await uploadComplianceDocument({ ...UPLOAD, type: 'masterSubcontractAgreement', dates: { signedDate: '2026-11-05' } });

    expect(mockedSend.mock.calls.map(([config]) => config.data)).toEqual([
      { accountId: '001QL00002ffLe9YAE', recordTypeName: 'W9', signedDate: '2026-11-07', fileBase64: 'JVBERi0xLjQK' },
      {
        accountId: '001QL00002ffLe9YAE',
        recordTypeName: 'Master Subcontract Agreement',
        signedDate: '2026-11-05',
        fileBase64: 'JVBERi0xLjQK',
      },
    ]);
  });

  it('sends Workers’ Comp under its record type', async () => {
    mockedSend.mockResolvedValue({ success: true });
    await uploadComplianceDocument({ ...UPLOAD, type: 'workersComp' });
    expect(mockedSend.mock.calls[0][0].data).toMatchObject({ recordTypeName: 'COI - Workers Comp' });
  });

  it('throws the API message when the upload fails', async () => {
    mockedSend.mockResolvedValue({ success: false, message: 'Invalid file.' });
    await expect(uploadComplianceDocument(UPLOAD)).rejects.toThrow('Invalid file.');
  });
});
