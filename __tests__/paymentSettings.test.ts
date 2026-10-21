import { PDFDocument } from 'pdf-lib';
import { achFormFileName, generateAchFormPdf } from '../src/services/achFormPdfService';
import { fetchPaymentSettings, saveAchInfo, updateDueDateTerm } from '../src/services/paymentSettingsService';
import {
  digitsOnly,
  isValidAccountNumber,
  isValidRoutingNumber,
  maskBankNumber,
} from '../src/utils/bankAccount';
import { formatDateTime } from '../src/utils/formatDate';

// Real, public ABA routing numbers (they pass the checksum).
const CHASE_ROUTING = '021000021';
const CHASE_IL_ROUTING = '071000013';

const COMPANY = {
  accountId: '001ACCOUNT',
  name: 'High Tech Air Inc',
  address: '185 N Addison Rd, Wood Dale, IL 60191',
  email: 'hightechairinc@gmail.com',
  phone: '2246126823',
};

describe('bank account helpers', () => {
  it('accepts routing numbers that pass the ABA checksum only', () => {
    expect(isValidRoutingNumber(CHASE_ROUTING)).toBe(true);
    expect(isValidRoutingNumber(CHASE_IL_ROUTING)).toBe(true);
    expect(isValidRoutingNumber('123456789')).toBe(false); // the mockup's number: wrong checksum
    expect(isValidRoutingNumber('02100002')).toBe(false); // 8 digits
    expect(isValidRoutingNumber('02100002a')).toBe(false);
  });

  it('accepts account numbers of 4–17 digits', () => {
    expect(isValidAccountNumber('1234')).toBe(true);
    expect(isValidAccountNumber('12345678901234567')).toBe(true);
    expect(isValidAccountNumber('123')).toBe(false);
    expect(isValidAccountNumber('123456789012345678')).toBe(false);
    expect(isValidAccountNumber('98765 4321')).toBe(false);
  });

  it('keeps digits only as they are typed, and masks all but the last 4', () => {
    expect(digitsOnly('9876-5432 1', 17)).toBe('987654321');
    expect(digitsOnly('0210000219999', 9)).toBe('021000021');
    expect(maskBankNumber('987654321')).toBe('••••••••4321');
  });
});

describe('formatDateTime', () => {
  it('shows the local date and 12-hour time', () => {
    expect(formatDateTime(new Date(2025, 4, 18, 10, 30).toISOString())).toBe('May 18, 2025 10:30 AM');
    expect(formatDateTime(new Date(2025, 0, 2, 0, 5).toISOString())).toBe('Jan 2, 2025 12:05 AM');
    expect(formatDateTime(new Date(2025, 11, 31, 23, 59).toISOString())).toBe('Dec 31, 2025 11:59 PM');
    expect(formatDateTime('not a date')).toBe('');
  });
});

describe('payment settings (in memory until the API exists)', () => {
  it('starts with no ACH, the default payment terms and Net 30', async () => {
    const settings = await fetchPaymentSettings('account-new');

    expect(settings.ach).toBeNull();
    expect(settings.dueDateTerm).toBe('Net 30');
    expect(settings.paymentTerms.map((term) => term.percentage)).toEqual([25, 25, 25, 25]);
  });

  it('saves bank details for the account, named after the company, and keeps them on the next load', async () => {
    const ach = await saveAchInfo('account-ach', 'High Tech Air Inc', {
      bankName: '  Chase Bank ',
      accountType: 'Checking',
      accountNumber: '987654321',
      routingNumber: CHASE_ROUTING,
    });

    expect(ach).toMatchObject({
      bankName: 'Chase Bank',
      accountHolderName: 'High Tech Air Inc',
      accountType: 'Checking',
      accountNumber: '987654321',
      routingNumber: CHASE_ROUTING,
    });
    expect(Number.isNaN(Date.parse(ach.generatedAt))).toBe(false);
    await expect(fetchPaymentSettings('account-ach')).resolves.toMatchObject({ ach });
    await expect(fetchPaymentSettings('another-account')).resolves.toMatchObject({ ach: null });
  });

  it('refuses invalid bank details', async () => {
    const valid = { bankName: 'Chase', accountType: 'Savings' as const, accountNumber: '987654321', routingNumber: CHASE_ROUTING };

    await expect(saveAchInfo('a', 'Co', { ...valid, bankName: ' ' })).rejects.toThrow('bank name');
    await expect(saveAchInfo('a', 'Co', { ...valid, accountNumber: '12' })).rejects.toThrow('account number');
    await expect(saveAchInfo('a', 'Co', { ...valid, routingNumber: '123456789' })).rejects.toThrow('routing number');
  });

  it('changes the due date term', async () => {
    const updated = await updateDueDateTerm('account-due', 'Net 45');

    expect(updated.dueDateTerm).toBe('Net 45');
    await expect(fetchPaymentSettings('account-due')).resolves.toMatchObject({ dueDateTerm: 'Net 45' });
  });
});

describe('generateAchFormPdf', () => {
  it('creates a one-page PDF named for the company', async () => {
    const base64 = await generateAchFormPdf({
      company: COMPANY,
      ach: {
        bankName: 'Chase Bank',
        accountHolderName: COMPANY.name,
        accountType: 'Checking',
        accountNumber: '987654321',
        routingNumber: CHASE_ROUTING,
        generatedAt: new Date(2025, 4, 18, 10, 30).toISOString(),
      },
    });

    const doc = await PDFDocument.load(Buffer.from(base64, 'base64'));
    expect(doc.getPageCount()).toBe(1);
    expect(doc.getTitle()).toBe('ACH Authorization Form - High Tech Air Inc');
    expect(achFormFileName(COMPANY.name)).toBe('ACH Form - High Tech Air Inc.pdf');
  });
});
