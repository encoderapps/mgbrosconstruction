import { SALESFORCE_BID_ITEMS_URL, SALESFORCE_BID_UPDATE_URL, SALESFORCE_BIDS_URL } from '../constants/config';
import {
  BidApiRecord,
  BidLineItemApiPayload,
  BidLineItemApiRecord,
  BidLineItemCreateApiResponse,
  BidsApiResponse,
  BidStatusUpdateApiPayload,
  BidStatusUpdateApiResponse,
} from '../types';
import { Bid, BidDetail, BidLineItem, BidsView, NewBidLineItem } from '../types/bid';
import { AccountListResult } from '../types/list';
import { isBidEditable, sumBidLineItems } from '../utils/bidStatus';
import { timestampToLocalDate } from '../utils/dateValidation';
import { htmlToPlainText } from '../utils/html';
import { toNumber } from '../utils/toNumber';
import { salesforceGet, salesforceSend } from './salesforceClient';

/** How many bids the Home screen's card previews. */
export const HOME_BIDS_LIMIT = 5;

/** The status Salesforce gives a bid marked as complete (used if its response leaves it out). */
export const COMPLETED_BID_STATUS = 'Send Request';

const ADD_LINE_ITEM_ERROR_MESSAGE = 'Unable to save the line item. Please try again.';

const COMPLETE_ERROR_MESSAGE = 'Unable to complete the bid. Please try again.';

const LOAD_ERROR_MESSAGE = 'Unable to load bids.';

/** The bids as fetchBids last loaded them from Salesforce, by Id, for Bid Details. */
const loadedBidsById = new Map<string, BidDetail>();

/** A copy of the loaded bid (so a screen changing it can't change the stored one). Only bids loaded by fetchBids are known (there's no single-bid API). */
function findBid(bidId: string): BidDetail {
  const bid = loadedBidsById.get(bidId);
  if (!bid) {
    throw new Error('This bid could not be found.');
  }
  return { ...bid, lineItems: bid.lineItems.map((item) => ({ ...item })) };
}

function findEditableBid(bidId: string): BidDetail {
  const bid = findBid(bidId);
  if (!isBidEditable(bid.status)) {
    throw new Error(`This bid is ${bid.status.toLowerCase()} and can no longer be changed.`);
  }
  return bid;
}

function toBid({ id, bidNumber, projectName, total, status }: BidDetail): Bid {
  return { id, bidNumber, projectName, total, status };
}

function toBidLineItem(record: BidLineItemApiRecord): BidLineItem {
  return {
    id: record.id,
    description: record.itemDescription?.trim() ?? '',
    amount: toNumber(record.offerPrice) ?? 0,
    operatingTime: record.approximateOperatingTime ?? 0,
    operatingTimeType: record.approximateOperatingTimeType?.trim() ?? '',
  };
}

function toBidDetail(record: BidApiRecord): BidDetail {
  return {
    id: record.id,
    bidNumber: record.bidNumber?.trim() ?? '',
    projectName: record.projectName?.trim() ?? '',
    total: toNumber(record.totalAmount),
    status: record.status?.trim() ?? '',
    bidDate: timestampToLocalDate(record.createdDate),
    // Not in the API: Bid Details shows the project name instead.
    projectNumber: '',
    projectAddress: record.projectAddress?.trim() ?? '',
    description: htmlToPlainText(record.description ?? '') || record.notes?.trim() || '',
    // Inactive items have been removed in Salesforce.
    lineItems: (record.lineItems ?? []).filter((item) => item?.id && item.isActive !== false).map(toBidLineItem),
  };
}

/**
 * Fetches the account's bids (GET /bids?subcontractorId=…), newest first:
 * view=home returns the latest 5, view=all returns every one. `count` is the
 * account's total either way. A bid may not be tied to a project yet.
 */
