import { AchInfo, DueDateTerm, NewAchInfo, PaymentSettings } from '../types/paymentSettings';
import { isValidAccountNumber, isValidRoutingNumber } from '../utils/bankAccount';

/*
 * TODO: there's no payment settings API yet. These functions keep each
 * account's settings in memory (until the app restarts), starting from the
 * defaults below. Replace each body with its Salesforce call once the
 * endpoints ship; the signatures and errors are already what the screens expect.
 */
const DEFAULT_PAYMENT_TERMS: PaymentSettings['paymentTerms'] = [
  { id: 'term-1', percentage: 25, description: 'Down Payment' },
  { id: 'term-2', percentage: 25, description: 'Upon completion of rough' },
  { id: 'term-3', percentage: 25, description: 'Upon completion of trimming' },
  { id: 'term-4', percentage: 25, description: 'After the substantial completion' },
];
const DEFAULT_DUE_DATE_TERM: DueDateTerm = 'Net 30';

const settingsByAccount = new Map<string, PaymentSettings>();

function copySettings(settings: PaymentSettings): PaymentSettings {
  return {
    ach: settings.ach && { ...settings.ach },
    paymentTerms: settings.paymentTerms.map((term) => ({ ...term })),
    dueDateTerm: settings.dueDateTerm,
  };
}

function getStoredSettings(accountId: string): PaymentSettings {
  let settings = settingsByAccount.get(accountId);
  if (!settings) {
    settings = { ach: null, paymentTerms: DEFAULT_PAYMENT_TERMS, dueDateTerm: DEFAULT_DUE_DATE_TERM };
    settingsByAccount.set(accountId, settings);
  }
  return settings;
}

/** The account's ACH details, default payment terms and due date term. */
export async function fetchPaymentSettings(accountId: string): Promise<PaymentSettings> {
  return copySettings(getStoredSettings(accountId));
}

/**
 * Saves the account's bank details (replacing any earlier ones) and returns
 * them with the time the ACH form was generated. Throws an Error with a
 * message fit to show the user if the details are invalid.
 */
export async function saveAchInfo(accountId: string, accountHolderName: string, input: NewAchInfo): Promise<AchInfo> {
  if (!input.bankName.trim()) {
    throw new Error('Please enter the bank name.');
  }
  if (!isValidAccountNumber(input.accountNumber)) {
    throw new Error('Please enter a valid account number.');
  }
  if (!isValidRoutingNumber(input.routingNumber)) {
    throw new Error('Please enter a valid 9-digit routing number.');
  }
  const ach: AchInfo = {
    bankName: input.bankName.trim(),
    accountHolderName: accountHolderName.trim(),
    accountType: input.accountType,
    accountNumber: input.accountNumber,
    routingNumber: input.routingNumber,
    generatedAt: new Date().toISOString(),
  };
  settingsByAccount.set(accountId, { ...getStoredSettings(accountId), ach });
  return { ...ach };
}

/** Changes how many days after the invoice date payment is due; returns the updated settings. */
export async function updateDueDateTerm(accountId: string, dueDateTerm: DueDateTerm): Promise<PaymentSettings> {
  const updated = { ...getStoredSettings(accountId), dueDateTerm };
  settingsByAccount.set(accountId, updated);
  return copySettings(updated);
}
