import AsyncStorage from '@react-native-async-storage/async-storage';
import { getRegistrationSignature, saveRegistrationSignature } from '../src/services/registrationSignatureStore';
import { UserSignature } from '../src/types/signature';

// An in-memory AsyncStorage (v3 ships no Jest mock).
jest.mock('@react-native-async-storage/async-storage', () => {
  const store = new Map<string, string>();
  return {
    __esModule: true,
    default: {
      setItem: jest.fn(async (key: string, value: string) => {
        store.set(key, value);
      }),
      getItem: jest.fn(async (key: string) => store.get(key) ?? null),
      clear: jest.fn(async () => store.clear()),
    },
  };
});

const SIGNATURE: UserSignature = {
  name: 'Deepak Rathore',
  initials: 'DR',
  imageBase64: 'iVBORw0KGgoSIGNATURE',
  initialsImageBase64: 'iVBORw0KGgoINITIALS',
  fontId: 'SignatureFont2',
};

afterEach(async () => {
  await AsyncStorage.clear();
});

describe('registration signature store', () => {
  it('returns the signature saved at registration for the same email, ignoring case and spaces', async () => {
    await saveRegistrationSignature('Deepak@Example.com ', SIGNATURE);

    await expect(getRegistrationSignature(' deepak@example.com')).resolves.toEqual(SIGNATURE);
  });

  it('has nothing for another email', async () => {
    await saveRegistrationSignature('deepak@example.com', SIGNATURE);

    await expect(getRegistrationSignature('someone@example.com')).resolves.toBeNull();
  });

  it('ignores a stored value that is not a valid signature', async () => {
    await AsyncStorage.setItem('mg_construction_registration_signature_a@b.com', JSON.stringify({ name: 'X' }));
    await AsyncStorage.setItem('mg_construction_registration_signature_c@d.com', 'not json');

    await expect(getRegistrationSignature('a@b.com')).resolves.toBeNull();
    await expect(getRegistrationSignature('c@d.com')).resolves.toBeNull();
  });
});
