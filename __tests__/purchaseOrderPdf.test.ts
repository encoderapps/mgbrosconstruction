import { PDFDocument, StandardFonts } from 'pdf-lib';
import RNFS from 'react-native-fs';
import { generatePurchaseOrderPdf, wrapText } from '../src/services/purchaseOrderPdfService';
import { PurchaseOrderDetail } from '../src/types/purchaseOrder';
import { formatLongDate, formatUsDate } from '../src/utils/formatDate';

jest.mock('react-native-fs', () => ({
  CachesDirectoryPath: '/cache',
  writeFile: jest.fn().mockResolvedValue(undefined),
  unlink: jest.fn().mockResolvedValue(undefined),
}));

// The real bundled font, read from disk (Jest runs from the project root) instead of the native app's assets.
jest.mock('../src/utils/signatureFontFile', () => ({
  readSignatureFontBase64: jest.fn(async () =>
    require('fs').readFileSync('src/assets/fonts/GreatVibes-Regular.ttf', 'base64'),
  ),
}));

const mockedWriteFile = RNFS.writeFile as jest.MockedFunction<typeof RNFS.writeFile>;

const PURCHASE_ORDER: PurchaseOrderDetail = {
  id: 'a1wQL000008jUa1YAE',
  name: 'Job-PO#0001115',
  status: 'Ready for Signature',
  project: '445 Maple Dr',
  projectAddress: '445 Maple Dr, Evanston, IL 60201',
  totalAmount: 15750,
  lineItems: [
    { id: 'item-0', category: 'HVAC Service', productOrService: 'Service', description: 'Duct work 1st floor', quantity: 1, unitPrice: 8500, amount: 8500 },
    { id: 'item-1', category: 'HVAC Service', productOrService: 'Service', description: 'Duct work 2nd floor', quantity: 1, unitPrice: 5250, amount: 5250 },
    { id: 'item-2', category: 'HVAC Service', productOrService: 'Service', description: 'AC Unit', quantity: 1, unitPrice: 2000, amount: 2000 },
  ],
  paymentTerms: [
    { id: 'term-0', percentage: 25, description: 'Down Payment', amount: 3937.5 },
    { id: 'term-1', percentage: 75, description: 'Final Payment', amount: 11812.5 },
  ],
  poDate: '2026-08-21',
  signedDate: null,
  vendorSignature: null,
  changeOrders: [],
  invoices: [],
};
const VENDOR = { name: 'High Tech Air Inc', address: '185 N Addison Rd, Wood Dale, IL 60191' };

/** The PDF passed to RNFS.writeFile by the last generatePurchaseOrderPdf call. */
async function writtenPdf(): Promise<{ path: string; document: PDFDocument }> {
  const [outputPath, base64] = mockedWriteFile.mock.calls[mockedWriteFile.mock.calls.length - 1];
  return { path: outputPath, document: await PDFDocument.load(base64) };
}

afterEach(() => {
  mockedWriteFile.mockClear();
});

describe('generatePurchaseOrderPdf', () => {
  it('writes a one-page PDF to the cache, with a file name safe for a file:// URI', async () => {
    const outputPath = await generatePurchaseOrderPdf(PURCHASE_ORDER, VENDOR);
    const { path: writtenPath, document } = await writtenPdf();

    expect(outputPath).toBe(writtenPath);
    expect(outputPath).toMatch(/^\/cache\/MG-Bros-Purchase-Order-Job-PO-0001115-\d+\.pdf$/);
    expect(outputPath).not.toContain('#');
    expect(document.getPageCount()).toBe(1);
    expect(document.getTitle()).toBe('Purchase Order Job-PO#0001115');
  });

  it('adds pages for long purchase orders', async () => {
    const lineItems = Array.from({ length: 60 }, (_, index) => ({
      ...PURCHASE_ORDER.lineItems[0],
      id: `item-${index}`,
      description: `Line ${index} `.repeat(20),
    }));
    await generatePurchaseOrderPdf({ ...PURCHASE_ORDER, lineItems }, VENDOR);
    expect((await writtenPdf()).document.getPageCount()).toBeGreaterThan(1);
  });

  it("doesn't fail on characters the PDF fonts can't encode, or on empty data", async () => {
    await expect(
      generatePurchaseOrderPdf(
        {
          ...PURCHASE_ORDER,
          name: '',
          projectAddress: '',
          lineItems: [{ ...PURCHASE_ORDER.lineItems[0], description: 'Ductwork ✓ 🚀 → ≥ 2 floors\nsecond line' }],
          paymentTerms: [],
        },
        { name: '', address: '' },
      ),
    ).resolves.toMatch(/\.pdf$/);
  });

  it('embeds the signature font when the PO is signed', async () => {
    await generatePurchaseOrderPdf(PURCHASE_ORDER, VENDOR);
    const unsignedSize = (await writtenPdf()).document.getPageCount();
    const unsignedBytes = mockedWriteFile.mock.calls[0][1].length;

    await generatePurchaseOrderPdf(PURCHASE_ORDER, VENDOR, {
      name: 'Deepak Rathore',
      fontId: 'SignatureFont1',
      date: '2026-10-05',
    });
    const signedBytes = mockedWriteFile.mock.calls[1][1].length;

    expect((await writtenPdf()).document.getPageCount()).toBe(unsignedSize);
    // The embedded (subset) signature font makes the signed file larger.
    expect(signedBytes).toBeGreaterThan(unsignedBytes);
  });
});

describe('wrapText', () => {
  it('wraps to the width, keeps line breaks and breaks over-long words', async () => {
    const font = await (await PDFDocument.create()).embedFont(StandardFonts.Helvetica);
    const lines = wrapText(font, 'one two three four five six\nseven', 9, 60);

    expect(lines.length).toBeGreaterThan(2);
    expect(lines[lines.length - 1]).toBe('seven');
    lines.forEach((line) => expect(font.widthOfTextAtSize(line, 9)).toBeLessThanOrEqual(60));

    const broken = wrapText(font, 'x'.repeat(100), 9, 60);
    expect(broken.join('')).toBe('x'.repeat(100));
    broken.forEach((line) => expect(font.widthOfTextAtSize(line, 9)).toBeLessThanOrEqual(60));
  });
});

describe('date formatting', () => {
  it('formats signing dates', () => {
    expect(formatUsDate('2026-10-05')).toBe('10/05/2026');
    expect(formatLongDate('2026-08-24')).toBe('August 24, 2026');
  });
});
