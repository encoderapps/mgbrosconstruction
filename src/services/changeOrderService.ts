import {
  SALESFORCE_CREATE_CHANGE_ORDER_URL,
  SALESFORCE_PURCHASE_ORDER_CHANGE_ORDERS_URL,
  SALESFORCE_SIGN_CHANGE_ORDER_URL,
} from '../constants/config';
import { EMPTY_VALUE } from '../constants/display';
import {
  ChangeOrderDetailApiRecord,
  ChangeOrderDetailItemApiRecord,
  CreateChangeOrderApiPayload,
  CreateChangeOrderApiResponse,
  PurchaseOrderChangeOrdersApiPayload,
  PurchaseOrderChangeOrdersApiResponse,
  SignChangeOrderApiPayload,
  SignChangeOrderApiResponse,
} from '../types';
import {
  ChangeOrderDetail,
  ChangeOrderItem,
  ChangeOrderSignature,
  ChangeOrderSummary,
  CreatedChangeOrder,
  NewChangeOrder,
  NewChangeOrderItem,
} from '../types/changeOrder';
import { isChangeOrderSigned, lineItemAmount } from '../utils/changeOrder';
import { isDateOnlyString, todayDateString } from '../utils/dateValidation';
import { htmlToPlainText } from '../utils/html';
import { toNumber } from '../utils/toNumber';
import { SignedPdf } from '../types/signedDocument';
import { fetchPurchaseOrderJobId } from './purchaseOrderInvoiceService';
import { salesforceSend } from './salesforceClient';

const LOAD_ERROR_MESSAGE = 'Unable to load this change order.';
const SIGN_ERROR_MESSAGE = 'Unable to sign this change order. Please try again.';
/** Used if a successful signing response leaves out the new status. */
const SIGNED_STATUS = 'Signed';

/*
 * TODO: there's no API yet for adding a line item to a change order, so added
 * items are kept in memory here (until the app restarts) and laid over the
 * change order the API returns. Replace them with the Salesforce call once the
 * endpoint ships.
 *
 * Signing is done by the API (signChangeOrder), which doesn't return who
 * signed or in what style, so the signature shown afterwards is also kept here.
 */
interface LocalChanges {
  addedItems: ChangeOrderItem[];
  signature: ChangeOrderSignature | null;
}
const localChangesById = new Map<string, LocalChanges>();
let nextLocalItemNumber = 1;

function getLocalChanges(changeOrderId: string): LocalChanges {
  let changes = localChangesById.get(changeOrderId);
  if (!changes) {
    changes = { addedItems: [], signature: null };
    localChangesById.set(changeOrderId, changes);
  }
  return changes;
}

function toChangeOrderItem(record: ChangeOrderDetailItemApiRecord, index: number): ChangeOrderItem {
  const quantity = toNumber(record.qty) ?? 0;
  const unitPrice = toNumber(record.unitPrice) ?? 0;
  return {
    id: record.id || `change-order-item-${index}`,
    description: htmlToPlainText(record.description ?? '') || record.productOrServices?.trim() || EMPTY_VALUE,
    category: record.categoryName?.trim() ?? '',
    quantity,
    unitPrice,
    amount: lineItemAmount(quantity, unitPrice),
  };
}

/** The API's change order, falling back to what the PO's change-order list said for anything missing. */
function toChangeOrderDetail(record: ChangeOrderDetailApiRecord, summary: ChangeOrderSummary): ChangeOrderDetail {
  const description = htmlToPlainText(record.description ?? '') || summary.description;
  return {
    id: record.id || summary.id,
    name: record.changeOrderNo?.trim() || summary.name,
    status: record.status?.trim() || summary.status,
    amount: toNumber(record.amount) ?? summary.amount,
    description,
    notes: description,
    items: (record.items ?? []).map(toChangeOrderItem),
    signature: null,
  };
}

