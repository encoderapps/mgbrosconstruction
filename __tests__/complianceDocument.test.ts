import { InsuranceCertificate, W9Document } from '../src/types/document';
import { getDocumentStatus, getDocumentSummary, isInsuranceCertificate } from '../src/utils/complianceDocument';
import { daysUntil, formatShortDate } from '../src/utils/formatDate';

const TODAY = new Date(2026, 9, 7, 15, 30); // Oct 7, 2026, mid-afternoon local time

const file = { id: 'f1', fileName: 'Doc.pdf', uploadedOn: '2026-01-01', fileSizeKb: 100 };

const w9: W9Document = {
  type: 'w9',
  federalTaxClassification: 'S Corporation',
  taxIdentificationNumber: 'XX-XXXXXXX',
  signedDate: '2025-05-20',
  current: file,
  previousVersions: [],
};

function certificate(overrides: Partial<InsuranceCertificate> = {}): InsuranceCertificate {
  return {
    type: 'generalLiability',
    referenceId: 'GL-1',
    insuranceCompanyName: 'State Farm Insurance',
    policyNumber: 'GL-123',
    effectiveDate: '2026-01-01',
    expirationDate: '2027-01-01',
    current: file,
    previousVersions: [],
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

describe('getDocumentStatus', () => {
  it('reports a W9 as on file', () => {
    expect(getDocumentStatus(w9, TODAY)).toEqual({ tone: 'success', message: 'This is the current W9 on file.' });
  });

  it('reports a certificate far from expiry as active', () => {
    expect(getDocumentStatus(certificate({ expirationDate: '2027-05-18' }), TODAY)).toEqual({
      tone: 'success',
      message: 'This certificate is active.',
    });
  });

  it('warns when a certificate expires within 60 days', () => {
    expect(getDocumentStatus(certificate({ expirationDate: '2026-11-21' }), TODAY)).toEqual({
      tone: 'warning',
      message: 'Expires in 45 days (Nov 21, 2026)',
    });
    expect(getDocumentStatus(certificate({ expirationDate: '2026-12-06' }), TODAY).tone).toBe('warning');
    expect(getDocumentStatus(certificate({ expirationDate: '2026-12-07' }), TODAY).tone).toBe('success');
  });

  it('uses the singular for one day and says "today" on the day itself', () => {
    expect(getDocumentStatus(certificate({ expirationDate: '2026-10-08' }), TODAY).message).toBe(
      'Expires in 1 day (Oct 08, 2026)',
    );
    expect(getDocumentStatus(certificate({ expirationDate: '2026-10-07' }), TODAY).message).toBe(
      'Expires today (Oct 07, 2026)',
    );
  });

  it('flags an expired certificate', () => {
    expect(getDocumentStatus(certificate({ expirationDate: '2026-10-06' }), TODAY)).toEqual({
      tone: 'danger',
      message: 'Expired on Oct 06, 2026',
    });
  });
});

describe('getDocumentSummary', () => {
  it('lists a W9 tax details', () => {
    expect(getDocumentSummary(w9)).toEqual([
      { label: 'Federal Tax Classification', value: 'S Corporation' },
      { label: 'Tax Identification Number', value: 'XX-XXXXXXX' },
      { label: 'W9 Signed Date', value: '05/20/2025' },
    ]);
  });

  it('lists a certificate policy details, with Additional Insured only when known', () => {
    expect(getDocumentSummary(certificate({ additionalInsured: true }))).toContainEqual({
      label: 'Additional Insured',
      value: 'Yes',
    });
    expect(getDocumentSummary(certificate({ type: 'workersComp' })).map((row) => row.label)).toEqual([
      'Insurance Company Name',
      'Policy Number',
      'Effective Date',
      'Expiration Date',
    ]);
  });
});

describe('isInsuranceCertificate', () => {
  it('is true for General Liability and Workers’ Comp only', () => {
    expect(isInsuranceCertificate(w9)).toBe(false);
    expect(isInsuranceCertificate(certificate())).toBe(true);
    expect(isInsuranceCertificate(certificate({ type: 'workersComp' }))).toBe(true);
  });
});
