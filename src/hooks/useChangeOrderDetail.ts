import { useMemo } from 'react';
import { useSubcontractorSession } from '../context/SubcontractorSessionContext';
import { fetchChangeOrderDetail } from '../services/changeOrderService';
import { fetchPurchaseOrderDetail } from '../services/purchaseOrderDetailService';
import { ChangeOrderDetail, ChangeOrderSummary } from '../types/changeOrder';
import { PurchaseOrderLineItem } from '../types/purchaseOrder';
import { AsyncResource, useAsyncResource } from './useAsyncResource';

export interface ChangeOrderScreenData {
  changeOrder: ChangeOrderDetail;
  /** The purchase order's own line items, shown under CO Details. */
  purchaseOrderLineItems: PurchaseOrderLineItem[];
}

/** Loads a change order and its purchase order's line items together, for the change order screen. */
export function useChangeOrderDetail(poId: string, summary: ChangeOrderSummary): AsyncResource<ChangeOrderScreenData> {
  const accountId = useSubcontractorSession().company?.accountId;
  // No account yet → null, which useAsyncResource reports as an error.
  const load = useMemo(
    () =>
      accountId
        ? async () => {
            const [changeOrder, purchaseOrder] = await Promise.all([
              fetchChangeOrderDetail(accountId, poId, summary),
              fetchPurchaseOrderDetail(accountId, poId),
            ]);
            return { changeOrder, purchaseOrderLineItems: purchaseOrder.lineItems };
          }
        : null,
    [accountId, poId, summary],
  );
  return useAsyncResource(load);
}