export async function fetchBids(accountId: string, view: BidsView): Promise<AccountListResult<Bid>> {
  const data = await salesforceGet<BidsApiResponse>(SALESFORCE_BIDS_URL, { subcontractorId: accountId });
  if (!data.success) {
    throw new Error(data.message || LOAD_ERROR_MESSAGE);
  }

  const seen = new Set<string>();
  const records = (data.bids ?? []).filter((record) => {
    if (!record.id || seen.has(record.id)) {
      return false;
    }
    seen.add(record.id);
    return true;
  });
  // Newest first; ISO timestamps compare in date order.
  records.sort((a, b) => (b.createdDate ?? '').localeCompare(a.createdDate ?? ''));

  const bids = records.map((record) => {
    const bid = toBidDetail(record);
    loadedBidsById.set(bid.id, bid);
    return toBid(bid);
  });
  return { items: view === 'home' ? bids.slice(0, HOME_BIDS_LIMIT) : bids, count: bids.length };
}

/** Fetches one bid with its project, description and line items. */
export async function fetchBidDetail(_accountId: string, bidId: string): Promise<BidDetail> {
  return findBid(bidId);
}

/**
 * Adds a line item to an open bid in Salesforce (POST /bid-items/); returns
 * the updated bid, with the saved item last and the total updated. Throws an
 * Error with a message fit to show the user.
 */
export async function addBidLineItem(_accountId: string, bidId: string, item: NewBidLineItem): Promise<BidDetail> {
  findEditableBid(bidId);
  const description = item.description.trim();
  if (!description) {
    throw new Error('Please enter a description for this line item.');
  }
  if (!(item.operatingTime > 0)) {
    throw new Error('Please enter the approximate operating time.');
  }

  const payload: BidLineItemApiPayload = {
    bidId,
    itemDescription: description,
    approximateOperatingTime: item.operatingTime,
    approximateOperatingTimeType: item.operatingTimeType,
    offerPrice: item.amount,
  };
  const data = await salesforceSend<BidLineItemCreateApiResponse>(
    { method: 'post', url: SALESFORCE_BID_ITEMS_URL, data: payload },
    ADD_LINE_ITEM_ERROR_MESSAGE,
  );
  if (!data.success || !data.bidItem?.id) {
    throw new Error(data.message || ADD_LINE_ITEM_ERROR_MESSAGE);
  }

  // Until the bids reload, show the saved item and add it to Salesforce's total.
  const saved = toBidLineItem(data.bidItem);
  const lineItem: BidLineItem = {
    ...saved,
    description: saved.description || description,
    operatingTimeType: saved.operatingTimeType || item.operatingTimeType,
  };
  const loaded = loadedBidsById.get(bidId);
  if (loaded) {
    loadedBidsById.set(bidId, {
      ...loaded,
      lineItems: [...loaded.lineItems, lineItem],
      total: sumBidLineItems([{ amount: loaded.total ?? 0 }, lineItem]),
    });
  }
  return findBid(bidId);
}

/**
 * Marks a bid as complete (PATCH /bids/update/ with its id): Salesforce moves
 * it on to its next status, e.g. New → "Send Request", after which it can't
 * be changed. A bid needs at least one line item. Returns the updated bid,
 * with the status Salesforce now has; throws an Error with a message fit to
 * show the user (Salesforce's when it refuses).
 */
export async function completeBid(_accountId: string, bidId: string): Promise<BidDetail> {
  const bid = findBid(bidId);
  if (bid.lineItems.length === 0) {
    throw new Error('Add at least one line item before marking this bid as complete.');
  }
  const payload: BidStatusUpdateApiPayload = { bidId };
  const data = await salesforceSend<BidStatusUpdateApiResponse>(
    { method: 'patch', url: SALESFORCE_BID_UPDATE_URL, data: payload },
    COMPLETE_ERROR_MESSAGE,
  );
  if (!data.success) {
    throw new Error(data.message || COMPLETE_ERROR_MESSAGE);
  }
  // Until the bids reload, show the status Salesforce now has.
  const loaded = loadedBidsById.get(bidId);
  if (loaded) {
    loadedBidsById.set(bidId, { ...loaded, status: data.updatedStatus?.trim() || COMPLETED_BID_STATUS });
  }
  return findBid(bidId);
}
