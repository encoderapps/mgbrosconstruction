import { SALESFORCE_GET_CONTACTS_URL } from '../constants/config';
import { ContactApiRecord, ContactsApiResponse } from '../types';
import { Contact } from '../types/contact';
import { joinAddressParts } from '../utils/address';
import { salesforceGet } from './salesforceClient';

function text(value: string | null | undefined): string {
  return value?.trim() ?? '';
}

function toContact(record: ContactApiRecord): Contact {
  return {
    id: record.contactId,
    salutation: text(record.salutation),
    firstName: text(record.firstName),
    middleName: text(record.middleName),
    lastName: text(record.lastName),
    suffix: text(record.suffix),
    // Not returned by the API (and not accepted when saving yet).
    contactOwner: '',
    // The one-line address, or the separate parts when it's missing.
    address: text(record.address) || joinAddressParts([record.city, record.state, record.postalCode]),
    phone: text(record.phone),
    email: text(record.email),
    // Not returned by the API.
    role: '',
  };
}

/** The account's contacts (GET /getcontact/*). Throws an Error with the API's message on failure. */
export async function fetchContacts(accountId: string): Promise<Contact[]> {
  const data = await salesforceGet<ContactsApiResponse>(SALESFORCE_GET_CONTACTS_URL, { accountId });
  if (!data.success) {
    throw new Error(data.message || 'Unable to load contacts.');
  }
  return (data.contacts ?? []).filter((record) => !!record.contactId).map(toContact);
}
