import { ComplianceDocumentFile } from '../src/types/document';
import { getDocumentStatus, getDocumentSummary, isInsuranceCertificate } from '../src/utils/complianceDocument';
import { daysUntil, formatShortDate } from '../src/utils/formatDate';
import { formatFileSize } from '../src/utils/formatFileSize';
import { maskTaxId } from '../src/utils/taxId';

const TODAY = new Date(2026, 9, 7, 15, 30); // Oct 7, 2026, mid-afternoon local time

function file(overrides: Partial<ComplianceDocumentFile> = {}): ComplianceDocumentFile {
  return {
    id: 'f1',
    recordName: 'Ext-File-0000000001',
    fileName: 'Doc.pdf',
    fileUrl: '/sfc/servlet.shepherd/version/download/068',
    contentBase64: 'JVBERi0xLjQK',
    fileSizeBytes: 580,
    uploadedOn: '2026-09-29',
    uploadedBy: 'Vikas Gupta',
    taxClassification: null,
    taxId: null,
    signedDate: null,
    insuranceCompanyName: 'ABC Insurance Company',
    policyNumber: 'GL-1234568',
    additionalInsured: true,
    effectiveDate: '2026-01-01',
    expirationDate: '2027-01-01',
    ...overrides,
  };
}

describe('formatShortDate', () => {
  it('uses a three-letter month and a two-digit day', () => {
    expect(formatShortDate('2026-05-19')).toBe('May 19, 2026');
    expect(formatShortDate('2025-01-05')).toBe('Jan 05, 2025');
    expect(formatShortDate('2024-12-31')).toBe('Dec 31, 2024');
  });
});

describe('daysUntil', () => {
  it('counts whole calendar days, ignoring the time of day', () => {
    expect(daysUntil('2026-10-07', TODAY)).toBe(0);
    expect(daysUntil('2026-10-08', TODAY)).toBe(1);
    expect(daysUntil('2026-11-21', TODAY)).toBe(45);
  });

  it('is negative for past dates', () => {
    expect(daysUntil('2026-10-06', TODAY)).toBe(-1);
  });

  it('spans a year boundary', () => {
    expect(daysUntil('2027-01-01', TODAY)).toBe(86);
  });
});

describe('formatFileSize', () => {
  it('shows bytes under 1 KB', () => {
    expect(formatFileSize(580)).toBe('580 B');
    expect(formatFileSize(0)).toBe('0 B');
  });

  it('uses one decimal below 10 and whole numbers above', () => {
    expect(formatFileSize(1536)).toBe('1.5 KB');
    expect(formatFileSize(268_800)).toBe('263 KB');
    expect(formatFileSize(1_572_864)).toBe('1.5 MB');
  });
});

describe('getDocumentStatus', () => {
  it('reports a missing document', () => {
    expect(getDocumentStatus('w9', null, TODAY)).toEqual({ tone: 'danger', message: 'No W9 on file.' });
    expect(getDocumentStatus('workersComp', null, TODAY)).toEqual({
      tone: 'danger',
      message: "No Workers' Comp on file.",
    });
  });

  it('reports a W9 as on file', () => {
    expect(getDocumentStatus('w9', file({ expirationDate: null }), TODAY)).toEqual({
      tone: 'success',
      message: 'This is the current W9 on file.',
    });
  });

  it('reports a certificate far from expiry as active', () => {
    expect(getDocumentStatus('generalLiability', file({ expirationDate: '2027-05-18' }), TODAY)).toEqual({
      tone: 'success',
      message: 'This certificate is active.',
    });
  });

  it('warns when a certificate expires within 60 days', () => {
    expect(getDocumentStatus('generalLiability', file({ expirationDate: '2026-11-21' }), TODAY)).toEqual({
      tone: 'warning',
      message: 'Expires in 45 days (Nov 21, 2026)',
    });
    expect(getDocumentStatus('generalLiability', file({ expirationDate: '2026-12-06' }), TODAY).tone).toBe('warning');
    expect(getDocumentStatus('generalLiability', file({ expirationDate: '2026-12-07' }), TODAY).tone).toBe('success');
  });

  it('uses the singular for one day and says "today" on the day itself', () => {
    expect(getDocumentStatus('workersComp', file({ expirationDate: '2026-10-08' }), TODAY).message).toBe(
      'Expires in 1 day (Oct 08, 2026)',
    );
    expect(getDocumentStatus('workersComp', file({ expirationDate: '2026-10-07' }), TODAY).message).toBe(
      'Expires today (Oct 07, 2026)',
    );
  });

  it('flags an expired certificate', () => {
    expect(getDocumentStatus('workersComp', file({ expirationDate: '2026-10-02' }), TODAY)).toEqual({
      tone: 'danger',
      message: 'Expired on Oct 02, 2026',
    });
  });

  it('warns about a certificate with no expiration date', () => {
    expect(getDocumentStatus('generalLiability', file({ expirationDate: null }), TODAY)).toEqual({
      tone: 'warning',
      message: 'This certificate has no expiration date.',
    });
  });
});

