import { SubcontractorCompanyData } from '../navigation/types';
import { US_STATES } from '../constants/usStates';

/** US ZIP code: exactly 5 digits. */
export const ZIP_CODE_REGEX = /^\d{5}$/;

export function isValidZipCode(zipCode: string): boolean {
  return ZIP_CODE_REGEX.test(zipCode.trim());
}

/** Joins address parts with ", ", trimming each and skipping missing or blank ones. */
export function joinAddressParts(parts: readonly (string | null | undefined)[]): string {
  return parts
    .map((part) => part?.trim())
    .filter(Boolean)
    .join(', ');
}

/**
 * Joins the separate company address fields into the single `companyAddress`
 * string the registration API expects, e.g. "185 N Addison Rd, Wood Dale, IL, 60007".
 */
export function formatCompanyAddress(company: SubcontractorCompanyData): string {
  return joinAddressParts([
    company.companyStreetAddress,
    company.companyCity,
    company.companyState,
    company.companyZipCode,
  ]);
}

export interface AddressParts {
  street: string;
  city: string;
  state: string;
  zipCode: string;
}

/** A US state's two-letter code from its code or full name (any case), or null when it isn't one. */
function toUsStateCode(value: string): string | null {
  const normalized = value.trim().toLowerCase();
  const state = US_STATES.find(
    (item) => item.code.toLowerCase() === normalized || item.name.toLowerCase() === normalized,
  );
  return state?.code ?? null;
}

/**
 * Splits a one-line address back into its parts, the reverse of
 * `joinAddressParts([street, city, state, zipCode])`, e.g.
 * "185 N Addison Rd, Wood Dale, IL, 60007" or "185 N Addison Rd, Wood Dale, IL 60007".
 * A US state given by name becomes its code; anything else is kept as written.
 */
export function splitAddress(address: string | null | undefined): AddressParts {
  const parts = (address ?? '')
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean);

  let zipCode = '';
  const last = parts[parts.length - 1];
  if (last && ZIP_CODE_REGEX.test(last)) {
    zipCode = last;
    parts.pop();
  } else if (last) {
    // "IL 60007" — the state and zip code in one part.
    const match = /^(.+?)\s+(\d{5})$/.exec(last);
    if (match) {
      zipCode = match[2];
      parts[parts.length - 1] = match[1];
    }
  }

  let state = '';
  if (parts.length >= 2) {
    const candidate = parts[parts.length - 1];
    const stateCode = toUsStateCode(candidate);
    // With only two parts the second is the city unless it's clearly a state.
    if (parts.length >= 3 || stateCode !== null) {
      state = stateCode ?? candidate;
      parts.pop();
    }
  }

  const city = parts.length >= 2 ? (parts.pop() ?? '') : '';
  return { street: parts.join(', '), city, state, zipCode };
}
