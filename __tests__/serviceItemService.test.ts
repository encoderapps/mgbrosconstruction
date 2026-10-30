import { fetchServiceItems } from '../src/services/serviceItemService';
import { salesforceGet } from '../src/services/salesforceClient';
import { ServiceItemsApiResponse } from '../src/types';

jest.mock('../src/services/salesforceClient', () => ({
  salesforceGet: jest.fn(),
}));

const mockedGet = salesforceGet as jest.MockedFunction<typeof salesforceGet>;

afterEach(() => {
  mockedGet.mockReset();
});

describe('fetchServiceItems', () => {
  it('returns the API services in order, trimmed, without blanks or repeats', async () => {
    const response: ServiceItemsApiResponse = {
      success: true,
      serviceItems: ['Asphalt', ' HVAC ', '', null, 'Plumbing', 'HVAC', 'Sewer Service'],
      message: 'Service Items retrieved successfully.',
    };
    mockedGet.mockResolvedValue(response);

    await expect(fetchServiceItems()).resolves.toEqual(['Asphalt', 'HVAC', 'Plumbing', 'Sewer Service']);
    expect(mockedGet).toHaveBeenCalledWith(expect.stringMatching(/\/services\/apexrest\/serviceitems$/), {});
  });

  it('throws the API message when the services are not returned', async () => {
    const failure: ServiceItemsApiResponse = { success: false, message: 'Not available.' };
    mockedGet.mockResolvedValue(failure);

    await expect(fetchServiceItems()).rejects.toThrow('Not available.');
  });
});
