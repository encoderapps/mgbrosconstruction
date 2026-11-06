/** Salesforce saves every ACH account as a "Bank Account". */
export type AchAccountType = 'Bank Account';

/** The subcontractor's bank account for ACH payments. */
export interface AchInfo {
  bankName: string;
  /** Name on the account: the company's name. */
  accountHolderName: string;
  accountType: AchAccountType;
  /** Digits only. */
  accountNumber: string;
  /** 9 digits (an ABA routing number). */
  routingNumber: string;
  /** When the ACH form was generated, as an ISO timestamp; null when loaded from Salesforce (it doesn't send one). */
  generatedAt: string | null;
  /** Salesforce's ids for the saved bank details and the ACH form's file; null when not sent. */
  bookkeepingAccountId?: string | null;
  bkFileId?: string | null;
}

/** What the ACH Information form sends. */
export type NewAchInfo = Pick<AchInfo, 'bankName' | 'accountNumber' | 'routingNumber'>;

/** One of the account's default payment terms, e.g. 25% · Down Payment. */
export interface AccountPaymentTerm {
  id: string;
  percentage: number;
  description: string;
}

export type DueDateTerm = 'Net 15' | 'Net 30' | 'Net 45' | 'Net 60';

export interface PaymentSettings {
  /** null until the subcontractor adds their bank account. */
  ach: AchInfo | null;
  paymentTerms: AccountPaymentTerm[];
  dueDateTerm: DueDateTerm;
}
