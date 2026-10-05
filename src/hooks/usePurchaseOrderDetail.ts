import { useMemo } from 'react';
import { useSubcontractorSession } from '../context/SubcontractorSessionContext';
import { fetchPurchaseOrderDetail } from '../services/purchaseOrderDetailService';
import { getPurchaseOrderSignature, withStoredSignature } from '../services/purchaseOrderSignatureStore';
import { PurchaseOrderDetail } from '../types/purchaseOrder';
import { AsyncResource, useAsyncResource } from './useAsyncResource';

/**
 * Loads one purchase order of the logged-in account (review and signing
 * screens), with the signing date and signature made on this device.
 * `poDate` (from the Purchase Orders list) fills in the PO's date, which the
 * detail API doesn't return.
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
            return withStoredSignature({ ...detail, poDate: detail.poDate ?? poDate ?? null }, signature);
          }
        : null,
    [accountId, poId, poDate],
  );
  return useAsyncResource(load);
}
