import { useMemo } from 'react';
import { useSubcontractorSession } from '../context/SubcontractorSessionContext';
import { fetchChangeOrderDetail } from '../services/changeOrderService';
import { fetchPurchaseOrderDetail } from '../services/purchaseOrderDetailService';
import type { ChangeOrderPdfContext } from '../services/purchaseOrderPdfService';
import { ChangeOrderDetail, ChangeOrderSummary } from '../types/changeOrder';
import { PurchaseOrderLineItem, SignatureOnFile } from '../types/purchaseOrder';
import { AsyncResource, useAsyncResource } from './useAsyncResource';

export interface ChangeOrderScreenData {
  changeOrder: ChangeOrderDetail;
  /** The purchase order's own line items, shown under CO Details. */
  purchaseOrderLineItems: PurchaseOrderLineItem[];
  /** The purchase order's number and job address, printed on the signed change order. */
  purchaseOrder: ChangeOrderPdfContext;
  /** The subcontractor's signature the API has on file (sent with the PO); null when it sends none. */
  signatureOnFile: SignatureOnFile | null;
}

/** Loads a change order with its purchase order's line items and signature on file, for the change order screens. */
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
            return {
              changeOrder,
              purchaseOrderLineItems: purchaseOrder.lineItems,
              purchaseOrder: { purchaseOrderName: purchaseOrder.name, projectAddress: purchaseOrder.projectAddress },
              signatureOnFile: purchaseOrder.signatureOnFile,
            };
          }
        : null,
    [accountId, poId, summary],
  );
  return useAsyncResource(load);
}
