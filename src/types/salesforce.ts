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

/** One payment term inside the detail API's paymentTerms. */
export interface PurchaseOrderPaymentTermApiRecord {
  id?: string;
  percentage?: number | string | null;
  /** false when the term has no description. */
  description?: string | false | null;
  /** Sent as a string, e.g. "100.00". */
  amount?: number | string | null;
}

export interface PurchaseOrderLineItemApiRecord {
  category: string | null;
  productOrService: string | null;
  /** Rich text, e.g. "<p>Duct work 1st floor</p>". */
  description: string | null;
  quantity: number | null;
  unitPrice: number | null;
  amount: number | null;
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
    poDetails: PurchaseOrderLineItemApiRecord[] | null;
    /**
     * A JSON array serialised as an HTML-escaped string
     * ("[{&quot;percentage&quot;:25,…}]"); an array is accepted too.
     */
    paymentTerms: string | PurchaseOrderPaymentTermApiRecord[] | null;
  } | null;
}

/** One term as sent to PATCH /modifyPaymentTerms; Salesforce works out the amount. */
export interface ModifyPaymentTermApiRecord {
  percentage: number;
  description: string;
}

/** PATCH /modifyPaymentTerms request body. */
export interface ModifyPaymentTermsApiPayload {
  accountId: string;
  poId: string;
  paymentTerms: ModifyPaymentTermApiRecord[];
}

export interface ModifyPaymentTermsApiResponse {
  success: boolean;
  message?: string;
  poId?: string;
  paymentTermsList?: PurchaseOrderPaymentTermApiRecord[] | null;
  /** The same terms as a JSON string; paymentTermsList is used instead. */
  paymentTerms?: string | null;
}

/** PATCH /signPurchaseOrder request body. */
export interface SignPurchaseOrderApiPayload {
  accountId: string;
  poId: string;
}

export interface SignPurchaseOrderApiResponse {
  success: boolean;
  /** The PO's status after signing, e.g. "Signed". */
  status?: string | null;
  poId?: string | null;
  message?: string | null;
}

export interface ForgotPasswordResponse {
  success: boolean;
  message: string;
  accountId: string | null;
}
