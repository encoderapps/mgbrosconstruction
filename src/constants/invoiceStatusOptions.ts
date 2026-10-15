/** The Salesforce Invoice status picklist (Invoice__c.Status__c), in its order. */
export const INVOICE_STATUS_OPTIONS = ['New', 'Partial Payment', 'Paid in Full', 'Overpaid'] as const;

export const DEFAULT_INVOICE_STATUS = INVOICE_STATUS_OPTIONS[0];
