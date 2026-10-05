import { useCallback } from 'react';
import { useSubcontractorSession } from '../context/SubcontractorSessionContext';
import { AccountListResult } from '../types/list';
import { LoadStatus, useAsyncResource } from './useAsyncResource';

interface UseAccountListResult<Item> {
  items: Item[];
  /** The count reported by the API, or null until loaded. */
  count: number | null;
  status: LoadStatus;
  reload: () => void;
  /** Re-fetches in the background, keeping the current items on screen. */
  refresh: () => void;
}

const NO_ITEMS: never[] = [];

/**
 * Loads a list for the logged-in account (invoices, purchase orders). Nothing
 * is fetched while `enabled` is false (e.g. a Home card is collapsed); each
 * time it turns true the list is fetched again, so it's never stale.
 * `fetchList` must be a stable (module-level) function.
 */
export function useAccountList<Item, View extends string>(
  fetchList: (accountId: string, view: View) => Promise<AccountListResult<Item>>,
  view: View,
  enabled = true,
): UseAccountListResult<Item> {
  const accountId = useSubcontractorSession().company?.accountId;
  const load = useCallback(() => fetchList(accountId as string, view), [fetchList, accountId, view]);
  const { data, status, reload, refresh } = useAsyncResource(accountId ? load : null, enabled);

  return { items: data?.items ?? NO_ITEMS, count: data?.count ?? null, status, reload, refresh };
}
