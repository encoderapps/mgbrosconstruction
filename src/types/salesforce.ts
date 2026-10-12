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

  taxClassification: string;
  taxId: string;
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
  id?: string | null;
  invoiceId?: string | null;
  invoiceNumber?: string | null;
  vendorInvoiceNumber?: string | null;
  /** Salesforce may send amounts as text, e.g. "1000.00". */
  amount?: number | string | null;
  status?: string | null;
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

/** POST /purchaseorderchangeorder request body. */
export interface PurchaseOrderChangeOrdersApiPayload {
  accountId: string;
  poId: string;
  /** Adds that change order's items etc. to the response, as changeOrderDetail. */
  changeOrderId?: string;
}

/** One item of a change order, in changeOrderDetail. */
export interface ChangeOrderDetailItemApiRecord {
  id: string;
  /** Rich text, e.g. "<p>Air conditioning not responding</p>". */
  description: string | null;
  qty: number | string | null;
  unitPrice: number | string | null;
  cost: number | string | null;
  /** e.g. "Service". */
  productOrServices: string | null;
  /** e.g. "HVAC Service". */
  categoryName: string | null;
  serviceCategoryId: string | null;
}

/** The change order asked for with changeOrderId. */
export interface ChangeOrderDetailApiRecord {
  id: string;
  changeOrderNo: string | null;
  status: string | null;
  description: string | null;
  amount: number | string | null;
  cost: number | string | null;
  markup: number | string | null;
  destinationPrice: number | string | null;
  items: ChangeOrderDetailItemApiRecord[] | null;
}

export interface ChangeOrderApiRecord {
  id: string;
  /** e.g. "CO#01". */
  changeOrderNo: string | null;
  /** e.g. "Signed by Both Parties", "Draft". */
  status: string | null;
  description: string | null;
  amount: number | string | null;
}

/** NOTE: field names not yet confirmed — every PO tested so far returned no invoices. */
export interface PurchaseOrderInvoiceApiRecord {
  id?: string;
  invoiceNo?: string | null;
  name?: string | null;
  status?: string | null;
  amount?: number | string | null;
}

export interface PurchaseOrderChangeOrdersApiResponse {
  success: boolean;
  message?: string | null;
  poId?: string | null;
  poName?: string | null;
  status?: string | null;
  poAmount?: number | null;
  totalAmount?: number | null;
  paidInvoiceAmount?: number | null;
  balanceDue?: number | null;
  changeOrders?: ChangeOrderApiRecord[] | null;
  invoices?: PurchaseOrderInvoiceApiRecord[] | null;
  /** Only when the request names a changeOrderId. */
  changeOrderDetail?: ChangeOrderDetailApiRecord | null;
}

export interface ForgotPasswordResponse {
  success: boolean;
  message: string;
  accountId: string | null;
}

/**
 * One file record (a W9 or certificate of insurance) from GET /subcontractordocuments.
 * Every record carries every field; those that don't apply to its type are null.
 */
export interface SubcontractorDocumentApiRecord {
  id: string;
  /** Salesforce record name, e.g. "Ext-File-0000000350". */
  name: string | null;
  /** "W9", "COI - General Liability" or "COI - Workers Comp". */
  recordTypeName: string | null;
  recordTypeId: string | null;
  /** Whether this is the copy used for compliance. */
  current: boolean | null;
  /** ISO timestamp. */
  createdDate: string | null;
  description: string | null;

  /** Without the extension, e.g. "W9 - ABC Construction Services". */
  fileName: string | null;
  fileExtension: string | null;
  /** e.g. "Internal" (a Salesforce file). */
  fileType: string | null;
  /** Server-relative download path; null when no file is attached to the record. */
  fileUrl: string | null;
  /** An external link to the file, when it isn't stored in Salesforce. */
  fileLink: string | null;
  contentVersionId: string | null;
  /** The file itself, base64-encoded; null when no file is attached. */
  fileContentBase64: string | null;
  fileSizeBytes: number | null;
  fileSizeKB: number | null;
  /** ISO timestamp; null when no file has been uploaded. */
  uploadedOn: string | null;
  uploadedBy: string | null;

