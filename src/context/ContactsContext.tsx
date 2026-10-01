import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { MOCK_CONTACTS } from '../constants/mockData';
import { Contact, NewContactInput } from '../types/contact';
import { useSubcontractorSession } from './SubcontractorSessionContext';

interface ContactsContextValue {
  contacts: Contact[];
  /** Adds a contact already saved to Salesforce, under the id Salesforce returned. */
  addContact: (id: string, input: NewContactInput) => Contact;
  /** Applies edits already saved to Salesforce; fields the form doesn't edit (role) are kept. */
  updateContact: (id: string, input: NewContactInput) => void;
}

const ContactsContext = createContext<ContactsContextValue | undefined>(undefined);

/**
 * In-memory contacts for the Home screen, seeded with mock data. New contacts
 * are created in Salesforce (see contactService) and then added here; there's
 * no endpoint for listing an account's contacts yet. The list belongs to the
 * logged-in account, so it starts over whenever the account changes (logout,
 * or logging in as someone else).
 */
export function ContactsProvider({ children }: { children: React.ReactNode }): React.JSX.Element {
  const { company } = useSubcontractorSession();
  const accountId = company?.accountId ?? null;
  const [contacts, setContacts] = useState<Contact[]>(MOCK_CONTACTS);
  const [contactsAccountId, setContactsAccountId] = useState(accountId);
  if (contactsAccountId !== accountId) {
    setContactsAccountId(accountId);
    setContacts(MOCK_CONTACTS);
  }

  const addContact = useCallback((id: string, input: NewContactInput): Contact => {
    const contact: Contact = { id, role: '', ...input };
    setContacts((current) => [...current, contact]);
    return contact;
  }, []);

  const updateContact = useCallback((id: string, input: NewContactInput): void => {
    setContacts((current) => current.map((contact) => (contact.id === id ? { ...contact, ...input } : contact)));
  }, []);

  const value = useMemo(() => ({ contacts, addContact, updateContact }), [contacts, addContact, updateContact]);

  return <ContactsContext.Provider value={value}>{children}</ContactsContext.Provider>;
}

export function useContacts(): ContactsContextValue {
  const context = useContext(ContactsContext);
  if (!context) {
    throw new Error('useContacts must be used within a ContactsProvider');
  }
  return context;
}