/** Lays the in-app (not yet saved to Salesforce) items and signature over the API's change order. */
function withLocalChanges(changeOrder: ChangeOrderDetail): ChangeOrderDetail {
  const changes = localChangesById.get(changeOrder.id);
  if (!changes) {
    return changeOrder;
  }
  return {
    ...changeOrder,
    items: [...changeOrder.items, ...changes.addedItems.map((item) => ({ ...item }))],
    // Only shows who signed: the status is the API's.
    ...(changes.signature && { signature: { ...changes.signature } }),
  };
}

async function fetchFromApi(accountId: string, poId: string, summary: ChangeOrderSummary): Promise<ChangeOrderDetail> {
  const payload: PurchaseOrderChangeOrdersApiPayload = { accountId, poId, changeOrderId: summary.id };
  const data = await salesforceSend<PurchaseOrderChangeOrdersApiResponse>(
    { method: 'post', url: SALESFORCE_PURCHASE_ORDER_CHANGE_ORDERS_URL, data: payload },
    LOAD_ERROR_MESSAGE,
  );
  if (!data.success) {
    throw new Error(data.message || LOAD_ERROR_MESSAGE);
  }
  if (!data.changeOrderDetail) {
    throw new Error('This change order could not be found.');
  }
  return toChangeOrderDetail(data.changeOrderDetail, summary);
}

/**
 * One change order of a purchase order, with its items (POST
 * /purchaseorderchangeorder with a changeOrderId). `summary` is the change
 * order as listed on the PO, used for anything the detail leaves out. Throws an
 * Error with a message fit to show the user.
 */
export async function fetchChangeOrderDetail(
  accountId: string,
  poId: string,
  summary: ChangeOrderSummary,
): Promise<ChangeOrderDetail> {
  return withLocalChanges(await fetchFromApi(accountId, poId, summary));
}

/** Throws unless the change order (as the API has it now, plus in-app changes) is still unsigned. */
async function assertChangeOrderOpen(accountId: string, poId: string, summary: ChangeOrderSummary): Promise<void> {
  if (isChangeOrderSigned(await fetchChangeOrderDetail(accountId, poId, summary))) {
    throw new Error('This change order has been signed and can no longer be changed.');
  }
}

/** Adds a line item to an unsigned change order; returns the updated change order. */
export async function addChangeOrderItem(
  accountId: string,
  poId: string,
  summary: ChangeOrderSummary,
  item: NewChangeOrderItem,
): Promise<ChangeOrderDetail> {
  await assertChangeOrderOpen(accountId, poId, summary);
  getLocalChanges(summary.id).addedItems.push({
    id: `${summary.id}-local-${nextLocalItemNumber++}`,
    description: item.description.trim(),
    category: '',
    quantity: item.quantity,
    unitPrice: item.unitPrice,
    amount: lineItemAmount(item.quantity, item.unitPrice),
  });
  return fetchChangeOrderDetail(accountId, poId, summary);
}

/** The status every new change order starts in. */
export const NEW_CHANGE_ORDER_STATUS = 'Draft';

const CREATE_ERROR_MESSAGE = 'Unable to create the change order. Please try again.';
const CHANGE_ORDER_JOB_NOT_FOUND_MESSAGE =
  'This purchase order is not linked to a job, so a change order cannot be added to it.';

/** The PO's job: the one the PO detail sent, else looked up. Throws a message fit to show when there's none. */
async function resolvePurchaseOrderJobId(accountId: string, input: NewChangeOrder): Promise<string> {
  if (input.opportunityId) {
    return input.opportunityId;
  }
  let jobId: string | null;
  try {
    jobId = await fetchPurchaseOrderJobId(accountId, input.poId);
  } catch (error) {
    console.error('Failed to look up the purchase order job:', error);
    throw new Error(CREATE_ERROR_MESSAGE);
  }
  if (!jobId) {
    throw new Error(CHANGE_ORDER_JOB_NOT_FOUND_MESSAGE);
  }
  return jobId;
}

