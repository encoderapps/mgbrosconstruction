import React, { createContext, useCallback, useContext, useMemo } from 'react';
import { LoadStatus, useAsyncResource } from '../hooks/useAsyncResource';
import { fetchContacts } from '../services/contactListService';
import { Contact, NewContactInput } from '../types/contact';
import { useSubcontractorSession } from './SubcontractorSessionContext';

interface ContactsContextValue {
  /** The logged-in account's contacts; empty until loaded. */
  contacts: Contact[];
  status: LoadStatus;
  /** Loads the contacts again, showing the loading state (e.g. Try again). */
  reload: () => void;
  /** Re-fetches in the background, keeping the current list on screen. */
  refresh: () => void;
  /** Adds a contact already saved to Salesforce, under the id Salesforce returned. */
  addContact: (id: string, input: NewContactInput) => Contact;
  /** Applies edits already saved to Salesforce; fields the form doesn't edit (role) are kept. */
  updateContact: (id: string, input: NewContactInput) => void;
}

/** A loaded list, tagged with the account it belongs to. */
interface AccountContacts {
  accountId: string;
  contacts: Contact[];
}

const NO_CONTACTS: Contact[] = [];

const ContactsContext = createContext<ContactsContextValue | undefined>(undefined);

/**
 * The logged-in account's contacts (GET /getcontact/*), shared by the Home
 * screen and the contact screens. Loaded once an account is logged in; saves
 * from the contact form show straight away, then the list syncs with
 * Salesforce in the background.
 * A list only ever shows for the account it was loaded for.
 */
export function ContactsProvider({ children }: { children: React.ReactNode }): React.JSX.Element {
  const accountId = useSubcontractorSession().company?.accountId ?? null;
  const load = useMemo(
    () =>
      accountId
        ? async (): Promise<AccountContacts> => ({ accountId, contacts: await fetchContacts(accountId) })
        : null,
    [accountId],
  );
  // Nothing to load before login (useAsyncResource would report a null load as an error).
  const { data, status, reload, refresh, setData } = useAsyncResource(load, accountId !== null);
  const contacts = data?.accountId === accountId ? data.contacts : NO_CONTACTS;

  const addContact = useCallback(
    (id: string, input: NewContactInput): Contact => {
      const contact: Contact = { id, role: '', ...input };
      setData((current) => current && { ...current, contacts: [...current.contacts, contact] });
      // Then sync with Salesforce in the background (and load the list if it never did).
      refresh();
      return contact;
    },
    [setData, refresh],
  );

  const updateContact = useCallback(
    (id: string, input: NewContactInput): void => {
      setData(
        (current) =>
          current && {
            ...current,
            contacts: current.contacts.map((contact) => (contact.id === id ? { ...contact, ...input } : contact)),
          },
      );
      refresh();
    },
    [setData, refresh],
  );

  const value = useMemo(
    () => ({ contacts, status, reload, refresh, addContact, updateContact }),
    [contacts, status, reload, refresh, addContact, updateContact],
  );

  return <ContactsContext.Provider value={value}>{children}</ContactsContext.Provider>;
}

export function useContacts(): ContactsContextValue {
  const context = useContext(ContactsContext);
  if (!context) {
    throw new Error('useContacts must be used within a ContactsProvider');
  }
  return context;
}
