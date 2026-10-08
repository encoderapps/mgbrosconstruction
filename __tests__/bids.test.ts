import { MOCK_BIDS } from '../src/constants/mockBids';
import {
  addBidLineItem,
  completeBid,
  deleteBidLineItem,
  fetchBidDetail,
  fetchBids,
  HOME_BIDS_LIMIT,
} from '../src/services/bidService';
import { bidStatusTone, isBidEditable, sumBidLineItems } from '../src/utils/bidStatus';
import { parseCurrencyInput, sanitizeCurrencyInput } from '../src/utils/currencyInput';

const ACCOUNT = '001ACCOUNT';

// The service keeps one in-memory store for this test file, so each test changes its own bid.
const SUBMITTED_BID = 'bid-2001';
const WON_BID = 'bid-2002';
const PENDING_BID = 'bid-2003';
const DRAFT_BID = 'bid-2004';
const COMPLETABLE_BID = 'bid-2006';
const EMPTIED_BID = 'bid-2010';

describe('mock bids', () => {
  it('have unique ids and numbers, and line items that add up to each total', () => {
    expect(new Set(MOCK_BIDS.map((bid) => bid.id)).size).toBe(MOCK_BIDS.length);
    expect(new Set(MOCK_BIDS.map((bid) => bid.bidNumber)).size).toBe(MOCK_BIDS.length);
    for (const bid of MOCK_BIDS) {
      expect(sumBidLineItems(bid.lineItems)).toBe(bid.total);
    }
  });
});

describe('fetchBids', () => {
  it('previews the latest bids on Home, with the account total as the count', async () => {
    const result = await fetchBids(ACCOUNT, 'home');

    expect(result.items.map((bid) => bid.bidNumber)).toEqual(['BID-2001', 'BID-2002', 'BID-2003', 'BID-2004', 'BID-2005']);
    expect(result.items).toHaveLength(HOME_BIDS_LIMIT);
    expect(result.count).toBe(MOCK_BIDS.length);
  });

  it('returns every bid for View All, as list rows only', async () => {
    const result = await fetchBids(ACCOUNT, 'all');

    expect(result.items).toHaveLength(25);
    expect(result.items[0]).toEqual({
      id: SUBMITTED_BID,
      bidNumber: 'BID-2001',
      projectName: 'HVAC Install',
      total: 14200,
      status: 'Submitted',
    });
  });
});

describe('fetchBidDetail', () => {
  it('returns the bid with its project and line items', async () => {
    const bid = await fetchBidDetail(ACCOUNT, SUBMITTED_BID);

    expect(bid).toMatchObject({ bidNumber: 'BID-2001', projectNumber: 'PRJ-3001', status: 'Submitted' });
    expect(bid.projectAddress).toEqual({ street: '123 Main St', city: 'Chicago', state: 'IL', postalCode: '60601' });
    expect(bid.lineItems).toHaveLength(3);
  });

  it('returns a copy, so changing it does not change the stored bid', async () => {
    const bid = await fetchBidDetail(ACCOUNT, SUBMITTED_BID);
    bid.lineItems.pop();
    bid.status = 'Lost';

    const again = await fetchBidDetail(ACCOUNT, SUBMITTED_BID);
    expect(again.lineItems).toHaveLength(3);
    expect(again.status).toBe('Submitted');
  });

  it('rejects an unknown bid', async () => {
    await expect(fetchBidDetail(ACCOUNT, 'bid-9999')).rejects.toThrow('This bid could not be found.');
  });
});

describe('addBidLineItem', () => {
  it('adds the trimmed item and updates the total in the detail and the list', async () => {
    const before = await fetchBidDetail(ACCOUNT, PENDING_BID);

    const updated = await addBidLineItem(ACCOUNT, PENDING_BID, { description: '  Permit fees  ', amount: 450.25 });

    expect(updated.lineItems).toHaveLength(before.lineItems.length + 1);
    expect(updated.lineItems[updated.lineItems.length - 1]).toMatchObject({ description: 'Permit fees', amount: 450.25 });
    expect(updated.total).toBe(before.total + 450.25);
    const { items } = await fetchBids(ACCOUNT, 'all');
    expect(items.find((bid) => bid.id === PENDING_BID)?.total).toBe(before.total + 450.25);
  });

  it('refuses to change a closed bid', async () => {
    await expect(addBidLineItem(ACCOUNT, WON_BID, { description: 'Extra', amount: 10 })).rejects.toThrow(
      'This bid is won and can no longer be changed.',
    );
  });
});

describe('deleteBidLineItem', () => {
  it('removes the item and lowers the total', async () => {
    const before = await fetchBidDetail(ACCOUNT, DRAFT_BID);
    const [first] = before.lineItems;

    const updated = await deleteBidLineItem(ACCOUNT, DRAFT_BID, first.id);

    expect(updated.lineItems.map((item) => item.id)).not.toContain(first.id);
    expect(updated.total).toBe(before.total - first.amount);
  });

  it('rejects an unknown line item', async () => {
    await expect(deleteBidLineItem(ACCOUNT, DRAFT_BID, 'missing')).rejects.toThrow(
      'This line item could not be found.',
    );
  });
});

describe('completeBid', () => {
  it('marks the bid completed, after which it can no longer be changed', async () => {
    const completed = await completeBid(ACCOUNT, COMPLETABLE_BID);

    expect(completed.status).toBe('Completed');
    await expect(addBidLineItem(ACCOUNT, COMPLETABLE_BID, { description: 'Late item', amount: 5 })).rejects.toThrow(
      'can no longer be changed',
    );
    await expect(completeBid(ACCOUNT, COMPLETABLE_BID)).rejects.toThrow('can no longer be changed');
  });

  it('needs at least one line item', async () => {
    const bid = await fetchBidDetail(ACCOUNT, EMPTIED_BID);
    for (const item of bid.lineItems) {
      await deleteBidLineItem(ACCOUNT, EMPTIED_BID, item.id);
    }

    await expect(completeBid(ACCOUNT, EMPTIED_BID)).rejects.toThrow('Add at least one line item');
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
