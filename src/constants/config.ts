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
export const SALESFORCE_CLIENT_ID =
  '3MVG9fIN0XOBSvWWorfqZ8cnCCukzkrft4_3c5MkpZwdPz.XSBhx30eoxlzx3R9XXzBidJ0hEVAwrt1Qs91qM';
export const SALESFORCE_CLIENT_SECRET =
  '51D2986146AF987D690ACE51554E33030623F05240F49953A24E23BEA40013E9';
