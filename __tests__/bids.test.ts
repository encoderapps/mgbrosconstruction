import { SALESFORCE_BID_ITEMS_URL, SALESFORCE_BID_UPDATE_URL, SALESFORCE_BIDS_URL } from '../src/constants/config';
import {
  addBidLineItem,
  completeBid,
  fetchBidDetail,
  fetchBids,
  HOME_BIDS_LIMIT,
} from '../src/services/bidService';
import { salesforceGet, salesforceSend } from '../src/services/salesforceClient';
import {
  BidApiRecord,
  BidLineItemApiPayload,
  BidLineItemCreateApiResponse,
  BidsApiResponse,
  BidStatusUpdateApiResponse,
} from '../src/types';
import { bidStatusTone, isBidEditable, sumBidLineItems } from '../src/utils/bidStatus';
import { parseCurrencyInput, sanitizeCurrencyInput } from '../src/utils/currencyInput';

jest.mock('../src/services/salesforceClient', () => ({
  salesforceGet: jest.fn(),
  salesforceSend: jest.fn(),
}));

const mockedGet = salesforceGet as jest.MockedFunction<typeof salesforceGet>;
const mockedSend = salesforceSend as unknown as jest.MockedFunction<
  (...args: Parameters<typeof salesforceSend>) => Promise<BidStatusUpdateApiResponse | BidLineItemCreateApiResponse>
>;

let nextItemNumber = 1;

/** Salesforce saving each new line item and updating each status, as the sandbox does. */
function saveRequestsLikeSalesforce(): void {
  mockedSend.mockImplementation(async ({ url, data }) => {
    if (url === SALESFORCE_BID_ITEMS_URL) {
      const item = data as BidLineItemApiPayload;
      return {
        success: true,
        message: 'Bid line item created successfully.',
        bidItem: {
          id: `a6P-${nextItemNumber}`,
          itemNumber: `BIDI-${nextItemNumber++}`,
          bidId: item.bidId,
          itemId: 'a6VQL000003mn6L2AQ',
          itemDescription: item.itemDescription,
          offerPrice: item.offerPrice,
          approximateOperatingTime: item.approximateOperatingTime,
          approximateOperatingTimeType: item.approximateOperatingTimeType,
          isActive: true,
          isApproved: false,
        },
      };
    }
    return { success: true, message: 'Bid status updated successfully.', updatedStatus: 'Send Request' };
  });
}

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

const BIDS: BidApiRecord[] = [
  bid('a6QQL000000njlZ2AQ', '2026-10-02T12:57:10.000Z', {
    bidNumber: 'BID-00000001',
    totalAmount: 1250.5,
    projectAddress: ' 666 Post Street, San Francisco, California, 94109, United States ',
    description: '<p><a href="https://example.com">100 Congress Avenue, Austin, TX, 78701</a></p>',
  }),
  bid('bid-notes', '2026-09-15T09:00:00.000Z', { notes: ' Rough-in only ', totalAmount: '0.00' }),
  bid('bid-a2', '2026-10-05T09:00:00.000Z'),
  bid('bid-won', '2026-09-01T09:00:00.000Z', { status: 'Won' }),
  bid('bid-b1', '2026-10-04T09:00:00.000Z', { projectId: PROJECT_B, projectName: 'Kitchen Remodel' }),
  bid('bid-b2', '2026-10-03T09:00:00.000Z', { projectId: PROJECT_B }),
  bid('bid-b3', '2026-10-01T09:00:00.000Z', { projectId: PROJECT_B }),
  // Not tied to a project yet, as the sandbox sends some bids.
  bid('bid-b4', '2026-09-30T09:00:00.000Z', { projectId: null, projectName: null }),
  // Trimmed from the sandbox response for BID-00000010.
  bid('a6QQL000000rDK52AM', '2026-11-06T06:46:53.000Z', {
    bidNumber: 'BID-00000010',
    status: 'New',
    totalAmount: 57000,
    lineItems: [
      {
        id: 'a6PQL00000ANGEP2A5',
        itemNumber: 'BIDI-000010',
        itemId: 'a6VQL000003mn6L2AQ',
        itemDescription: 'HVAC installation and maintenance',
        offerPrice: 25000,
        approximateOperatingTime: 5,
        approximateOperatingTimeType: 'Day_s',
        operatingTimeDays: 5,
        status: 'Draft',
        isActive: true,
      },
      {
        id: 'a6PQL00000ANIeP2AX',
        itemNumber: 'BIDI-000015',
        itemDescription: 'Commercial HVAC repair and servicing',
        offerPrice: 32000,
        approximateOperatingTime: 10,
        approximateOperatingTimeType: 'Week_s',
        operatingTimeDays: 70,
        isActive: true,
      },
      { id: 'inactive', itemDescription: 'Removed', offerPrice: 1, isActive: false },
    ],
  }),
];

