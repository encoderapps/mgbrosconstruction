import {
  SALESFORCE_CREATE_CHANGE_ORDER_URL,
  SALESFORCE_JOB_CHANGE_ORDER_LINE_ITEMS_URL,
  SALESFORCE_MY_JOB_CHANGE_ORDER_ITEMS_URL,
  SALESFORCE_PURCHASE_ORDER_CHANGE_ORDERS_URL,
  SALESFORCE_SIGN_CHANGE_ORDER_URL,
} from '../constants/config';
import { EMPTY_VALUE } from '../constants/display';
import {
  AddChangeOrderItemApiResponse,
  AddJobChangeOrderLineItemApiPayload,
  AddMyJobChangeOrderItemApiPayload,
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
  NewJobChangeOrderItem,
  NewMyJobChangeOrderItem,
} from '../types/changeOrder';
import { isChangeOrderSigned, lineItemAmount } from '../utils/changeOrder';
import { isDateOnlyString, todayDateString } from '../utils/dateValidation';
import { htmlToPlainText } from '../utils/html';
import { toNumber } from '../utils/toNumber';
import { SignedPdf } from '../types/signedDocument';
import { changeOrderSource, rememberChangeOrderSource } from './changeOrderSourceStore';
import { fetchPurchaseOrderJobId } from './purchaseOrderInvoiceService';
import { salesforceSend } from './salesforceClient';

const LOAD_ERROR_MESSAGE = 'Unable to load this change order.';
const SIGN_ERROR_MESSAGE = 'Unable to sign this change order. Please try again.';
/** Used if a successful signing response leaves out the new status. */
const SIGNED_STATUS = 'Signed';

/*
 * Signing is done by the API (signChangeOrder), which doesn't return who
 * signed or in what style, so the signature shown afterwards is kept here, in
 * memory (until the app restarts).
 */
interface LocalChanges {
  signature: ChangeOrderSignature | null;
}
const localChangesById = new Map<string, LocalChanges>();

function getLocalChanges(changeOrderId: string): LocalChanges {
  let changes = localChangesById.get(changeOrderId);
  if (!changes) {
    changes = { signature: null };
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
    ...(record.serviceCategoryId?.trim() && { categoryId: record.serviceCategoryId.trim() }),
    quantity,
    unitPrice,
    amount: lineItemAmount(quantity, unitPrice),
  };
}

/** The API's change order, falling back to what the PO's change-order list said for anything missing. */
function toChangeOrderDetail(record: ChangeOrderDetailApiRecord, summary: ChangeOrderSummary): ChangeOrderDetail {
  const description = htmlToPlainText(record.description ?? '') || summary.description;
  const source = changeOrderSource(summary.id, record.source) || summary.source;
  return {
    id: record.id || summary.id,
    name: record.changeOrderNo?.trim() || summary.name,
    status: record.status?.trim() || summary.status,
    amount: toNumber(record.amount) ?? summary.amount,
    description,
    ...(source && { source }),
    notes: description,
    items: (record.items ?? []).map(toChangeOrderItem),
    signature: null,
  };
}

/** Lays the signature made in this app over the API's change order. */
function withLocalChanges(changeOrder: ChangeOrderDetail): ChangeOrderDetail {
  const changes = localChangesById.get(changeOrder.id);
  if (!changes?.signature) {
    return changeOrder;
  }
  // Only shows who signed: the status is the API's.
  return { ...changeOrder, signature: { ...changes.signature } };
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

const ADD_ITEM_ERROR_MESSAGE = 'Unable to save the line item. Please try again.';

async function postChangeOrderItem(url: string, data: object): Promise<void> {
  const response = await salesforceSend<AddChangeOrderItemApiResponse>({ method: 'post', url, data }, ADD_ITEM_ERROR_MESSAGE);
  if (!response.success) {
    throw new Error(response.message || ADD_ITEM_ERROR_MESSAGE);
  }
}

/** The change order as the API has it now; throws if it's signed and can't be changed. */
async function fetchOpenChangeOrder(
  accountId: string,
  poId: string,
  summary: ChangeOrderSummary,
): Promise<ChangeOrderDetail> {
  const changeOrder = await fetchChangeOrderDetail(accountId, poId, summary);
  if (isChangeOrderSigned(changeOrder)) {
    throw new Error('This change order has been signed and can no longer be changed.');
  }
  return changeOrder;
}

/**
 * Adds a line item to an unsigned "My Job Change Order" (POST
 * /myjobchangeorderitems). Throws an Error with a message fit to show.
 */
export async function addMyJobChangeOrderItem(
  accountId: string,
  poId: string,
  summary: ChangeOrderSummary,
  item: NewMyJobChangeOrderItem,
): Promise<void> {
  await fetchOpenChangeOrder(accountId, poId, summary);
  const payload: AddMyJobChangeOrderItemApiPayload = {
    changeOrderId: summary.id,
    description: item.description.trim(),
    itemCost: item.itemCost,
    itemPrice: item.itemPrice,
  };
  await postChangeOrderItem(SALESFORCE_MY_JOB_CHANGE_ORDER_ITEMS_URL, payload);
}

/**
 * Adds a line item to an unsigned "Job Change Order" (POST
 * /jobchangeorderlineitems). A category already on the change order (matched
 * by name against its items) is sent by Id (EXISTING_CATEGORY); any other is
 * created with it from the service item and category name (NEW_CATEGORY).
 * Throws an Error with a message fit to show.
 */
export async function addJobChangeOrderItem(
  accountId: string,
  poId: string,
  summary: ChangeOrderSummary,
  item: NewJobChangeOrderItem,
): Promise<void> {
  const changeOrder = await fetchOpenChangeOrder(accountId, poId, summary);
  const wanted = item.category.trim().toLowerCase();
  const categoryId = changeOrder.items.find(
    (existing) => existing.categoryId && existing.category.trim().toLowerCase() === wanted,
  )?.categoryId;
  const fields = {
    changeOrderId: summary.id,
    product: item.product,
    description: item.description.trim(),
    markup: item.markup,
    cost: item.cost,
    poCost: item.poCost,
  };
  const payload: AddJobChangeOrderLineItemApiPayload = categoryId
    ? { operation: 'EXISTING_CATEGORY', categoryId, ...fields }
    : { operation: 'NEW_CATEGORY', serviceItem: item.serviceItem, category: item.category, ...fields };
  await postChangeOrderItem(SALESFORCE_JOB_CHANGE_ORDER_LINE_ITEMS_URL, payload);
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
  rememberChangeOrderSource(data.changeOrderId?.trim() ?? '', data.source);
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
