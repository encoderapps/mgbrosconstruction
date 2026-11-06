import { fetchPaymentSettings, saveAchInfo, updateDueDateTerm } from '../src/services/paymentSettingsService';
import { salesforceGet, salesforceSend } from '../src/services/salesforceClient';
import { AchApiResponse, SubcontractorAchApiResponse } from '../src/types';

// A real, public ABA routing number.
const CHASE_ROUTING = '021000021';

jest.mock('../src/services/salesforceClient', () => ({
  salesforceGet: jest.fn(),
  salesforceSend: jest.fn(),
}));

const mockedGet = salesforceGet as jest.MockedFunction<typeof salesforceGet>;
const mockedSend = salesforceSend as unknown as jest.MockedFunction<
  (...args: Parameters<typeof salesforceSend>) => Promise<AchApiResponse>
>;

// Shaped like the sandbox responses.
const ACH_SAVED: AchApiResponse = {
  success: true,
  routingNumber: '678954321',
  message: 'ACH form created successfully',
  maskedAccountNumber: '****8335',
  bookkeepingAccountId: 'a1hQL0000086KgzYAE',
  bkFileId: 'a61QL0000083qBxYAI',
  bankName: 'Bank of America',
  accountType: 'Bank Account',
};
const ACH_LOADED: SubcontractorAchApiResponse = {
  achForms: [{ routingNumber: '123456789', accountNumber: '987654321', accountType: null, bankName: 'Chase Bank' }],
  totalRecords: 1,
  subcontractorName: 'Sas LLC',
  accountId: '001QL00002bgAPdYAM',
  message: 'ACH details fetched successfully.',
  success: true,
};
const NO_ACH: SubcontractorAchApiResponse = { success: true, achForms: [], totalRecords: 0 };

beforeEach(() => {
  mockedSend.mockResolvedValue(ACH_SAVED);
  mockedGet.mockResolvedValue(NO_ACH);
});

afterEach(() => {
  mockedSend.mockReset();
  mockedGet.mockReset();
});

describe('fetchPaymentSettings', () => {
  it("loads the account's bank details from Salesforce, as a Bank Account in the company's name", async () => {
    mockedGet.mockResolvedValue(ACH_LOADED);

    const settings = await fetchPaymentSettings('001QL00002bgAPdYAM');

    expect(mockedGet).toHaveBeenCalledWith(expect.stringMatching(/\/ach\/subcontractor\/v1\/$/), {
      accountId: '001QL00002bgAPdYAM',
    });
    expect(settings.ach).toEqual({
      bankName: 'Chase Bank',
      accountHolderName: 'Sas LLC',
      accountType: 'Bank Account',
      accountNumber: '987654321',
      routingNumber: '123456789',
      generatedAt: null,
    });
    expect(settings.dueDateTerm).toBe('Net 30');
  });

  it('has no ACH details when Salesforce has none', async () => {
    await expect(fetchPaymentSettings('001NONE')).resolves.toMatchObject({ ach: null });
  });

  it('keeps showing the bank details after the due date term changes', async () => {
    mockedGet.mockResolvedValue(ACH_LOADED);
    await fetchPaymentSettings('001DUE');

    const updated = await updateDueDateTerm('001DUE', 'Net 45');

    expect(updated).toMatchObject({ dueDateTerm: 'Net 45', ach: { bankName: 'Chase Bank' } });
  });

  it('throws the API message when the bank details fail to load', async () => {
    mockedGet.mockResolvedValue({ success: false, message: 'Account not found.' });

    await expect(fetchPaymentSettings('001BAD')).rejects.toThrow('Account not found.');
  });
});

describe('saveAchInfo', () => {
  it('posts the bank details to Salesforce and returns what it saved', async () => {
    const ach = await saveAchInfo('001QL00002caUn6YAE', 'High Tech Air Inc', {
      bankName: '  Bank of America ',
      accountNumber: '9858938335',
      // Not a valid ABA checksum, as in the sandbox: only the length is checked here.
      routingNumber: '678954321',
    });

    expect(mockedSend).toHaveBeenCalledWith(
      {
        method: 'post',
        url: expect.stringMatching(/\/ach\/v1\/$/),
        data: {
          accountId: '001QL00002caUn6YAE',
          bankName: 'Bank of America',
          accountNumber: '9858938335',
          confirmAccountNumber: '9858938335',
          routingNumber: '678954321',
        },
      },
      expect.any(String),
    );
    expect(ach).toMatchObject({
      bankName: 'Bank of America',
      accountHolderName: 'High Tech Air Inc',
      accountType: 'Bank Account',
      accountNumber: '9858938335',
      routingNumber: '678954321',
      bookkeepingAccountId: 'a1hQL0000086KgzYAE',
      bkFileId: 'a61QL0000083qBxYAI',
    });
    expect(Number.isNaN(Date.parse(ach.generatedAt ?? ''))).toBe(false);
  });

  it('refuses invalid bank details without calling Salesforce', async () => {
    const valid = { bankName: 'Chase', accountNumber: '987654321', routingNumber: CHASE_ROUTING };

    await expect(saveAchInfo('a', 'Co', { ...valid, bankName: ' ' })).rejects.toThrow('bank name');
    await expect(saveAchInfo('a', 'Co', { ...valid, accountNumber: '12' })).rejects.toThrow('account number');
    await expect(saveAchInfo('a', 'Co', { ...valid, routingNumber: '02100002' })).rejects.toThrow('routing number');
    expect(mockedSend).not.toHaveBeenCalled();
  });

  it("throws Salesforce's message when it refuses the details", async () => {
    mockedSend.mockResolvedValue({ success: false, message: 'Invalid routing number.' });

    await expect(
      saveAchInfo('account-refused', 'Co', { bankName: 'Chase', accountNumber: '987654321', routingNumber: CHASE_ROUTING }),
    ).rejects.toThrow('Invalid routing number.');
  });
});