function respondWith(bids: BidApiRecord[] = BIDS, response?: BidsApiResponse): void {
  mockedGet.mockResolvedValue(response ?? { success: true, totalRecords: bids.length, bids });
}

beforeEach(() => {
  respondWith();
});

afterEach(() => {
  mockedGet.mockReset();
  mockedSend.mockReset();
});

describe('fetchBids', () => {
  it("loads the account's bids by subcontractor, newest first, as list rows", async () => {
    const result = await fetchBids(ACCOUNT, 'all');

    expect(mockedGet).toHaveBeenCalledTimes(1);
    expect(mockedGet).toHaveBeenCalledWith(SALESFORCE_BIDS_URL, { subcontractorId: ACCOUNT });
    expect(result.count).toBe(9);
    expect(result.items.map((row) => row.id)).toEqual([
      'a6QQL000000rDK52AM',
      'bid-a2',
      'bid-b1',
      'bid-b2',
      'a6QQL000000njlZ2AQ',
      'bid-b3',
      'bid-b4',
      'bid-notes',
      'bid-won',
    ]);
    expect(result.items[4]).toEqual({
      id: 'a6QQL000000njlZ2AQ',
      bidNumber: 'BID-00000001',
      projectName: '[TEST] 666 Post Street, San Francisco, CA, 94109',
      total: 1250.5,
      status: 'New',
    });
    // A bid without a project has an empty project name.
    expect(result.items[6]).toMatchObject({ id: 'bid-b4', projectName: '' });
  });

  it('previews the latest bids on Home, with the account total as the count', async () => {
    const result = await fetchBids(ACCOUNT, 'home');

    expect(result.items).toHaveLength(HOME_BIDS_LIMIT);
    expect(result.count).toBe(9);
  });

  it('throws the API message when the bids fail to load', async () => {
    respondWith(BIDS, { success: false, message: 'Invalid subcontractorId.', bids: null });

    await expect(fetchBids(ACCOUNT, 'all')).rejects.toThrow('Invalid subcontractorId.');
  });
});

