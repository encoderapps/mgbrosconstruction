import { PDFDocument } from 'pdf-lib';
import { buildChangeOrderPdfBase64, buildPurchaseOrderPdfBase64 } from '../src/services/purchaseOrderPdfService';
import { ChangeOrderDetail } from '../src/types/changeOrder';
import { PurchaseOrderDetail } from '../src/types/purchaseOrder';
import { signedChangeOrderFileName, signedPurchaseOrderFileName } from '../src/utils/signedDocument';
import { readSignatureFontBase64 } from '../src/utils/signatureFontFile';

jest.mock('react-native-fs', () => ({ CachesDirectoryPath: '/cache', writeFile: jest.fn(), unlink: jest.fn() }));
jest.mock('../src/utils/signatureFontFile', () => ({ readSignatureFontBase64: jest.fn() }));

// A 1 × 1 PNG, standing in for the registration signature image.
const SIGNATURE_PNG =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';
const VENDOR = { name: 'Bennett Mechanical Solutions', address: '1850 East Harbor Avenue, Phoenix, Arizona' };

const CHANGE_ORDER: ChangeOrderDetail = {
  id: 'a1uQL00000JJlRhYAL',
  name: 'Job-CO#0000556',
  status: 'Draft',
  amount: 200,
  description: 'Labor and Material are included',
  notes: 'Labor and Material are included',
  signature: null,
  items: [
    { id: 'i1', description: 'Air conditioning not responding', category: 'HVAC Service', quantity: 1, unitPrice: 1400, amount: 1400 },
  ],
};

async function pageCount(base64: string): Promise<number> {
  return (await PDFDocument.load(base64)).getPageCount();
}

describe('signed document file names', () => {
  it('names the signed PO and change order with only file-safe characters', () => {
    expect(signedPurchaseOrderFileName('Job-PO#0001142')).toBe('Signed_PO_Job-PO_0001142.pdf');
    expect(signedChangeOrderFileName('Job-CO#0000556', 'Bennett Mechanical Solutions')).toBe(
      'Signed_CO_Job-CO_0000556_Bennett_Mechanical_Solutions.pdf',
    );
    expect(signedPurchaseOrderFileName('  ')).toBe('Signed_PO_Purchase_Order.pdf');
    expect(signedChangeOrderFileName('', '')).toBe('Signed_CO_Change_Order.pdf');
  });
});

describe('buildChangeOrderPdfBase64', () => {
  it('builds the change order with the registration signature image, without loading a font', async () => {
    const base64 = await buildChangeOrderPdfBase64(
      CHANGE_ORDER,
      { purchaseOrderName: 'Job-PO#0001115', projectAddress: '666 Post Street, San Francisco, CA 94109' },
      VENDOR,
      { name: 'Noah Mitchell', fontId: null, imageBase64: SIGNATURE_PNG, date: '2026-10-14' },
    );

    const doc = await PDFDocument.load(base64);
    expect(doc.getTitle()).toBe('Change Order Job-CO#0000556');
    expect(doc.getPageCount()).toBeGreaterThanOrEqual(1);
    expect(readSignatureFontBase64).not.toHaveBeenCalled();
  });

  it('builds an unsigned change order, and one with no items or notes', async () => {
    const empty = { ...CHANGE_ORDER, items: [], notes: '' };
    await expect(
      pageCount(await buildChangeOrderPdfBase64(empty, { purchaseOrderName: '', projectAddress: '' }, VENDOR)),
    ).resolves.toBeGreaterThanOrEqual(1);
  });

  it('adds pages for a long list of items', async () => {
    const items = Array.from({ length: 80 }, (_, index) => ({ ...CHANGE_ORDER.items[0], id: `i${index}` }));
    const base64 = await buildChangeOrderPdfBase64(
      { ...CHANGE_ORDER, items },
      { purchaseOrderName: 'Job-PO#0001115', projectAddress: '' },
      VENDOR,
    );
    await expect(pageCount(base64)).resolves.toBeGreaterThan(1);
  });
});

describe('buildPurchaseOrderPdfBase64', () => {
  it('builds the signed PO as base64, with the signature image', async () => {
    const purchaseOrder: PurchaseOrderDetail = {
      id: 'a1wQL000008jUa1YAE',
      name: 'Job-PO#0001115',
      status: 'Ready For Signature',
      project: '',
      projectAddress: '666 Post Street, San Francisco, CA 94109',
      totalAmount: 1300,
      lineItems: [],
      paymentTerms: [],
      poDate: '2026-10-14',
      signedDate: null,
      vendorSignature: null,
      signatureOnFile: null,
      opportunityId: null,
      changeOrders: null,
      invoices: null,
    };
    const base64 = await buildPurchaseOrderPdfBase64(purchaseOrder, VENDOR, {
      name: 'Noah Mitchell',
      fontId: null,
      imageBase64: SIGNATURE_PNG,
      date: '2026-10-14',
    });

    expect((await PDFDocument.load(base64)).getTitle()).toBe('Purchase Order Job-PO#0001115');
  });
});
