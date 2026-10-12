import { SALESFORCE_PURCHASE_ORDER_CHANGE_ORDERS_URL } from '../constants/config';
import { EMPTY_VALUE } from '../constants/display';
import {
  ChangeOrderDetailApiRecord,
  ChangeOrderDetailItemApiRecord,
  PurchaseOrderChangeOrdersApiPayload,
  PurchaseOrderChangeOrdersApiResponse,
} from '../types';
import {
  ChangeOrderDetail,
  ChangeOrderItem,
  ChangeOrderSignature,
  ChangeOrderSummary,
  NewChangeOrderItem,
} from '../types/changeOrder';
import { isChangeOrderSigned, lineItemAmount } from '../utils/changeOrder';
import { todayDateString } from '../utils/dateValidation';
import { htmlToPlainText } from '../utils/html';
import { toNumber } from '../utils/toNumber';
import { salesforceSend } from './salesforceClient';

const LOAD_ERROR_MESSAGE = 'Unable to load this change order.';
/** The status a change order shows once the subcontractor signs it in the app. */
const SIGNED_STATUS = 'Signed';

/*
 * TODO: there's no API yet for adding a line item to a change order or for
 * signing one. Until there is, both are kept in memory here (until the app
 * restarts) and laid over the change order the API returns. Replace them with
 * their Salesforce calls once the endpoints ship.
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
    ...(changes.signature && { status: SIGNED_STATUS, signature: { ...changes.signature } }),
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

/** Signs an unsigned change order with the typed name and today's date; returns the signed change order. */
export async function signChangeOrder(
  accountId: string,
  poId: string,
  summary: ChangeOrderSummary,
  signerName: string,
): Promise<ChangeOrderDetail> {
  const name = signerName.trim().replace(/\s+/g, ' ');
  if (!name) {
    throw new Error('Please sign with your full name.');
  }
  await assertChangeOrderOpen(accountId, poId, summary);
  getLocalChanges(summary.id).signature = { name, date: todayDateString() };
  return fetchChangeOrderDetail(accountId, poId, summary);
}