  /** W9 only, e.g. "LLC". */
  taxClassification: string | null;
  /** W9 only: the unmasked EIN, e.g. "15-5468978". */
  taxId: string | null;
  /** YYYY-MM-DD; W9 only. */
  signedDate: string | null;

  /** Certificates only. */
  insuranceCompanyName: string | null;
  /** Certificates only. */
  policyNumber: string | null;
  /** General Liability: whether MG Bros is named as additional insured (false on other types). */
  additionalInsured: boolean | null;
  /** YYYY-MM-DD; certificates only. */
  effectiveDate: string | null;
  /** YYYY-MM-DD; certificates only. */
  expirationDate: string | null;
}

/** All the records of one document type: "W9", "COI - General Liability" or "COI - Workers Comp". */
export interface SubcontractorDocumentGroupApiRecord {
  documentType: string | null;
  currentDocument: SubcontractorDocumentApiRecord | null;
  previousVersions: SubcontractorDocumentApiRecord[] | null;
  allDocuments?: SubcontractorDocumentApiRecord[] | null;
}

export interface SubcontractorDocumentsApiResponse {
  success: boolean;
  message?: string;
  documents: SubcontractorDocumentGroupApiRecord[] | null;
}

/** A Salesforce compound address field, as in a project's jobAddress. */
export interface SalesforceAddressApiRecord {
  street: string | null;
  city: string | null;
  state: string | null;
  stateCode: string | null;
  postalCode: string | null;
  country: string | null;
  countryCode: string | null;
  latitude: number | null;
  longitude: number | null;
  geocodeAccuracy: string | null;
}

/** One project from GET /projects/fetch/*. */
export interface SubcontractorProjectApiRecord {
  id: string;
  /** The full job address, e.g. "930 Mountain View Avenue, Phoenix, AZ, 85016". */
  name: string | null;
  jobAddress: SalesforceAddressApiRecord | null;
  /** e.g. "Created". */
  status: string | null;
  /** e.g. "Residential" or "Commercial". */
  type: string | null;
  typeOfProject: string | null;
  description: string | null;
  /** YYYY-MM-DD. */
  startDate: string | null;
  /** YYYY-MM-DD. */
  finishDate: string | null;
  /** YYYY-MM-DD. */
  clientDeadline: string | null;
  workingDays: number | null;
  estimatedBudget: number | null;
  clientAccountId: string | null;
  contractorAccountId: string | null;
  projectManagerId: string | null;
  /** e.g. "MyProject". */
  source: string | null;
  // The project's files, behind the Projects screen's shortcut buttons. Their
  // record shape isn't known yet (every sandbox project returns empty lists).
  blueprint: unknown[] | null;
  designPanel: unknown[] | null;
  scans: unknown[] | null;
  photos: unknown[] | null;
}

export interface SubcontractorProjectsApiResponse {
  success: boolean;
  message?: string;
  accountId?: string;
  /** The account's total number of projects. */
  count: number | null;
  projects: SubcontractorProjectApiRecord[] | null;
}

/** One contact from GET /getcontact/*. */
export interface ContactApiRecord {
  contactId: string;
  /** Full name, e.g. "Peter Grace williams". */
  contactName: string | null;
  salutation: string | null;
  firstName: string | null;
  middleName: string | null;
  lastName: string | null;
  suffix: string | null;
  email: string | null;
  phone: string | null;
  /** One line, e.g. "456 Industrial Area, Jaipur, Rajasthan". */
  address: string | null;
  city: string | null;
  state: string | null;
  postalCode: string | null;
  country: string | null;
  accountId: string | null;
  accountName: string | null;
}

export interface ContactsApiResponse {
  success: boolean;
  message?: string;
  accountId?: string;
  totalContacts?: number | null;
  contacts: ContactApiRecord[] | null;
}
