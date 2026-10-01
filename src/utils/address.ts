import { SubcontractorCompanyData } from '../navigation/types';

/** US ZIP code: exactly 5 digits. */
export const ZIP_CODE_REGEX = /^\d{5}$/;

export function isValidZipCode(zipCode: string): boolean {
  return ZIP_CODE_REGEX.test(zipCode.trim());
}

/**
 * Joins the separate company address fields into the single `companyAddress`
 * string the registration API expects, e.g. "185 N Addison Rd, Wood Dale, IL, 60007".
 */
export function formatCompanyAddress(company: SubcontractorCompanyData): string {
  return [company.companyStreetAddress, company.companyCity, company.companyState, company.companyZipCode]
    .map((part) => part.trim())
    .filter(Boolean)
    .join(', ');
}
