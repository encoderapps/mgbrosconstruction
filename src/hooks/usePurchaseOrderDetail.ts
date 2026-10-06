import { useMemo } from 'react';
import { useSubcontractorSession } from '../context/SubcontractorSessionContext';
import { fetchPurchaseOrderChangeOrders } from '../services/purchaseOrderChangeOrderService';
import { fetchPurchaseOrderDetail } from '../services/purchaseOrderDetailService';
import { getPurchaseOrderSignature, withStoredSignature } from '../services/purchaseOrderSignatureStore';
import { PurchaseOrderDetail } from '../types/purchaseOrder';
import { isSigned } from '../utils/purchaseOrderStatus';
import { AsyncResource, useAsyncResource } from './useAsyncResource';

/**
 * Loads one purchase order of the logged-in account (review and signing
 * screens): its details, its change orders and invoices, and the signing date
 * and signature made on this device. `poDate` (from the Purchase Orders list)
 * fills in the PO's date, which the detail API doesn't return.
 *
 * The change orders load after the details, and only for a signed PO (the
 * only kind the API returns them for, and the only kind the screen shows them
 * on). If only they fail, the PO still shows, with its change orders and
 * invoices left null (the screen offers a retry) rather than shown as empty.
 */
export function usePurchaseOrderDetail(poId: string, poDate?: string): AsyncResource<PurchaseOrderDetail> {
  const accountId = useSubcontractorSession().company?.accountId;
  // No account yet → null, which useAsyncResource reports as an error.
  const load = useMemo(
    () =>
      accountId
        ? async () => {
            const [detail, signature] = await Promise.all([
              fetchPurchaseOrderDetail(accountId, poId),
              getPurchaseOrderSignature(poId),
            ]);
            // The API rejects unsigned POs ("Purchase order is not signed").
            const ledger = isSigned(detail.status)
              ? await fetchPurchaseOrderChangeOrders(accountId, poId).catch((error) => {
                  console.error('Failed to load the purchase order change orders:', error);
                  return null;
                })
              : null;
            return withStoredSignature(
              {
                ...detail,
                poDate: detail.poDate ?? poDate ?? null,
                changeOrders: ledger?.changeOrders ?? null,
                invoices: ledger?.invoices ?? null,
              },
              signature,
            );
          }
        : null,
    [accountId, poId, poDate],
  );
  return useAsyncResource(load);
}
