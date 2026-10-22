import { SALESFORCE_BIDS_URL } from '../constants/config';
import { BidApiRecord, BidsApiResponse } from '../types';
import { Bid, BidDetail, BidLineItem, BidsView, NewBidLineItem } from '../types/bid';
import { AccountListResult } from '../types/list';
import { isBidEditable, sumBidLineItems } from '../utils/bidStatus';
import { timestampToLocalDate } from '../utils/dateValidation';
import { salesforceGet } from './salesforceClient';
import { fetchSubcontractorProjects } from './subcontractorProjectService';

/** How many bids the Home screen's card previews. */
export const HOME_BIDS_LIMIT = 5;

const COMPLETED_STATUS = 'Completed';

const LOAD_ERROR_MESSAGE = 'Unable to load bids.';

/** The bids as fetchBids last loaded them from Salesforce, by Id, for Bid Details. */
const loadedBidsById = new Map<string, BidDetail>();

/*
 * TODO: there's no API yet for a bid's line items or for completing it, so
 * those are kept here, in memory (until the app restarts), and laid over the
 * loaded bid. Replace them with the Salesforce calls once the endpoints ship;
 * the function signatures and errors are already what the screens expect.
 */
interface LocalChanges {
  lineItems: BidLineItem[];
  completed: boolean;
}
const localChangesById = new Map<string, LocalChanges>();
let nextLineItemNumber = 1;

function getLocalChanges(bidId: string): LocalChanges {
  let changes = localChangesById.get(bidId);
  if (!changes) {
    changes = { lineItems: [], completed: false };
    localChangesById.set(bidId, changes);
  }
  return changes;
}

/**
 * A copy of the loaded bid with the in-app line items and completion laid
 * over it. The status is Salesforce's unless the bid was completed here. The
 * total is that of the line items added here, or null (the API sends none).
 */
function withLocalChanges(bid: BidDetail): BidDetail {
  const changes = localChangesById.get(bid.id);
  const lineItems = changes?.lineItems ?? bid.lineItems;
  return {
    ...bid,
    projectAddress: bid.projectAddress && { ...bid.projectAddress },
    lineItems: lineItems.map((item) => ({ ...item })),
    total: lineItems.length > 0 ? sumBidLineItems(lineItems) : bid.total,
    status: changes?.completed ? COMPLETED_STATUS : bid.status,
  };
}

/** The bid as Bid Details shows it. Only bids loaded by fetchBids are known (there's no single-bid API). */
function findBid(bidId: string): BidDetail {
  const bid = loadedBidsById.get(bidId);
  if (!bid) {
    throw new Error('This bid could not be found.');
  }
  return withLocalChanges(bid);
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

function toBidDetail(record: BidApiRecord): BidDetail {
  return {
    id: record.id,
    bidNumber: record.bidNumber?.trim() ?? '',
    projectName: record.projectName?.trim() ?? '',
    // The API doesn't send an amount.
    total: null,
    status: record.status?.trim() ?? '',
    bidDate: timestampToLocalDate(record.createdDate),
    // Not in the API: Bid Details shows the project name and no address.
    projectNumber: '',
    projectAddress: null,
    description: record.notes?.trim() ?? '',
    lineItems: [],
  };
}

/** One project's bids (GET /bids?projectId=…). */
async function fetchProjectBids(projectId: string): Promise<BidApiRecord[]> {
  const data = await salesforceGet<BidsApiResponse>(SALESFORCE_BIDS_URL, { projectId });
  if (!data.success) {
    throw new Error(data.message || LOAD_ERROR_MESSAGE);
  }
  return data.bids ?? [];
}

/**
 * Fetches the account's bids, newest first: view=home returns the latest 5,
 * view=all returns every one. `count` is the account's total either way.
 *
 * The bids API is per project, so this loads the account's projects and then
 * each project's bids.
 */
export async function fetchBids(accountId: string, view: BidsView): Promise<AccountListResult<Bid>> {
  const { items: projects } = await fetchSubcontractorProjects(accountId, 'all');
  const perProject = await Promise.all(projects.map((project) => fetchProjectBids(project.id)));

  const seen = new Set<string>();
  const records = perProject.flat().filter((record) => {
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
    return toBid(withLocalChanges(bid));
  });
  return { items: view === 'home' ? bids.slice(0, HOME_BIDS_LIMIT) : bids, count: bids.length };
}

/** Fetches one bid with its project, description and line items. */
export async function fetchBidDetail(_accountId: string, bidId: string): Promise<BidDetail> {
  return findBid(bidId);
}

/** Adds a line item to an open bid; returns the updated bid (with its new total). */
export async function addBidLineItem(_accountId: string, bidId: string, item: NewBidLineItem): Promise<BidDetail> {
  findEditableBid(bidId);
  getLocalChanges(bidId).lineItems.push({
    id: `${bidId}-new-${nextLineItemNumber++}`,
    description: item.description.trim(),
    amount: item.amount,
  });
  return findBid(bidId);
}

/** Removes a line item from an open bid; returns the updated bid. */
export async function deleteBidLineItem(_accountId: string, bidId: string, lineItemId: string): Promise<BidDetail> {
  findEditableBid(bidId);
  const changes = getLocalChanges(bidId);
  if (!changes.lineItems.some((item) => item.id === lineItemId)) {
    throw new Error('This line item could not be found.');
  }
  changes.lineItems = changes.lineItems.filter((item) => item.id !== lineItemId);
  return findBid(bidId);
}

/** Marks an open bid as complete, after which it can't be changed. A bid needs at least one line item. */
export async function completeBid(_accountId: string, bidId: string): Promise<BidDetail> {
  const bid = findEditableBid(bidId);
  if (bid.lineItems.length === 0) {
    throw new Error('Add at least one line item before marking this bid as complete.');
  }
  getLocalChanges(bidId).completed = true;
  return findBid(bidId);
}