/**
 * Creates a Draft change order on one of the account's signed purchase orders
 * (POST /createjobchangeorder). The backend assigns its number (e.g. "CO#08"),
 * links the PO's general contractor and submits it for approval. Throws an
 * Error with a message fit to show the user if the input isn't valid or the
 * API doesn't create it.
 */
export async function createChangeOrder(accountId: string, input: NewChangeOrder): Promise<CreatedChangeOrder> {
  const description = input.description.trim();
  const specialInstructions = input.specialInstructions.trim();
  if (!Number.isFinite(input.amount) || input.amount <= 0) {
    throw new Error('Please enter an amount greater than $0.');
  }
  if (!description) {
    throw new Error('Please describe the change order.');
  }
  if (!isDateOnlyString(input.dateOfIssue)) {
    throw new Error('Please select the date of issue.');
  }

  const payload: CreateChangeOrderApiPayload = {
    poId: input.poId,
    accountId,
    jobId: await resolvePurchaseOrderJobId(accountId, input),
    status: NEW_CHANGE_ORDER_STATUS,
    changeOrderAmount: input.amount,
    description,
    dateOfIssue: input.dateOfIssue,
    ...(specialInstructions && { specialInstructions }),
  };
  const data = await salesforceSend<CreateChangeOrderApiResponse>(
    { method: 'post', url: SALESFORCE_CREATE_CHANGE_ORDER_URL, data: payload },
    CREATE_ERROR_MESSAGE,
  );
  if (!data.success) {
    throw new Error(data.message || CREATE_ERROR_MESSAGE);
  }
  return {
    id: data.changeOrderId?.trim() ?? '',
    changeOrderNumber: data.changeOrderNo?.trim() || data.changeOrderNumber?.trim() || '',
    status: data.status?.trim() || NEW_CHANGE_ORDER_STATUS,
    approvalStatus: data.approvalStatus?.trim() ?? '',
    message: data.message?.trim() || 'Change order created successfully.',
  };
}

export interface SignChangeOrderResult {
  /** The change order's status after signing, as the API reports it, e.g. "Signed". */
  status: string;
  /** Who signed, with the signature on file, and the signing date (the API's). */
  signature: ChangeOrderSignature;
  /** The API's message, e.g. "Change Order is already signed." */
  message: string;
}

/**
 * Signs a change order (POST /subcontractor/signchangeorder), uploading the
 * signed change order, and returns its new status and signing date. `signer`
 * is the signature the API has on file: the full name and its image. A change
 * order that's already signed comes back as signed too. Throws an Error with a
 * message fit to show the user.
 */
export async function signChangeOrder(
  accountId: string,
  changeOrderId: string,
  signer: { name: string; imageBase64: string },
  signedPdf: SignedPdf,
): Promise<SignChangeOrderResult> {
  const name = signer.name.trim().replace(/\s+/g, ' ');
  if (!name || !signer.imageBase64) {
    throw new Error('Your signature is not on file. Please contact MG Bros.');
  }
  const payload: SignChangeOrderApiPayload = {
    accountId,
    changeOrderId,
    confirmSignature: true,
    pdfFileName: signedPdf.fileName,
    pdfBase64Data: signedPdf.base64,
  };
  const data = await salesforceSend<SignChangeOrderApiResponse>(
    { method: 'post', url: SALESFORCE_SIGN_CHANGE_ORDER_URL, data: payload },
    SIGN_ERROR_MESSAGE,
  );
  if (!data.success) {
    throw new Error(data.message || SIGN_ERROR_MESSAGE);
  }
  const signature: ChangeOrderSignature = {
    name,
    imageBase64: signer.imageBase64,
    date: data.vendorSignedDate || data.signedDate || todayDateString(),
  };
  getLocalChanges(changeOrderId).signature = signature;
  return {
    status: data.status?.trim() || SIGNED_STATUS,
    signature: { ...signature },
    message: data.message || 'Change Order signed successfully.',
  };
}
