import { Platform } from 'react-native';

/**
 * 10.0.2.2 is the Android emulator's alias for the host machine's localhost.
 * A physical device needs the host machine's real LAN IP instead.
 */
const ANDROID_EMULATOR_HOST = 'http://10.0.2.2:5000';
const IOS_SIMULATOR_HOST = 'http://localhost:5000';

const DEV_API_URL = Platform.OS === 'android' ? ANDROID_EMULATOR_HOST : IOS_SIMULATOR_HOST;

export const API_BASE_URL = `${DEV_API_URL}/api`;

export const API_TIMEOUT_MS = 15000;

// NOTE: this client secret is embedded in the app bundle and is recoverable by
// anyone who decompiles the APK. Fine for a sandbox org; before pointing this
// at production Salesforce, move the client_credentials exchange to a backend
// endpoint the app calls instead, so the secret never ships on-device.
const SALESFORCE_INSTANCE_URL = 'https://newluxa--vikassbx.sandbox.my.salesforce.com';
export const SALESFORCE_TOKEN_URL = `${SALESFORCE_INSTANCE_URL}/services/oauth2/token`;
export const SALESFORCE_SUBCONTRACTOR_REGISTRATION_URL = `${SALESFORCE_INSTANCE_URL}/services/apexrest/subcontractorregistration`;
export const SALESFORCE_CHECK_EXISTING_EMAIL_URL = `${SALESFORCE_INSTANCE_URL}/services/apexrest/checkExistingEmail`;
export const SALESFORCE_SUBCONTRACTOR_LOGIN_URL = `${SALESFORCE_INSTANCE_URL}/services/apexrest/subcontractorlogin`;
export const SALESFORCE_FORGOT_PASSWORD_URL = `${SALESFORCE_INSTANCE_URL}/services/apexrest/subcontractorforgotpassword`;
export const SALESFORCE_CONTACT_URL = `${SALESFORCE_INSTANCE_URL}/services/apexrest/contact`;
// The trailing "*" is part of the Apex REST URL mapping (/getcontact/*).
export const SALESFORCE_GET_CONTACTS_URL = `${SALESFORCE_INSTANCE_URL}/services/apexrest/getcontact/*`;
export const SALESFORCE_INVOICES_URL = `${SALESFORCE_INSTANCE_URL}/services/apexrest/bookkeeping/fetch`;
// The trailing "*" is part of the Apex REST URL mapping (/invoices/create/*).
export const SALESFORCE_CREATE_INVOICE_URL = `${SALESFORCE_INSTANCE_URL}/services/apexrest/invoices/create/*`;
// Salesforce REST API SOQL query endpoint (not Apex REST).
export const SALESFORCE_QUERY_URL = `${SALESFORCE_INSTANCE_URL}/services/data/v60.0/query`;
export const SALESFORCE_PURCHASE_ORDERS_URL = `${SALESFORCE_INSTANCE_URL}/services/apexrest/purchaseorders`;
export const SALESFORCE_PURCHASE_ORDER_DETAIL_URL = `${SALESFORCE_INSTANCE_URL}/services/apexrest/purchaseorderdetail`;
export const SALESFORCE_MODIFY_PAYMENT_TERMS_URL = `${SALESFORCE_INSTANCE_URL}/services/apexrest/modifyPaymentTerms`;
export const SALESFORCE_SIGN_PURCHASE_ORDER_URL = `${SALESFORCE_INSTANCE_URL}/services/apexrest/signPurchaseOrder`;
export const SALESFORCE_SIGN_CHANGE_ORDER_URL = `${SALESFORCE_INSTANCE_URL}/services/apexrest/subcontractor/signchangeorder`;
export const SALESFORCE_PURCHASE_ORDER_CHANGE_ORDERS_URL = `${SALESFORCE_INSTANCE_URL}/services/apexrest/purchaseorderchangeorder`;
export const SALESFORCE_CREATE_CHANGE_ORDER_URL = `${SALESFORCE_INSTANCE_URL}/services/apexrest/createjobchangeorder/`;
export const SALESFORCE_JOB_CHANGE_ORDER_LINE_ITEMS_URL = `${SALESFORCE_INSTANCE_URL}/services/apexrest/jobchangeorderlineitems/`;
export const SALESFORCE_MY_JOB_CHANGE_ORDER_ITEMS_URL = `${SALESFORCE_INSTANCE_URL}/services/apexrest/myjobchangeorderitems/`;
export const SALESFORCE_SUBCONTRACTOR_DOCUMENTS_URL = `${SALESFORCE_INSTANCE_URL}/services/apexrest/subcontractordocuments`;
export const SALESFORCE_BIDS_URL = `${SALESFORCE_INSTANCE_URL}/services/apexrest/bids`;
export const SALESFORCE_SERVICE_ITEMS_URL = `${SALESFORCE_INSTANCE_URL}/services/apexrest/serviceitems`;
// The trailing "*" is part of the Apex REST URL mapping (/projects/fetch/*).
export const SALESFORCE_PROJECTS_URL = `${SALESFORCE_INSTANCE_URL}/services/apexrest/projects/fetch/*`;
export const SALESFORCE_CLIENT_ID =
  '3MVG9fIN0XOBSvWWorfqZ8cnCCukzkrft4_3c5MkpZwdPz.XSBhx30eoxlzx3R9XXzBidJ0hEVAwrt1Qs91qM';
export const SALESFORCE_CLIENT_SECRET =
  '51D2986146AF987D690ACE51554E33030623F05240F49953A24E23BEA40013E9';
