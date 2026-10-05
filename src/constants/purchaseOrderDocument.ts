/** MG Bros' details as General Contractor on every purchase order. */
export const GENERAL_CONTRACTOR = {
  name: 'MG Bros Construction, Inc.',
  addressLines: ['1601 Tonne Rd', 'Elk Grove Village, IL 60007'],
  phone: '630.559.7069',
  website: 'www.mgbrosconstructioninc.com',
} as const;

export const PO_SCOPE_HEADING = 'Furnish all labor and materials to perform the following:';

/** The highlighted "Other Comments or Special Instructions" notice. */
export const PO_SPECIAL_INSTRUCTIONS =
  'If a check is requested prior to draw request or due date there will be a 10% early payment fee ' +
  'applied/deducted from the original contract amount. Any paperwork prepared by MG Bros staff like ' +
  'lien waivers for payouts there will be a $25.00 fee per waiver and $1.00 per notary stamp.';

/** Standard terms printed under the contract amount. */
export const PO_STANDARD_TERMS = [
  'This purchase order must be signed before any work can start by both parties, otherwise the MG Bros is not responsible for any disagreement or contract amount.',
  'For any extra work new P.O needs to be created and accepted by MG and subcontractor. Otherwise MG will not be responsible for any extra costs.',
  '10% hold on all contracts until punch list and inspection are completed. One year warranty from subcontractor for labor and materials are to be a part of all contracts performed by the subcontractor.',
  'This Purchase Order incorporated by reference the Master Subcontract Agreement between MG Bros Construction Inc. and this subcontractor.',
] as const;
