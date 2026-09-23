import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SALESFORCE_TOKEN_URL, SALESFORCE_CLIENT_ID, SALESFORCE_CLIENT_SECRET } from '../constants/config';
import { STORAGE_KEYS } from '../constants/storageKeys';
import { SalesforceTokenResponse } from '../types';

export async function fetchSalesforceAccessToken(): Promise<string> {
  const body = new URLSearchParams({
    grant_type: 'client_credentials',
    client_id: SALESFORCE_CLIENT_ID,
    client_secret: SALESFORCE_CLIENT_SECRET,
  }).toString();

  const { data } = await axios.post<SalesforceTokenResponse>(SALESFORCE_TOKEN_URL, body, {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  });

  await AsyncStorage.setItem(STORAGE_KEYS.SALESFORCE_ACCESS_TOKEN, data.access_token);
  return data.access_token;
}

export async function getStoredSalesforceAccessToken(): Promise<string | null> {
  return AsyncStorage.getItem(STORAGE_KEYS.SALESFORCE_ACCESS_TOKEN);
}
