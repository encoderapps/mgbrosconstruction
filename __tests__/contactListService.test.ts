import { fetchContacts } from '../src/services/contactListService';
import { salesforceGet } from '../src/services/salesforceClient';
import { ContactApiRecord, ContactsApiResponse } from '../src/types';

jest.mock('../src/services/salesforceClient', () => ({
  salesforceGet: jest.fn(),
}));

const mockedGet = salesforceGet as jest.MockedFunction<typeof salesforceGet>;
const ACCOUNT_ID = '001QL00002WQD8ZYAX';

afterEach(() => {
  mockedGet.mockReset();
});

// Shaped like the sandbox response for this account.
function record(overrides: Partial<ContactApiRecord> = {}): ContactApiRecord {
  return {
    contactId: '003QL00001yA1g2YAC',
    contactName: 'Peter Grace williams',
    salutation: 'Mr.',
    firstName: 'Peter',
    middleName: 'Grace',
    lastName: 'williams',
    suffix: null,
    email: 'robert.smith@example.com',
    phone: '3125559876',
    address: '456 Industrial Area, Jaipur, Rajasthan',
    city: null,
    state: null,
    postalCode: null,
    country: 'US',
    accountId: ACCOUNT_ID,
    accountName: 'ABC Construction Services',
    ...overrides,
  };
}

function respondWith(response: ContactsApiResponse): void {
  mockedGet.mockResolvedValue(response);
}

describe('fetchContacts', () => {
  it('requests the account and maps each contact', async () => {
    respondWith({ success: true, totalContacts: 1, contacts: [record()] });

    await expect(fetchContacts(ACCOUNT_ID)).resolves.toEqual([
      {
        id: '003QL00001yA1g2YAC',
        salutation: 'Mr.',
        firstName: 'Peter',
        middleName: 'Grace',
        lastName: 'williams',
        suffix: '',
        contactOwner: '',
        address: '456 Industrial Area, Jaipur, Rajasthan',
        phone: '3125559876',
        email: 'robert.smith@example.com',
        role: '',
      },
    ]);
    expect(mockedGet).toHaveBeenCalledWith(expect.stringMatching(/\/services\/apexrest\/getcontact\/\*$/), {
      accountId: ACCOUNT_ID,
    });
  });

  it('turns missing fields into empty text and builds the address from its parts when needed', async () => {
    respondWith({
      success: true,
      contacts: [
        record({
          contactId: '003QL00001xp0ZuYAI',
          salutation: null,
          middleName: null,
          phone: null,
          address: null,
          city: 'Wood Dale',
          state: 'IL',
          postalCode: '60191',
        }),
      ],
    });

    const [contact] = await fetchContacts(ACCOUNT_ID);

    expect(contact).toMatchObject({ salutation: '', middleName: '', phone: '', address: 'Wood Dale, IL, 60191' });
  });

  it('skips records without an id and treats a missing list as empty', async () => {
    respondWith({ success: true, contacts: [record({ contactId: '' }), record({ contactId: 'c2' })] });
    await expect(fetchContacts(ACCOUNT_ID)).resolves.toHaveLength(1);

    respondWith({ success: true, contacts: null });
    await expect(fetchContacts(ACCOUNT_ID)).resolves.toEqual([]);
  });

  it('throws the API message when the request fails', async () => {
    respondWith({ success: false, message: 'Account not found.', contacts: null });

    await expect(fetchContacts(ACCOUNT_ID)).rejects.toThrow('Account not found.');
  });
});
