/** A bid the logged-in subcontractor has made on a job, as listed in the Bids tables. */
export interface Bid {
  id: string;
  /** e.g. "BID-2001". */
  bidNumber: string;
  /** The job or scope the bid is for, e.g. "HVAC Install". */
  projectName: string;
  /** The bid's total amount in dollars: the sum of its line items. */
  total: number;
  /** e.g. "Submitted", "Won", "Pending", "Draft", "Lost" or "Completed". */
  status: string;
}

/** home = the latest 5 (Home screen card); all = every bid ("View All"). */
export type BidsView = 'home' | 'all';

export interface BidLineItem {
  id: string;
  description: string;
  /** In dollars, at most 2 decimal places. */
  amount: number;
}

/** What the Add Line Item form sends. */
export type NewBidLineItem = Omit<BidLineItem, 'id'>;

export interface BidProjectAddress {
  street: string;
  city: string;
  /** Two-letter code, e.g. "IL". */
  state: string;
  postalCode: string;
}

/** A bid with everything the Bid Details screen shows. */
export interface BidDetail extends Bid {
  /** YYYY-MM-DD. */
  bidDate: string;
  /** e.g. "PRJ-3001". */
  projectNumber: string;
  projectAddress: BidProjectAddress | null;
  description: string;
  lineItems: BidLineItem[];
}
