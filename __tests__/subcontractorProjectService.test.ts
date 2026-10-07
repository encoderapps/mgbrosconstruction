import { salesforceGet } from '../src/services/salesforceClient';
import { fetchSubcontractorProjects, HOME_PROJECTS_LIMIT } from '../src/services/subcontractorProjectService';
import { SubcontractorProjectApiRecord } from '../src/types';
import { joinAddressParts } from '../src/utils/address';

jest.mock('../src/services/salesforceClient', () => ({
  salesforceGet: jest.fn(),
}));

const mockedGet = salesforceGet as jest.MockedFunction<typeof salesforceGet>;

afterEach(() => {
  mockedGet.mockReset();
});

// Shaped like the sandbox response for account 001QL00002TVYmrYAH.
function project(id: string, overrides: Partial<SubcontractorProjectApiRecord> = {}): SubcontractorProjectApiRecord {
  return {
    id,
    name: '930 Mountain View Avenue, Phoenix, AZ, 85016',
    jobAddress: {
      street: '930 Mountain View Avenue',
      city: 'Phoenix',
      state: 'Arizona',
      stateCode: 'AZ',
      postalCode: '85016',
      country: 'United States',
      countryCode: 'US',
      latitude: null,
      longitude: null,
      geocodeAccuracy: null,
    },
    status: 'Created',
    type: 'Residential',
    typeOfProject: null,
    description: 'Residential roofing replacement and exterior improvement project.',
    startDate: '2026-10-20',
    finishDate: '2026-12-05',
    clientDeadline: '2026-12-10',
    workingDays: null,
    estimatedBudget: 95000,
    clientAccountId: '001QL00002U1ZPlYAN',
    contractorAccountId: '001QL00002TVYmrYAH',
    projectManagerId: null,
    source: 'MyProject',
    blueprint: [],
    designPanel: [],
    scans: [],
    photos: [],
    ...overrides,
  };
}

const SEVEN_PROJECTS = ['p1', 'p2', 'p3', 'p4', 'p5', 'p6', 'p7'].map((id) => project(id));

describe('fetchSubcontractorProjects', () => {
  it('requests the account and maps each project to its street and full address', async () => {
    mockedGet.mockResolvedValue({ success: true, count: 1, projects: [project('a6eQL000000LW9lYAG')] });

    const result = await fetchSubcontractorProjects('001QL00002TVYmrYAH', 'all');

    expect(mockedGet).toHaveBeenCalledWith(expect.stringMatching(/\/projects\/fetch\/\*$/), {
      accountId: '001QL00002TVYmrYAH',
    });
    expect(result).toEqual({
      count: 1,
      items: [
        {
          id: 'a6eQL000000LW9lYAG',
          name: '930 Mountain View Avenue',
          address: '930 Mountain View Avenue, Phoenix, AZ, 85016',
        },
      ],
    });
  });

  it('previews the first projects on Home, with the account total as the count', async () => {
    mockedGet.mockResolvedValue({ success: true, count: 17, projects: SEVEN_PROJECTS });

    const result = await fetchSubcontractorProjects('001ACCOUNT', 'home');

    expect(result.items.map((item) => item.id)).toEqual(['p1', 'p2', 'p3', 'p4', 'p5']);
    expect(result.items).toHaveLength(HOME_PROJECTS_LIMIT);
    expect(result.count).toBe(17);
  });

  it('returns every project for View All, counting them when the API sends no count', async () => {
    mockedGet.mockResolvedValue({ success: true, count: null, projects: SEVEN_PROJECTS });

    const result = await fetchSubcontractorProjects('001ACCOUNT', 'all');

    expect(result.items).toHaveLength(7);
    expect(result.count).toBe(7);
  });

  it('falls back to the project name when the job address is missing', async () => {
    mockedGet.mockResolvedValue({
      success: true,
      count: 2,
      projects: [
        project('no-address', { name: 'mansarovar, jaipur, CA, 302020', jobAddress: null }),
        project('nothing', { name: null, jobAddress: null }),
      ],
    });

    const { items } = await fetchSubcontractorProjects('001ACCOUNT', 'all');

    expect(items).toEqual([
      { id: 'no-address', name: 'mansarovar, jaipur, CA, 302020', address: 'mansarovar, jaipur, CA, 302020' },
      { id: 'nothing', name: '—', address: '' },
    ]);
  });

  it('treats a missing project list as empty', async () => {
    mockedGet.mockResolvedValue({ success: true, count: 0, projects: null });

    await expect(fetchSubcontractorProjects('001ACCOUNT', 'home')).resolves.toEqual({ items: [], count: 0 });
  });

  it('throws the API message when the request fails', async () => {
    mockedGet.mockResolvedValue({ success: false, message: 'Account not found.', count: null, projects: null });

    await expect(fetchSubcontractorProjects('001ACCOUNT', 'all')).rejects.toThrow('Account not found.');
  });
});

describe('joinAddressParts', () => {
  it('joins the parts, trimming them and skipping missing or blank ones', () => {
    expect(joinAddressParts([' 930 Mountain View Avenue ', 'Phoenix', null, undefined, '  ', '85016'])).toBe(
      '930 Mountain View Avenue, Phoenix, 85016',
    );
    expect(joinAddressParts([null, ''])).toBe('');
  });
});
