import { useMemo } from 'react';
import { useSubcontractorSession } from '../context/SubcontractorSessionContext';
import { fetchBidDetail } from '../services/bidService';
import { BidDetail } from '../types/bid';
import { AsyncResource, useAsyncResource } from './useAsyncResource';

/** Loads one bid of the logged-in account, with its project, description and line items. */
export function useBidDetail(bidId: string): AsyncResource<BidDetail> {
  const accountId = useSubcontractorSession().company?.accountId;
  // No account yet → null, which useAsyncResource reports as an error.
  const load = useMemo(() => (accountId ? () => fetchBidDetail(accountId, bidId) : null), [accountId, bidId]);
  return useAsyncResource(load);
}