describe('fetchBidDetail', () => {
  it('returns a copy, so changing it does not change the stored bid', async () => {
    await fetchBids(ACCOUNT, 'all');
    const detail = await fetchBidDetail(ACCOUNT, 'bid-b4');
    detail.status = 'Lost';
    detail.lineItems.push({ id: 'x', description: 'X', amount: 1, operatingTime: 1, operatingTimeType: 'Day_s' });

    const again = await fetchBidDetail(ACCOUNT, 'bid-b4');
    expect(again.status).toBe('New');
    expect(again.lineItems).toEqual([]);
  });

  it('returns a loaded bid with its date, project, address, plain-text description and total', async () => {
    await fetchBids(ACCOUNT, 'all');

    const detail = await fetchBidDetail(ACCOUNT, 'a6QQL000000njlZ2AQ');

    expect(detail).toMatchObject({
      bidNumber: 'BID-00000001',
      bidDate: '2026-10-02',
      projectName: '[TEST] 666 Post Street, San Francisco, CA, 94109',
      projectAddress: '666 Post Street, San Francisco, California, 94109, United States',
      description: '100 Congress Avenue, Austin, TX, 78701',
      total: 1250.5,
      status: 'New',
      lineItems: [],
    });
  });

  it('falls back to the notes for the description, and reads a total sent as a string', async () => {
    await fetchBids(ACCOUNT, 'all');

    const detail = await fetchBidDetail(ACCOUNT, 'bid-notes');

    expect(detail).toMatchObject({ description: 'Rough-in only', total: 0, projectAddress: '' });
  });

  it('shows the line items saved in Salesforce, leaving out inactive ones, with its total', async () => {
    await fetchBids(ACCOUNT, 'all');

    const detail = await fetchBidDetail(ACCOUNT, 'a6QQL000000rDK52AM');
    expect(detail.total).toBe(57000);
    expect(detail.lineItems).toEqual([
      {
        id: 'a6PQL00000ANGEP2A5',
        description: 'HVAC installation and maintenance',
        amount: 25000,
        operatingTime: 5,
        operatingTimeType: 'Day_s',
      },
      {
        id: 'a6PQL00000ANIeP2AX',
        description: 'Commercial HVAC repair and servicing',
        amount: 32000,
        operatingTime: 10,
        operatingTimeType: 'Week_s',
      },
    ]);
  });

  it('rejects an unknown bid', async () => {
    await expect(fetchBidDetail(ACCOUNT, 'bid-9999')).rejects.toThrow('This bid could not be found.');
  });
});

describe('addBidLineItem', () => {
  beforeEach(saveRequestsLikeSalesforce);

  it('saves the line item in Salesforce and shows it last, adding it to the total', async () => {
    await fetchBids(ACCOUNT, 'all');

    const updated = await addBidLineItem(ACCOUNT, 'a6QQL000000rDK52AM', {
      description: '  HVAC 222 installation and maintenance ',
      amount: 25000,
      operatingTime: 10,
      operatingTimeType: 'Week_s',
    });

    expect(mockedSend).toHaveBeenCalledWith(
      {
        method: 'post',
        url: SALESFORCE_BID_ITEMS_URL,
        data: {
          bidId: 'a6QQL000000rDK52AM',
          itemDescription: 'HVAC 222 installation and maintenance',
          approximateOperatingTime: 10,
          approximateOperatingTimeType: 'Week_s',
          offerPrice: 25000,
        },
      },
      expect.any(String),
    );
    expect(updated.lineItems.map((item) => item.description)).toEqual([
      'HVAC installation and maintenance',
      'Commercial HVAC repair and servicing',
      'HVAC 222 installation and maintenance',
    ]);
    expect(updated.lineItems[2]).toMatchObject({ amount: 25000, operatingTime: 10, operatingTimeType: 'Week_s' });
    expect(updated.total).toBe(82000);
    // Still there when Bid Details reloads, until the bids are fetched again.
    await expect(fetchBidDetail(ACCOUNT, 'a6QQL000000rDK52AM')).resolves.toMatchObject({ total: 82000 });
  });

  it('starts the total from 0 on a bid that has none', async () => {
    await fetchBids(ACCOUNT, 'all');

    const updated = await addBidLineItem(ACCOUNT, 'bid-b1', {
      description: 'Permit fees',
      amount: 450.25,
      operatingTime: 2,
      operatingTimeType: 'Day_s',
    });

    expect(updated.total).toBe(450.25);
  });

  it("throws Salesforce's message when it refuses the item, adding nothing", async () => {
    mockedSend.mockResolvedValue({ success: false, message: 'Invalid bidId.' });
    await fetchBids(ACCOUNT, 'all');

    await expect(
      addBidLineItem(ACCOUNT, 'bid-b2', { description: 'Labor', amount: 100, operatingTime: 5, operatingTimeType: 'Day_s' }),
    ).rejects.toThrow('Invalid bidId.');
    await expect(fetchBidDetail(ACCOUNT, 'bid-b2')).resolves.toMatchObject({ lineItems: [] });
  });

  it('checks the description and operating time, and refuses a closed bid, without calling Salesforce', async () => {
    await fetchBids(ACCOUNT, 'all');
    const item = { description: 'Labor', amount: 100, operatingTime: 5, operatingTimeType: 'Day_s' };

    await expect(addBidLineItem(ACCOUNT, 'bid-b2', { ...item, description: ' ' })).rejects.toThrow('description');
    await expect(addBidLineItem(ACCOUNT, 'bid-b2', { ...item, operatingTime: 0 })).rejects.toThrow('operating time');
    await expect(addBidLineItem(ACCOUNT, 'bid-won', item)).rejects.toThrow('This bid is won and can no longer be changed.');
    expect(mockedSend).not.toHaveBeenCalled();
  });
});

