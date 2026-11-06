/** The logged-in subcontractor's company, from the login response. */
export interface SubcontractorCompanyProfile {
  accountId: string;
  name: string;
  address: string;
  email: string;
  phone: string;
  /** subsPaperworkMG from the login response, e.g. "Complete"; empty when not returned. */
  paperworkStatus: string;
}
