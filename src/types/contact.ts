export interface Contact {
  id: string;
  salutation: string;
  firstName: string;
  middleName: string;
  lastName: string;
  suffix: string;
  address: string;
  phone: string;
  email: string;
  role: string;
}

/** The fields captured by the Add Contact form. */
export type NewContactInput = Pick<
  Contact,
  | 'salutation'
  | 'firstName'
  | 'middleName'
  | 'lastName'
  | 'suffix'
  | 'address'
  | 'phone'
  | 'email'
>;
