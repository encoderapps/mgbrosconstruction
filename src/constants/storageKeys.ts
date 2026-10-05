export const STORAGE_KEYS = {
  AUTH_TOKEN: 'mg_construction_auth_token',
  USER_PROFILE: 'mg_construction_user_profile',
  SALESFORCE_ACCESS_TOKEN: 'mg_construction_salesforce_access_token',
  /** Followed by the PO id: the vendor signature made on this device. */
  PURCHASE_ORDER_SIGNATURE_PREFIX: 'mg_construction_po_signature_',
} as const;
