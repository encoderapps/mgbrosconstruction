import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  getPurchaseOrderSignature,
  savePurchaseOrderSignature,
  withStoredSignature,
} from '../src/services/purchaseOrderSignatureStore';
import { PurchaseOrderDetail, PurchaseOrderSignature } from '../src/types/purchaseOrder';

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
    },
  };
});

const SIGNATURE: PurchaseOrderSignature = { name: 'Deepak Rathore', fontId: 'SignatureFont2', date: '2026-08-24' };

const PO: PurchaseOrderDetail = {
  id: 'a1w1',
  name: 'PO-1007',
  status: 'Signed',
  project: '',
  projectAddress: '',
  totalAmount: 15750,
  lineItems: [],
  paymentTerms: [],
  poDate: null,
  signedDate: null,
  vendorSignature: null,
  signatureOnFile: null,
  signedPdfBase64: null,
  opportunityId: null,
  changeOrders: [],
  invoices: [],
};

describe('purchase order signature store', () => {
  it('saves and reads back a signature per PO', async () => {
    await savePurchaseOrderSignature('a1w1', SIGNATURE);
    await expect(getPurchaseOrderSignature('a1w1')).resolves.toEqual(SIGNATURE);
    await expect(getPurchaseOrderSignature('another-po')).resolves.toBeNull();
  });

  it('ignores stored data that is corrupt or not a signature', async () => {
    await AsyncStorage.setItem('mg_construction_po_signature_bad-json', '{not json');
    await AsyncStorage.setItem(
      'mg_construction_po_signature_bad-font',
      JSON.stringify({ ...SIGNATURE, fontId: 'ComicSans' }),
    );
    await AsyncStorage.setItem('mg_construction_po_signature_bad-date', JSON.stringify({ ...SIGNATURE, date: '8/24' }));

    await expect(getPurchaseOrderSignature('bad-json')).resolves.toBeNull();
    await expect(getPurchaseOrderSignature('bad-font')).resolves.toBeNull();
    await expect(getPurchaseOrderSignature('bad-date')).resolves.toBeNull();
  });

  it('keeps a signature drawn from the registration image, which has no style', async () => {
    const imageSignature = { name: 'Maya Bennett', fontId: null, imageBase64: 'iVBORw0KGgo', date: '2026-10-13' };
    await savePurchaseOrderSignature('a1w2', imageSignature);

    await expect(getPurchaseOrderSignature('a1w2')).resolves.toEqual(imageSignature);
  });
});

describe('withStoredSignature', () => {
  it('gives a signed PO its signing date and signature', () => {
    expect(withStoredSignature(PO, SIGNATURE)).toMatchObject({ signedDate: '2026-08-24', vendorSignature: SIGNATURE });
  });

  it('prefers a signing date from the API', () => {
    expect(withStoredSignature({ ...PO, signedDate: '2026-08-25' }, SIGNATURE).signedDate).toBe('2026-08-25');
  });

  it('ignores the signature once the PO is no longer signed, or when there is none', () => {
    const readyForSignature = { ...PO, status: 'Ready for Signature' };
    expect(withStoredSignature(readyForSignature, SIGNATURE)).toBe(readyForSignature);
    expect(withStoredSignature(PO, null)).toBe(PO);
  });

  it('keeps the signature from the API over the one kept on this device', () => {
    const apiSignature = { name: 'Sachin Ramesh Tendulkar', fontId: null, imageBase64: 'iVBORw0KGgo', date: '2026-10-14' };
    const fromApi = { ...PO, signedDate: '2026-10-14', vendorSignature: apiSignature };

    expect(withStoredSignature(fromApi, SIGNATURE)).toMatchObject({
      signedDate: '2026-10-14',
      vendorSignature: apiSignature,
    });
  });
});
