import { BidDetail, BidProjectAddress } from '../types/bid';
import { toDateOnlyString } from '../utils/dateValidation';

const MOCK_BID_ROWS: [projectName: string, total: number, status: string][] = [
  ['HVAC Install', 14200, 'Submitted'],
  ['Duct Work', 8500, 'Won'],
  ['Roof Repair', 22000, 'Pending'],
  ['Plumbing', 7800, 'Draft'],
  ['Electrical', 11350, 'Lost'],
  ['Framing', 18900, 'Submitted'],
  ['Drywall', 9200, 'Won'],
  ['Painting', 5600, 'Pending'],
  ['Concrete', 25400, 'Submitted'],
  ['Landscaping', 6750, 'Draft'],
  ['Insulation', 7300, 'Won'],
  ['Flooring', 12800, 'Submitted'],
  ['Windows', 16450, 'Pending'],
  ['Siding', 13900, 'Lost'],
  ['Gutters', 3250, 'Won'],
  ['Masonry', 19800, 'Submitted'],
  ['Cabinetry', 21500, 'Draft'],
  ['Tile Work', 8900, 'Pending'],
  ['Fire Sprinklers', 27600, 'Submitted'],
  ['Demolition', 6100, 'Won'],
  ['Excavation', 31200, 'Pending'],
  ['Fencing', 4800, 'Lost'],
  ['Solar Panels', 38500, 'Submitted'],
  ['Countertops', 9650, 'Draft'],
  ['Garage Doors', 5400, 'Won'],
];

const MOCK_ADDRESSES: BidProjectAddress[] = [
  { street: '123 Main St', city: 'Chicago', state: 'IL', postalCode: '60601' },
  { street: '185 N Addison Rd', city: 'Wood Dale', state: 'IL', postalCode: '60191' },
  { street: '930 Mountain View Ave', city: 'Phoenix', state: 'AZ', postalCode: '85016' },
  { street: '56 Harbor St', city: 'Boston', state: 'MA', postalCode: '02110' },
];

/** The newest bid's date; each older bid is a few days earlier. */
const NEWEST_BID_DATE = new Date(2026, 8, 30);

/** Splits a total into labour / materials / finishing items that add up to it exactly. */
function mockLineItems(bidId: string, projectName: string, total: number): BidDetail['lineItems'] {
  const labour = Math.round(total * 0.6);
  const materials = Math.round(total * 0.25);
  return [
    { id: `${bidId}-item-1`, description: `${projectName} labor`, amount: labour },
    { id: `${bidId}-item-2`, description: 'Material supply', amount: materials },
    { id: `${bidId}-item-3`, description: 'Finishing work', amount: total - labour - materials },
  ];
}

/**
 * Placeholder bids, newest first: there's no bids API yet. bidService copies
 * these into its in-memory store. Remove once it calls the real endpoints.
 */
export const MOCK_BIDS: readonly BidDetail[] = MOCK_BID_ROWS.map(([projectName, total, status], index) => {
  const id = `bid-${2001 + index}`;
  const bidDate = new Date(NEWEST_BID_DATE);
  bidDate.setDate(bidDate.getDate() - index * 3);
  return {
    id,
    bidNumber: `BID-${2001 + index}`,
    projectName,
    total,
    status,
    bidDate: toDateOnlyString(bidDate),
    projectNumber: `PRJ-${3001 + index}`,
    projectAddress: MOCK_ADDRESSES[index % MOCK_ADDRESSES.length],
    description: `${projectName} for the ${MOCK_ADDRESSES[index % MOCK_ADDRESSES.length].city} job site.`,
    lineItems: mockLineItems(id, projectName, total),
  };
});
