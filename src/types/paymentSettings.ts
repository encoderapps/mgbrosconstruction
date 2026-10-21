export type AchAccountType = 'Checking' | 'Savings';

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
  /** When the ACH form was generated, as an ISO timestamp. */
  generatedAt: string;
}

/** What the ACH Information form sends. */
export type NewAchInfo = Pick<AchInfo, 'bankName' | 'accountType' | 'accountNumber' | 'routingNumber'>;

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
