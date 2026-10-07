import { fetchComplianceDocuments } from '../src/services/complianceDocumentService';
import { salesforceGet } from '../src/services/salesforceClient';
import { SubcontractorDocumentApiRecord } from '../src/types';
import { toDateOnlyString } from '../src/utils/dateValidation';

jest.mock('../src/services/salesforceClient', () => ({
  salesforceGet: jest.fn(),
}));

const mockedGet = salesforceGet as jest.MockedFunction<typeof salesforceGet>;

afterEach(() => {
  mockedGet.mockReset();
});

function record(overrides: Partial<SubcontractorDocumentApiRecord>): SubcontractorDocumentApiRecord {
  return {
    id: 'a61',
    name: 'Ext-File-0000000350',
    fileName: 'File',
    fileExtension: 'pdf',
    fileUrl: '/sfc/servlet.shepherd/version/download/068',
    fileSizeBytes: 580,
    fileSizeKB: 0.57,
    uploadedOn: '2026-09-29T11:29:47.000Z',
    uploadedBy: 'Vikas Gupta',
    taxClassification: null,
    taxId: null,
    signedDate: null,
    effectiveDate: null,
    expirationDate: null,
    current: true,
    createdDate: '2026-09-29T11:29:46.000Z',
    recordTypeName: null,
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
  fileSizeBytes: null,
  fileSizeKB: null,
  uploadedOn: null,
  uploadedBy: null,
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
    });

    const documents = await fetchComplianceDocuments('001QL00002WQD8ZYAX');

    expect(mockedGet).toHaveBeenCalledWith(expect.stringMatching(/\/subcontractordocuments$/), {
      accountId: '001QL00002WQD8ZYAX',
    });
    expect(documents.map((document) => document.type)).toEqual(['w9', 'generalLiability', 'workersComp']);

    expect(documents[0]).toEqual({
      type: 'w9',
      current: {
        id: 'a61QL000007VG65YAG',
        recordName: 'Ext-File-0000000350',
        fileName: 'W9 - ABC Construction Services.pdf',
        fileUrl: '/sfc/servlet.shepherd/version/download/068',
        fileSizeBytes: 580,
        // The timestamp's calendar date on this machine (it differs by time zone).
        uploadedOn: toDateOnlyString(new Date('2026-09-29T11:29:47.000Z')),
        uploadedBy: 'Vikas Gupta',
        taxClassification: 'LLC',
        taxId: '15-5468978',
        signedDate: '2026-09-18',
        effectiveDate: null,
        expirationDate: null,
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

    const [, generalLiability] = await fetchComplianceDocuments('001ACCOUNT');

    expect(generalLiability.current).toMatchObject({
      recordName: 'Ext-File-0000000371',
      fileName: 'asd',
      fileUrl: null,
      fileSizeBytes: null,
      uploadedOn: null,
      uploadedBy: null,
      expirationDate: '2026-10-06',
    });
    expect(generalLiability.previousVersions).toHaveLength(1);
    expect(generalLiability.previousVersions[0]).toMatchObject({
      fileName: 'GL - January 1, 2026 - January 1, 2027 - ABC Construction Services.pdf',
      fileSizeBytes: 601,
      expirationDate: '2027-01-01',
    });
  });

  it('returns every type, with nothing on file for those the API leaves out', async () => {
    mockedGet.mockResolvedValue({ success: true, documents: [] });

    const documents = await fetchComplianceDocuments('001ACCOUNT');

    expect(documents).toEqual([
      { type: 'w9', current: null, previousVersions: [] },
      { type: 'generalLiability', current: null, previousVersions: [] },
      { type: 'workersComp', current: null, previousVersions: [] },
    ]);
  });

  it('sorts previous versions newest first and drops a repeat of the current record', async () => {
    const older = record({ id: 'old', createdDate: '2025-01-01T00:00:00.000Z' });
    const newer = record({ id: 'new', createdDate: '2026-01-01T00:00:00.000Z' });
    mockedGet.mockResolvedValue({
      success: true,
      documents: [{ documentType: 'COI - Workers Comp', currentDocument: W9_RECORD, previousVersions: [older, W9_RECORD, newer] }],
    });

    const [, , workersComp] = await fetchComplianceDocuments('001ACCOUNT');

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

    const [w9, generalLiability] = await fetchComplianceDocuments('001ACCOUNT');

    expect(w9.current).toMatchObject({ fileName: 'Ext-File-0000000350', fileSizeBytes: 2048 });
    expect(generalLiability.current).toBeNull();
  });

  it('throws the API message when the request fails', async () => {
    mockedGet.mockResolvedValue({ success: false, message: 'Account not found.', documents: null });

    await expect(fetchComplianceDocuments('001ACCOUNT')).rejects.toThrow('Account not found.');
  });
});
