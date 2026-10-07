import { SALESFORCE_PROJECTS_URL } from '../constants/config';
import { EMPTY_VALUE } from '../constants/display';
import { SalesforceAddressApiRecord, SubcontractorProjectApiRecord, SubcontractorProjectsApiResponse } from '../types';
import { AccountListResult } from '../types/list';
import { SubcontractorProject, SubcontractorProjectsView } from '../types/subcontractorProject';
import { joinAddressParts } from '../utils/address';
import { salesforceGet } from './salesforceClient';

/** How many projects the Home screen's card previews. */
export const HOME_PROJECTS_LIMIT = 5;

/** "930 Mountain View Avenue, Phoenix, AZ, 85016", skipping any missing part. */
function formatJobAddress(address: SalesforceAddressApiRecord | null): string {
  return address
    ? joinAddressParts([address.street, address.city, address.stateCode || address.state, address.postalCode])
    : '';
}

function toSubcontractorProject(record: SubcontractorProjectApiRecord): SubcontractorProject {
  const fullName = record.name?.trim() || '';
  const address = formatJobAddress(record.jobAddress) || fullName;
  return {
    id: record.id,
    // The street keeps list rows short; the name (the full address) when there's no street.
    name: record.jobAddress?.street?.trim() || fullName || EMPTY_VALUE,
    address,
  };
}

/**
 * Fetches the account's projects, in the API's order (newest first). The API
 * has no "latest" view and always returns every project, so view=home keeps
 * the first HOME_PROJECTS_LIMIT here; `count` is the account's total either way.
 */
export async function fetchSubcontractorProjects(
  accountId: string,
  view: SubcontractorProjectsView,
): Promise<AccountListResult<SubcontractorProject>> {
  const data = await salesforceGet<SubcontractorProjectsApiResponse>(SALESFORCE_PROJECTS_URL, { accountId });
  if (!data.success) {
    throw new Error(data.message || 'Unable to load projects.');
  }
  const projects = (data.projects ?? []).map(toSubcontractorProject);
  return {
    items: view === 'home' ? projects.slice(0, HOME_PROJECTS_LIMIT) : projects,
    count: data.count ?? projects.length,
  };
}
