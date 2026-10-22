import { SALESFORCE_BIDS_URL } from '../src/constants/config';
import {
  addBidLineItem,
  completeBid,
  deleteBidLineItem,
  fetchBidDetail,
  fetchBids,
  HOME_BIDS_LIMIT,
} from '../src/services/bidService';
import { salesforceGet } from '../src/services/salesforceClient';
import {
  BidApiRecord,
  BidsApiResponse,
  SubcontractorProjectApiRecord,
  SubcontractorProjectsApiResponse,
} from '../src/types';
import { bidStatusTone, isBidEditable, sumBidLineItems } from '../src/utils/bidStatus';
import { parseCurrencyInput, sanitizeCurrencyInput } from '../src/utils/currencyInput';

jest.mock('../src/services/salesforceClient', () => ({
  salesforceGet: jest.fn(),
}));

const mockedGet = salesforceGet as jest.MockedFunction<typeof salesforceGet>;

const ACCOUNT = '001QL00002caUn6YAE';
const PROJECT_A = 'a6eQL000000LXH7YAO';
const PROJECT_B = 'a6eQL000000LXH8YAO';

// Shaped like the sandbox response.
function bid(id: string, createdDate: string, overrides: Partial<BidApiRecord> = {}): BidApiRecord {
  return {
    id,
    bidNumber: `BID-${id}`,
    status: 'New',
    projectId: PROJECT_A,
    projectName: '[TEST] 666 Post Street, San Francisco, CA, 94109',
    notes: null,
    createdDate,
    totalBidItems: 2,
    approvedBidItems: 0,
    approvalPercentage: 0,
    signed: false,
    ...overrides,
  };
}

const BIDS_BY_PROJECT: Record<string, BidApiRecord[]> = {
  [PROJECT_A]: [
    bid('a6QQL000000njlZ2AQ', '2026-10-02T12:57:10.000Z', { bidNumber: 'BID-00000001', notes: ' Rough-in only ' }),
    bid('bid-a2', '2026-10-05T09:00:00.000Z'),
    bid('bid-won', '2026-09-01T09:00:00.000Z', { status: 'Won' }),
  ],
  [PROJECT_B]: [
    bid('bid-b1', '2026-10-04T09:00:00.000Z', { projectId: PROJECT_B, projectName: 'Kitchen Remodel' }),
    bid('bid-b2', '2026-10-03T09:00:00.000Z', { projectId: PROJECT_B }),
    bid('bid-b3', '2026-10-01T09:00:00.000Z', { projectId: PROJECT_B }),
    bid('bid-b4', '2026-09-30T09:00:00.000Z', { projectId: PROJECT_B }),
  ],
};

function respondWith(bidsByProject: Record<string, BidApiRecord[]> = BIDS_BY_PROJECT, bidsResponse?: BidsApiResponse): void {
  mockedGet.mockImplementation(async (url, params) => {
    if (url === SALESFORCE_BIDS_URL) {
      return bidsResponse ?? { success: true, bids: bidsByProject[params.projectId] ?? [] };
    }
    const projects: SubcontractorProjectsApiResponse = {
      success: true,
      count: 2,
      projects: Object.keys(bidsByProject).map((id) => ({ id, name: id, jobAddress: null }) as SubcontractorProjectApiRecord),
    };
    return projects;
  });
}

beforeEach(() => {
  respondWith();
});

afterEach(() => {
  mockedGet.mockReset();
});

describe('fetchBids', () => {
  it("loads each of the account's projects' bids, newest first, as list rows without an amount", async () => {
    const result = await fetchBids(ACCOUNT, 'all');

    expect(mockedGet).toHaveBeenCalledWith(SALESFORCE_BIDS_URL, { projectId: PROJECT_A });
    expect(mockedGet).toHaveBeenCalledWith(SALESFORCE_BIDS_URL, { projectId: PROJECT_B });
    expect(result.count).toBe(7);
    expect(result.items.map((row) => row.id)).toEqual([
      'bid-a2',
      'bid-b1',
      'bid-b2',
      'a6QQL000000njlZ2AQ',
      'bid-b3',
      'bid-b4',
      'bid-won',
    ]);
    expect(result.items[3]).toEqual({
      id: 'a6QQL000000njlZ2AQ',
      bidNumber: 'BID-00000001',
      projectName: '[TEST] 666 Post Street, San Francisco, CA, 94109',
      total: null,
      status: 'New',
    });
  });

  it('previews the latest bids on Home, with the account total as the count', async () => {
    const result = await fetchBids(ACCOUNT, 'home');

    expect(result.items).toHaveLength(HOME_BIDS_LIMIT);
    expect(result.count).toBe(7);
  });

  it('throws the API message when a project fails to load', async () => {
    respondWith(BIDS_BY_PROJECT, { success: false, message: 'Invalid projectId.', bids: null });

    await expect(fetchBids(ACCOUNT, 'all')).rejects.toThrow('Invalid projectId.');
  });
});

describe('fetchBidDetail', () => {
  it('returns a copy, so changing it does not change the stored bid', async () => {
    await fetchBids(ACCOUNT, 'all');
    const detail = await fetchBidDetail(ACCOUNT, 'bid-b4');
    detail.status = 'Lost';
    detail.lineItems.push({ id: 'x', description: 'X', amount: 1 });

    const again = await fetchBidDetail(ACCOUNT, 'bid-b4');
    expect(again.status).toBe('New');
    expect(again.lineItems).toEqual([]);
  });

  it('returns a loaded bid with its date, project and notes, and no line items yet', async () => {
    await fetchBids(ACCOUNT, 'all');

    const detail = await fetchBidDetail(ACCOUNT, 'a6QQL000000njlZ2AQ');

    expect(detail).toMatchObject({
      bidNumber: 'BID-00000001',
      bidDate: '2026-10-02',
      projectName: '[TEST] 666 Post Street, San Francisco, CA, 94109',
      description: 'Rough-in only',
      status: 'New',
      lineItems: [],
    });
  });

  it('rejects an unknown bid', async () => {
    await expect(fetchBidDetail(ACCOUNT, 'bid-9999')).rejects.toThrow('This bid could not be found.');
  });
});

