import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '../constants/storageKeys';
import { SIGNATURE_FONTS } from '../constants/signatureFonts';
import { PurchaseOrderDetail, PurchaseOrderSignature } from '../types/purchaseOrder';
import { isSigned } from '../utils/purchaseOrderStatus';

/*
 * The signPurchaseOrder API only takes { accountId, poId }, so Salesforce
 * doesn't keep the signer's name, signature style or signing date. They're
 * kept on the device instead, so the signed PO keeps showing its signing date
 * and its PDF keeps the vendor signature. Losing them (another device, a
 * reinstall) only hides the date and signature; it never affects the signing.
 */

const storageKey = (poId: string): string => `${STORAGE_KEYS.PURCHASE_ORDER_SIGNATURE_PREFIX}${poId}`;

function isSignature(value: unknown): value is PurchaseOrderSignature {
  const signature = value as Partial<PurchaseOrderSignature> | null;
  return (
    typeof signature?.name === 'string' &&
    typeof signature.date === 'string' &&
    /^\d{4}-\d{2}-\d{2}$/.test(signature.date) &&
    SIGNATURE_FONTS.some((font) => font.id === signature.fontId)
  );
}

/** Remembers the signature made on this device for a PO the API has confirmed signed. */
export async function savePurchaseOrderSignature(poId: string, signature: PurchaseOrderSignature): Promise<void> {
  await AsyncStorage.setItem(storageKey(poId), JSON.stringify(signature));
}

/** The signature made on this device for the PO, or null if there's none (or it can't be read). */
export async function getPurchaseOrderSignature(poId: string): Promise<PurchaseOrderSignature | null> {
  try {
    const stored = await AsyncStorage.getItem(storageKey(poId));
    const signature: unknown = stored ? JSON.parse(stored) : null;
    return isSignature(signature) ? signature : null;
  } catch {
    return null;
  }
}

/**
 * Adds the stored signature to a signed PO. A PO that's no longer signed
 * (e.g. reset to Ready for Signature in Salesforce) ignores it.
 */
export function withStoredSignature(
  purchaseOrder: PurchaseOrderDetail,
  signature: PurchaseOrderSignature | null,
): PurchaseOrderDetail {
  if (!signature || !isSigned(purchaseOrder.status)) {
    return purchaseOrder;
  }
  return {
    ...purchaseOrder,
    // A signing date from the API, once it sends one, wins.
    signedDate: purchaseOrder.signedDate ?? signature.date,
    vendorSignature: signature,
  };
}
