import { AchAccountType, DueDateTerm } from '../types/paymentSettings';

export const ACH_ACCOUNT_TYPES: readonly AchAccountType[] = ['Checking', 'Savings'];

/** Days after the invoice date that payment is due, for each term. */
export const DUE_DATE_TERM_DAYS: Record<DueDateTerm, number> = {
  'Net 15': 15,
  'Net 30': 30,
  'Net 45': 45,
  'Net 60': 60,
};

export const DUE_DATE_TERMS = Object.keys(DUE_DATE_TERM_DAYS) as DueDateTerm[];
