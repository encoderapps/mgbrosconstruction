import { MOCK_BIDS } from '../constants/mockBids';
import { Bid, BidDetail, BidLineItem, BidsView, NewBidLineItem } from '../types/bid';
import { AccountListResult } from '../types/list';
import { isBidEditable, sumBidLineItems } from '../utils/bidStatus';

/** How many bids the Home screen's card previews. */
export const HOME_BIDS_LIMIT = 5;

const COMPLETED_STATUS = 'Completed';

/*
 * TODO: there's no bids API yet, so these functions read and change an
 * in-memory copy of MOCK_BIDS that lasts until the app restarts. Replace each
 * body with its Salesforce call (salesforceGet / salesforceSend, as in
 * purchaseOrderService and paymentTermsService) once the endpoints ship. The
 * signatures and errors are already what the screens expect.
 */
const bidsById = new Map<string, BidDetail>(MOCK_BIDS.map((bid) => [bid.id, copyBid(bid)]));
let nextLineItemNumber = 1;

function copyBid(bid: BidDetail): BidDetail {
  return {
    ...bid,
    projectAddress: bid.projectAddress && { ...bid.projectAddress },
    lineItems: bid.lineItems.map((item) => ({ ...item })),
  };
}

function findBid(bidId: string): BidDetail {
  const bid = bidsById.get(bidId);
  if (!bid) {
    throw new Error('This bid could not be found.');
  }
  return bid;
}

function findEditableBid(bidId: string): BidDetail {
  const bid = findBid(bidId);
  if (!isBidEditable(bid.status)) {
    throw new Error(`This bid is ${bid.status.toLowerCase()} and can no longer be changed.`);
  }
  return bid;
}

/** Stores a changed bid with its total recalculated, and returns a copy for the caller. */
function saveBid(bid: BidDetail): BidDetail {
  const saved = { ...bid, total: sumBidLineItems(bid.lineItems) };
  bidsById.set(saved.id, saved);
  return copyBid(saved);
}

function toBid({ id, bidNumber, projectName, total, status }: BidDetail): Bid {
  return { id, bidNumber, projectName, total, status };
}

/**
 * Fetches the account's bids, newest first: view=home returns the latest 5,
 * view=all returns every one. `count` is the account's total either way.
 */
export async function fetchBids(_accountId: string, view: BidsView): Promise<AccountListResult<Bid>> {
  const bids = [...bidsById.values()].map(toBid);
  return { items: view === 'home' ? bids.slice(0, HOME_BIDS_LIMIT) : bids, count: bids.length };
}

/** Fetches one bid with its project, description and line items. */
export async function fetchBidDetail(_accountId: string, bidId: string): Promise<BidDetail> {
  return copyBid(findBid(bidId));
}

/** Adds a line item to an open bid; returns the updated bid (with its new total). */
export async function addBidLineItem(_accountId: string, bidId: string, item: NewBidLineItem): Promise<BidDetail> {
  const bid = findEditableBid(bidId);
  const lineItem: BidLineItem = {
    id: `${bidId}-new-${nextLineItemNumber++}`,
    description: item.description.trim(),
    amount: item.amount,
  };
  return saveBid({ ...bid, lineItems: [...bid.lineItems, lineItem] });
}

/** Removes a line item from an open bid; returns the updated bid. */
export async function deleteBidLineItem(_accountId: string, bidId: string, lineItemId: string): Promise<BidDetail> {
  const bid = findEditableBid(bidId);
  if (!bid.lineItems.some((item) => item.id === lineItemId)) {
    throw new Error('This line item could not be found.');
  }
  return saveBid({ ...bid, lineItems: bid.lineItems.filter((item) => item.id !== lineItemId) });
}

/** Marks an open bid as complete, after which it can't be changed. A bid needs at least one line item. */
export async function completeBid(_accountId: string, bidId: string): Promise<BidDetail> {
  const bid = findEditableBid(bidId);
  if (bid.lineItems.length === 0) {
    throw new Error('Add at least one line item before marking this bid as complete.');
  }
  return saveBid({ ...bid, status: COMPLETED_STATUS });
}
