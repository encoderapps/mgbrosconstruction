import { SALESFORCE_ACH_URL, SALESFORCE_INSTANCE_URL, SALESFORCE_SUBCONTRACTOR_ACH_URL } from '../constants/config';
import { ACH_ACCOUNT_TYPE } from '../constants/paymentSettings';
import { AchApiPayload, AchApiResponse, AchPdfApiRecord, SubcontractorAchApiResponse } from '../types';
import { AchFormPdf, AchInfo, DueDateTerm, NewAchInfo, PaymentSettings } from '../types/paymentSettings';
import { downloadSalesforceFileToCache } from './documentFileService';

/** The REST API version used for file downloads, as in SALESFORCE_QUERY_URL. */
const SALESFORCE_API_VERSION = 'v60.0';
import { isValidAccountNumber, ROUTING_NUMBER_LENGTH } from '../utils/bankAccount';
import { salesforceGet, salesforceSend } from './salesforceClient';

/*
 * The bank details are loaded from and saved to Salesforce. TODO: there's no
 * API yet for the payment terms or the due date term, so each account's are
 * kept in memory (until the app restarts), starting from the defaults below.
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
    ach: settings.ach && { ...settings.ach, pdf: settings.ach.pdf && { ...settings.ach.pdf } },
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

const ACH_LOAD_ERROR_MESSAGE = 'Unable to load your bank details.';

/** The newest available ACH form PDF (by its created date), or null when there's none. */
export function latestAchPdf(records: readonly (AchPdfApiRecord | null | undefined)[]): AchFormPdf | null {
  let latest: AchFormPdf | null = null;
  let latestTime = -Infinity;
  for (const record of records) {
    const downloadUrl = record?.pdfDownloadUrl?.trim();
    if (!record || !downloadUrl || record.pdfAvailable === false) {
      continue;
    }
    const createdDate = record.pdfCreatedDate?.trim() || null;
    const time = createdDate ? Date.parse(createdDate) : NaN;
    // Undated ones only win when nothing is dated; ties keep the API's (newest-first) order.
    const rank = Number.isNaN(time) ? -Number.MAX_VALUE : time;
    if (!latest || rank > latestTime) {
      latest = {
        fileName: record.pdfFileName?.trim() || 'ACH Form.pdf',
        downloadUrl,
        versionId: record.pdfVersionId?.trim() || null,
        createdDate,
      };
      latestTime = rank;
    }
  }
  return latest;
}

/**
 * The account's latest bank details (GET /ach/subcontractor/v1/), or null when
 * there are none, with the latest ACH form PDF. Salesforce lists the records
 * newest first, so the first one is the latest.
 */
async function fetchAchInfo(accountId: string): Promise<AchInfo | null> {
  const data = await salesforceGet<SubcontractorAchApiResponse>(SALESFORCE_SUBCONTRACTOR_ACH_URL, { accountId });
  if (!data.success) {
    throw new Error(data.message || ACH_LOAD_ERROR_MESSAGE);
  }
  const form = (data.achForms ?? []).find((record) => record?.accountNumber?.trim());
  if (!form) {
    return null;
  }
  const pdf = latestAchPdf(data.achPdfs ?? []);
  return {
    bankName: form.bankName?.trim() ?? '',
    accountHolderName: data.subcontractorName?.trim() ?? '',
    // Salesforce saves every ACH account as a Bank Account (it may send null).
    accountType: ACH_ACCOUNT_TYPE,
    accountNumber: form.accountNumber?.trim() ?? '',
    routingNumber: form.routingNumber?.trim() ?? '',
    generatedAt: pdf?.createdDate ?? null,
    pdf,
  };
}

/**
 * Downloads an ACH form PDF from Salesforce into the app's cache and returns
 * its path, for the document viewer. It's fetched through the REST API's
 * ContentVersion VersionData, which takes the API token: the
 * /sfc/servlet.shepherd/… link needs a browser session and sends back a login
 * page instead.
 */
export function downloadAchPdf(pdf: AchFormPdf): Promise<string> {
  const url = pdf.versionId
    ? `${SALESFORCE_INSTANCE_URL}/services/data/${SALESFORCE_API_VERSION}/sobjects/ContentVersion/${encodeURIComponent(pdf.versionId)}/VersionData`
    : `${SALESFORCE_INSTANCE_URL}${pdf.downloadUrl}`;
  return downloadSalesforceFileToCache(url, pdf.fileName);
}

/** The account's ACH details (from Salesforce), default payment terms and due date term. */
export async function fetchPaymentSettings(accountId: string): Promise<PaymentSettings> {
  const ach = await fetchAchInfo(accountId);
  // Kept with the in-app settings, so changing the due date term keeps showing them.
  const settings = { ...getStoredSettings(accountId), ach };
  settingsByAccount.set(accountId, settings);
  return copySettings(settings);
}

const ACH_SAVE_ERROR_MESSAGE = 'Unable to save your bank details. Please try again.';

/**
 * Saves the account's bank details to Salesforce (POST /ach/v1/), which
 * creates its ACH form, and returns them with the time the form was
 * generated. They replace any earlier ones shown in Payment Settings.
 * Throws an Error with a message fit to show the user if the details are
 * invalid or Salesforce refuses them.
 */
export async function saveAchInfo(accountId: string, accountHolderName: string, input: NewAchInfo): Promise<AchInfo> {
  const bankName = input.bankName.trim();
  if (!bankName) {
    throw new Error('Please enter the bank name.');
  }
  if (!isValidAccountNumber(input.accountNumber)) {
    throw new Error('Please enter a valid account number.');
  }
  // Only its length is checked: the ABA checksum is left to Salesforce.
  if (!/^\d+$/.test(input.routingNumber) || input.routingNumber.length !== ROUTING_NUMBER_LENGTH) {
    throw new Error(`Please enter a valid ${ROUTING_NUMBER_LENGTH}-digit routing number.`);
  }

  const payload: AchApiPayload = {
    accountId,
    bankName,
    accountNumber: input.accountNumber,
    // The form has already checked the two match.
    confirmAccountNumber: input.accountNumber,
    routingNumber: input.routingNumber,
  };
  const data = await salesforceSend<AchApiResponse>(
    { method: 'post', url: SALESFORCE_ACH_URL, data: payload },
    ACH_SAVE_ERROR_MESSAGE,
  );
  if (!data.success) {
    throw new Error(data.message || ACH_SAVE_ERROR_MESSAGE);
  }

  const ach: AchInfo = {
    bankName: data.bankName?.trim() || bankName,
    accountHolderName: accountHolderName.trim(),
    accountType: ACH_ACCOUNT_TYPE,
    accountNumber: input.accountNumber,
    routingNumber: data.routingNumber?.trim() || input.routingNumber,
    generatedAt: new Date().toISOString(),
    bookkeepingAccountId: data.bookkeepingAccountId ?? null,
    bkFileId: data.bkFileId ?? null,
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
