export interface SalesforceTokenResponse {
  access_token: string;
  signature: string;
  scope: string;
  instance_url: string;
  id: string;
  token_type: string;
  issued_at: string;
}

export interface CheckExistingEmailResponse {
  success: boolean;
  message: string;
  accountId: string | null;
}

export interface SubcontractorLoginResponse {
  success: boolean;
  message: string;
  IsLoginSuccessful: boolean;
  IsApproved: boolean;
  accountId: string | null;
  companyName?: string | null;
  email?: string | null;
  phone?: string | null;
  homeAddress?: string | null;
}

export interface SubcontractorRegistrationApiPayload {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  homeAddress: string;
  password: string;
  confirmPassword: string;

  companyName: string;
  companyAddress: string;
  yearsOfExperience: string;
  service: string;
  numberOfEmployees: string;

  federalTaxClassification: string;
  taxIdentificationNumber: string;
  w9SignedDate: string;
  w9FileName: string;
  w9FileType: string;
  w9Base64Data: string;

  glInsuranceCompanyName: string;
  glPolicyNumber: string;
  glEffectiveDate: string;
  glExpirationDate: string;
  glAdditionalInsured: boolean;
  glFileName: string;
  glFileType: string;
  glBase64Data: string;

  wcInsuranceCompanyName: string;
  wcPolicyNumber: string;
  wcEffectiveDate: string;
  wcExpirationDate: string;
  wcFileName: string;
  wcFileType: string;
  wcBase64Data: string;
}

export interface CreateContactApiPayload {
  AccountId: string;
  Salutation: string;
  FirstName: string;
  MiddleName: string;
  LastName: string;
  Email: string;
  Phone: string;
  Address: string;
}

/** The update (PATCH) contact API takes the same body as create. */
export type UpdateContactApiPayload = CreateContactApiPayload;

export interface CreateContactResponse {
  success: boolean;
  message: string;
  contactId: string | null;
  contactName: string | null;
  accountId: string | null;
  accountName: string | null;
  phone: string | null;
  email: string | null;
}

export type InvoicesView = 'recent' | 'all';

/** One invoice as returned by the invoices API (field names not yet confirmed). */
export interface InvoiceApiRecord {
  id?: string;
  invoiceId?: string;
  company?: string;
  toFrom?: string;
  status?: string;
  vendorNumber?: string;
}

export interface InvoicesApiResponse {
  success: boolean;
  message?: string;
  view: InvoicesView;
  totalInvoices: number;
  invoices: InvoiceApiRecord[];
}

export type PurchaseOrdersView = 'home' | 'all';

export interface PurchaseOrderApiRecord {
  id: string;
  name: string | null;
  status: string | null;
  paidAmount: number | null;
  vendor: string | null;
  createdDate: string | null;
}

export interface PurchaseOrdersApiResponse {
  success: boolean;
  message?: string;
  /** Number of purchase orders returned (5 at most for view=home). */
  count: number;
  purchaseOrders: PurchaseOrderApiRecord[];
}

/** Field names not yet confirmed: no purchase order tested so far had payment terms. */
export interface PurchaseOrderPaymentTermApiRecord {
  id?: string;
  percentage?: number;
  description?: string;
  amount?: number;
}

export interface PurchaseOrderDetailApiResponse {
  success: boolean;
  message?: string;
  purchaseOrder: {
    id: string;
    name: string | null;
    status: string | null;
    project: string | null;
    projectAddress: {
      street: string | null;
      city: string | null;
      state: string | null;
      postalCode: string | null;
      country: string | null;
    } | null;
    totalAmount: number | null;
    paymentTerms: PurchaseOrderPaymentTermApiRecord[] | null;
  } | null;
}

export interface ForgotPasswordResponse {
  success: boolean;
  message: string;
  accountId: string | null;
}