describe('line items and completing (in the app until the API exists)', () => {
  it('adds and removes items, updating the total, and keeps them when the bids reload', async () => {
    await fetchBids(ACCOUNT, 'all');

    const added = await addBidLineItem(ACCOUNT, 'bid-b1', { description: '  Permit fees  ', amount: 450.25 });
    expect(added.lineItems).toEqual([expect.objectContaining({ description: 'Permit fees', amount: 450.25 })]);
    expect(added.total).toBe(450.25);

    const { items } = await fetchBids(ACCOUNT, 'all');
    expect(items.find((row) => row.id === 'bid-b1')?.total).toBe(450.25);

    const removed = await deleteBidLineItem(ACCOUNT, 'bid-b1', added.lineItems[0].id);
    expect(removed.lineItems).toEqual([]);
    // Back to no known amount, as the API sends none.
    expect(removed.total).toBeNull();
  });

  it("shows Salesforce's latest status on reload, keeping the line items added in the app", async () => {
    await fetchBids(ACCOUNT, 'all');
    await addBidLineItem(ACCOUNT, 'bid-a2', { description: 'Labor', amount: 100 });

    respondWith({
      ...BIDS_BY_PROJECT,
      [PROJECT_A]: BIDS_BY_PROJECT[PROJECT_A].map((record) =>
        record.id === 'bid-a2' ? { ...record, status: 'Won' } : record,
      ),
    });
    await fetchBids(ACCOUNT, 'all');

    const detail = await fetchBidDetail(ACCOUNT, 'bid-a2');
    expect(detail.status).toBe('Won');
    expect(detail.lineItems).toEqual([expect.objectContaining({ description: 'Labor', amount: 100 })]);
  });

  it('rejects an unknown line item', async () => {
    await fetchBids(ACCOUNT, 'all');

    await expect(deleteBidLineItem(ACCOUNT, 'bid-b2', 'missing')).rejects.toThrow('This line item could not be found.');
  });

  it('refuses to change a closed bid', async () => {
    await fetchBids(ACCOUNT, 'all');

    await expect(addBidLineItem(ACCOUNT, 'bid-won', { description: 'Extra', amount: 10 })).rejects.toThrow(
      'This bid is won and can no longer be changed.',
    );
  });

  it('completes a bid with line items, after which it can no longer be changed', async () => {
    await fetchBids(ACCOUNT, 'all');
    await expect(completeBid(ACCOUNT, 'bid-b3')).rejects.toThrow('Add at least one line item');

    await addBidLineItem(ACCOUNT, 'bid-b3', { description: 'Labor', amount: 100 });
    const completed = await completeBid(ACCOUNT, 'bid-b3');

    expect(completed.status).toBe('Completed');
    await expect(addBidLineItem(ACCOUNT, 'bid-b3', { description: 'Late item', amount: 5 })).rejects.toThrow(
      'can no longer be changed',
    );
    // Stays completed when the bids reload.
    const { items } = await fetchBids(ACCOUNT, 'all');
    expect(items.find((row) => row.id === 'bid-b3')?.status).toBe('Completed');
  });
});

describe('bidStatusTone / isBidEditable', () => {
  it('colours each known status, ignoring case and spaces', () => {
    expect(bidStatusTone('Submitted')).toBe('info');
    expect(bidStatusTone('Requested')).toBe('warning');
    expect(bidStatusTone(' PENDING ')).toBe('warning');
    expect(bidStatusTone('won')).toBe('success');
    expect(bidStatusTone('Completed')).toBe('success');
    expect(bidStatusTone('Draft')).toBe('neutral');
    expect(bidStatusTone('Lost')).toBe('danger');
    expect(bidStatusTone('Withdrawn')).toBe('neutral');
  });

  it('closes a bid once it is completed, won or lost', () => {
    expect(['Draft', 'Submitted', 'Pending', 'Requested'].map(isBidEditable)).toEqual([true, true, true, true]);
    expect(['Completed', 'won', 'LOST'].map(isBidEditable)).toEqual([false, false, false]);
  });
});

describe('sumBidLineItems', () => {
  it('adds amounts without floating-point error', () => {
    expect(sumBidLineItems([{ amount: 0.1 }, { amount: 0.2 }])).toBe(0.3);
    expect(sumBidLineItems([])).toBe(0);
  });
});

describe('currency input', () => {
  it('keeps digits and one decimal point with at most 2 decimals', () => {
    expect(sanitizeCurrencyInput('1,250.509')).toBe('1250.50');
    expect(sanitizeCurrencyInput('$007.5')).toBe('7.5');
    expect(sanitizeCurrencyInput('.5')).toBe('0.5');
    expect(sanitizeCurrencyInput('1.2.3')).toBe('1.23');
    expect(sanitizeCurrencyInput('abc')).toBe('');
  });

  it('parses a positive amount within the limit, else null', () => {
    expect(parseCurrencyInput('1250.5')).toBe(1250.5);
    expect(parseCurrencyInput('99999999.99')).toBe(99999999.99);
    expect(parseCurrencyInput('100000000')).toBeNull();
    expect(parseCurrencyInput('0')).toBeNull();
    expect(parseCurrencyInput('')).toBeNull();
    expect(parseCurrencyInput('12.345')).toBeNull();
  });
});
