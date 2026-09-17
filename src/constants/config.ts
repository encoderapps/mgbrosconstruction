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