describe('getDocumentSummary', () => {
  it('shows a W9 tax details, with the Tax ID masked', () => {
    const w9 = file({ taxClassification: 'LLC', taxId: '15-5468978', signedDate: '2026-09-18' });
    expect(getDocumentSummary('w9', w9)).toEqual([
      { label: 'Federal Tax Classification', value: 'LLC' },
      { label: 'Tax Identification Number', value: 'XX-XXXXX78' },
      { label: 'W9 Signed Date', value: '09/18/2026' },
    ]);
  });

  it('shows a dash for W9 details the API leaves out', () => {
    expect(getDocumentSummary('w9', file()).map((row) => row.value)).toEqual(['—', '—', '—']);
  });

  it('shows a General Liability certificate details, including Additional Insured', () => {
    expect(getDocumentSummary('generalLiability', file())).toEqual([
      { label: 'Insurance Company Name', value: 'ABC Insurance Company' },
      { label: 'Policy Number', value: 'GL-1234568' },
      { label: 'Additional Insured', value: 'Yes' },
      { label: 'Effective Date', value: '01/01/2026' },
      { label: 'Expiration Date', value: '01/01/2027' },
    ]);
    expect(getDocumentSummary('generalLiability', file({ additionalInsured: false }))).toContainEqual({
      label: 'Additional Insured',
      value: 'No',
    });
  });

  it('leaves Additional Insured off a Workers’ Comp certificate', () => {
    expect(getDocumentSummary('workersComp', file()).map((row) => row.label)).toEqual([
      'Insurance Company Name',
      'Policy Number',
      'Effective Date',
      'Expiration Date',
    ]);
  });

  it('shows a dash for certificate details the API leaves out', () => {
    const blank = file({
      insuranceCompanyName: null,
      policyNumber: null,
      additionalInsured: null,
      effectiveDate: null,
      expirationDate: null,
    });
    expect(getDocumentSummary('generalLiability', blank).map((row) => row.value)).toEqual(['—', '—', '—', '—', '—']);
  });

  it('is empty when nothing is on file', () => {
    expect(getDocumentSummary('workersComp', null)).toEqual([]);
  });
});

describe('maskTaxId', () => {
  it('keeps only the last 2 digits and the dashes', () => {
    expect(maskTaxId('15-5468978')).toBe('XX-XXXXX78');
    expect(maskTaxId('155468978')).toBe('XXXXXXX78');
  });

  it('masks everything when there are 2 digits or fewer', () => {
    expect(maskTaxId('12')).toBe('XX');
  });
});

describe('isInsuranceCertificate', () => {
  it('is true for General Liability and Workers’ Comp only', () => {
    expect(isInsuranceCertificate('w9')).toBe(false);
    expect(isInsuranceCertificate('generalLiability')).toBe(true);
    expect(isInsuranceCertificate('workersComp')).toBe(true);
  });
});