describe('completeBid', () => {
  beforeEach(saveRequestsLikeSalesforce);

  it('sends the bid to Salesforce, which changes it to "Send Request", after which it can no longer be changed', async () => {
    mockedSend.mockResolvedValue({
      success: true,
      message: 'Bid status changed to Send Request successfully.',
      bidId: 'a6QQL000000rDK52AM',
      bidNumber: 'BID-00000010',
      previousStatus: 'New',
      updatedStatus: 'Send Request',
    });
    await fetchBids(ACCOUNT, 'all');

    const completed = await completeBid(ACCOUNT, 'a6QQL000000rDK52AM');

    expect(mockedSend).toHaveBeenCalledWith(
      { method: 'patch', url: SALESFORCE_BID_UPDATE_URL, data: { bidId: 'a6QQL000000rDK52AM' } },
      expect.any(String),
    );
    expect(completed.status).toBe('Send Request');
    expect(isBidEditable(completed.status)).toBe(false);
    // Bid Details shows the new status when it reloads.
    await expect(fetchBidDetail(ACCOUNT, 'a6QQL000000rDK52AM')).resolves.toMatchObject({ status: 'Send Request' });
    await expect(
      addBidLineItem(ACCOUNT, 'a6QQL000000rDK52AM', {
        description: 'Late item',
        amount: 5,
        operatingTime: 5,
        operatingTimeType: 'Day_s',
      }),
    ).rejects.toThrow('can no longer be changed');
  });

  it('needs at least one line item, without calling Salesforce', async () => {
    await fetchBids(ACCOUNT, 'all');

    await expect(completeBid(ACCOUNT, 'bid-b3')).rejects.toThrow('Add at least one line item');
    expect(mockedSend).not.toHaveBeenCalled();
  });

  it("throws Salesforce's message when it refuses, leaving the status as it was", async () => {
    mockedSend.mockResolvedValue({ success: false, message: 'This bid is already completed.' });
    await fetchBids(ACCOUNT, 'all');

    await expect(completeBid(ACCOUNT, 'a6QQL000000rDK52AM')).rejects.toThrow('This bid is already completed.');
    await expect(fetchBidDetail(ACCOUNT, 'a6QQL000000rDK52AM')).resolves.toMatchObject({ status: 'New' });
  });

  it("shows Salesforce's latest status when the bids reload", async () => {
    await fetchBids(ACCOUNT, 'all');
    respondWith(BIDS.map((record) => (record.id === 'bid-a2' ? { ...record, status: 'Won' } : record)));
    await fetchBids(ACCOUNT, 'all');

    await expect(fetchBidDetail(ACCOUNT, 'bid-a2')).resolves.toMatchObject({ status: 'Won' });
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
    expect(['Send Request', 'Completed', 'won', 'LOST'].map(isBidEditable)).toEqual([false, false, false, false]);
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
