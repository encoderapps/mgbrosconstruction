import { addChangeOrderItem, fetchChangeOrderDetail, signChangeOrder } from '../src/services/changeOrderService';
import { salesforceSend } from '../src/services/salesforceClient';
import {
  ChangeOrderDetailApiRecord,
  PurchaseOrderChangeOrdersApiResponse,
  SignChangeOrderApiResponse,
} from '../src/types';
import { ChangeOrderSummary } from '../src/types/changeOrder';
import { isChangeOrderSigned, lineItemAmount } from '../src/utils/changeOrder';
import { todayDateString } from '../src/utils/dateValidation';

jest.mock('../src/services/salesforceClient', () => ({
  salesforceSend: jest.fn(),
}));

const mockedSend = salesforceSend as jest.MockedFunction<typeof salesforceSend>;

const ACCOUNT_ID = '001QL00002WQD8ZYAX';
const PO_ID = 'a1wQL000008jUa1YAE';
const SIGNED_PDF = { fileName: 'Signed_Test.pdf', base64: 'JVBERi0xLjQK' };

function summary(id: string, overrides: Partial<ChangeOrderSummary> = {}): ChangeOrderSummary {
  return { id, name: 'CO#01', status: 'Draft', amount: 200, description: '', ...overrides };
}

// Shaped like the sandbox's changeOrderDetail for CO#01.
function detail(id: string, overrides: Partial<ChangeOrderDetailApiRecord> = {}): ChangeOrderDetailApiRecord {
  return {
    id,
    changeOrderNo: 'CO#01',
    status: 'Signed by Both Parties',
    description: null,
    amount: 200,
    cost: null,
    markup: null,
    destinationPrice: null,
    items: [
      {
        id: 'a4nQL000002OgOLYA0',
        description: '<p>Preventive and corrective HVAC services</p>',
        qty: 1,
        unitPrice: 500,
        cost: null,
        productOrServices: 'Service',
        categoryName: 'HVAC Service',
        serviceCategoryId: 'a4oQL000000uIiDYAU',
      },
      {
        id: 'a4nQL000002OgRZYA0',
        description: '<p>Air conditioning not responding</p>',
        qty: '2',
        unitPrice: '1400.00',
        cost: null,
        productOrServices: 'Service',
        categoryName: 'HVAC Service',
        serviceCategoryId: 'a4oQL000000uIiDYAU',
      },
    ],
    ...overrides,
  };
}

function respondWith(changeOrderDetail: ChangeOrderDetailApiRecord | null, success = true, message?: string): void {
  const response: PurchaseOrderChangeOrdersApiResponse = { success, message, changeOrderDetail };
  mockedSend.mockResolvedValue(response);
}

/** A sign change order response, typed (the mocked salesforceSend only knows { success }). */
function signResponse(response: SignChangeOrderApiResponse): SignChangeOrderApiResponse {
  return response;
}

afterEach(() => {
  mockedSend.mockReset();
});

describe('fetchChangeOrderDetail', () => {
  it('POSTs the account, PO and change order and maps the detail and its items', async () => {
    respondWith(detail('co-1'));

    const changeOrder = await fetchChangeOrderDetail(ACCOUNT_ID, PO_ID, summary('co-1'));

    expect(mockedSend).toHaveBeenCalledWith(
      {
        method: 'post',
        url: expect.stringMatching(/\/services\/apexrest\/purchaseorderchangeorder$/),
        data: { accountId: ACCOUNT_ID, poId: PO_ID, changeOrderId: 'co-1' },
      },
      'Unable to load this change order.',
    );
    expect(changeOrder).toEqual({
      id: 'co-1',
      name: 'CO#01',
      status: 'Signed by Both Parties',
      amount: 200,
      description: '',
      notes: '',
      signature: null,
      items: [
        {
          id: 'a4nQL000002OgOLYA0',
          description: 'Preventive and corrective HVAC services',
          category: 'HVAC Service',
          quantity: 1,
          unitPrice: 500,
          amount: 500,
        },
        {
          id: 'a4nQL000002OgRZYA0',
          description: 'Air conditioning not responding',
          category: 'HVAC Service',
          quantity: 2,
          unitPrice: 1400,
          amount: 2800,
        },
      ],
    });
  });

  it('falls back to the PO list for missing fields, and to the product for a missing description', async () => {
    respondWith(
      detail('co-2', {
        changeOrderNo: null,
        status: null,
        amount: null,
        description: null,
        items: [
          {
            id: '',
            description: null,
            qty: null,
            unitPrice: null,
            cost: null,
            productOrServices: 'Service',
            categoryName: null,
            serviceCategoryId: null,
          },
        ],
      }),
    );

    const changeOrder = await fetchChangeOrderDetail(
      ACCOUNT_ID,
      PO_ID,
      summary('co-2', { name: 'CO#02', status: 'Draft', amount: 500, description: 'Labor included' }),
    );

    expect(changeOrder).toMatchObject({ name: 'CO#02', status: 'Draft', amount: 500, notes: 'Labor included' });
    expect(changeOrder.items).toEqual([
      { id: 'change-order-item-0', description: 'Service', category: '', quantity: 0, unitPrice: 0, amount: 0 },
    ]);
  });

  it('throws the API message, or says the change order is missing', async () => {
    respondWith(null, false, 'Change order not found for this purchase order.');
    await expect(fetchChangeOrderDetail(ACCOUNT_ID, PO_ID, summary('co-3'))).rejects.toThrow(
      'Change order not found for this purchase order.',
    );

    respondWith(null);
    await expect(fetchChangeOrderDetail(ACCOUNT_ID, PO_ID, summary('co-3'))).rejects.toThrow(
      'This change order could not be found.',
    );
  });
});

describe('addChangeOrderItem (in the app until the API exists)', () => {
  it('adds the item after the API items and keeps it on the next load', async () => {
    respondWith(detail('co-4', { status: 'Draft' }));

    const updated = await addChangeOrderItem(ACCOUNT_ID, PO_ID, summary('co-4'), {
      description: ' Extra vent ',
      quantity: 2.5,
      unitPrice: 33.33,
    });

    expect(updated.items).toHaveLength(3);
    expect(updated.items[2]).toMatchObject({ description: 'Extra vent', quantity: 2.5, unitPrice: 33.33, amount: 83.33 });
    const reloaded = await fetchChangeOrderDetail(ACCOUNT_ID, PO_ID, summary('co-4'));
    expect(reloaded.items).toHaveLength(3);
  });

  it('refuses a change order the API says is signed', async () => {
    respondWith(detail('co-5', { status: 'Signed by Both Parties' }));

    await expect(
      addChangeOrderItem(ACCOUNT_ID, PO_ID, summary('co-5'), { description: 'X', quantity: 1, unitPrice: 1 }),
    ).rejects.toThrow('can no longer be changed');
  });
});

describe('signChangeOrder', () => {
  it('POSTs the account, change order and signed PDF, and returns the API status and signing date', async () => {
    const response: SignChangeOrderApiResponse = {
      success: true,
      message: 'Change Order signed successfully.',
      status: 'Signed',
      changeOrderId: 'a1uQL00000JeVN7YAN',
      changeOrderName: 'Job-CO#0000556',
      vendorSigned: true,
      vendorSignedDate: '2026-10-13',
      signedDate: '2026-10-13',
    };
    mockedSend.mockResolvedValue(response);

    const result = await signChangeOrder(ACCOUNT_ID, 'a1uQL00000JeVN7YAN', {
      name: '  Deepak   Rathore ',
      fontId: 'SignatureFont2',
    }, SIGNED_PDF);

    expect(mockedSend).toHaveBeenCalledWith(
      {
        method: 'post',
        url: expect.stringMatching(/\/services\/apexrest\/subcontractor\/signchangeorder$/),
        data: {
          accountId: ACCOUNT_ID,
          changeOrderId: 'a1uQL00000JeVN7YAN',
          confirmSignature: true,
          pdfFileName: 'Signed_Test.pdf',
          pdfBase64Data: 'JVBERi0xLjQK',
        },
      },
      'Unable to sign this change order. Please try again.',
    );
    expect(result).toEqual({
      status: 'Signed',
      signature: { name: 'Deepak Rathore', fontId: 'SignatureFont2', date: '2026-10-13' },
      message: 'Change Order signed successfully.',
    });
  });

  it('treats an already-signed change order as signed', async () => {
    mockedSend.mockResolvedValue(
      signResponse({
        success: true,
        message: 'Change Order is already signed.',
        status: 'Signed',
        vendorSignedDate: '2026-10-10',
      }),
    );

    const result = await signChangeOrder(ACCOUNT_ID, 'co-signed', { name: 'Deepak Rathore', fontId: 'SignatureFont1' }, SIGNED_PDF);

    expect(result).toMatchObject({ status: 'Signed', message: 'Change Order is already signed.' });
    expect(result.signature.date).toBe('2026-10-10');
  });

  it('shows the signature afterwards with the API status, which the change order keeps on reload', async () => {
    mockedSend.mockResolvedValueOnce(signResponse({ success: true, status: 'Signed', vendorSignedDate: '2026-10-13' }));
    await signChangeOrder(ACCOUNT_ID, 'co-6', { name: 'Deepak Rathore', fontId: 'SignatureFont2' }, SIGNED_PDF);

    respondWith(detail('co-6', { status: 'Signed' }));
    const reloaded = await fetchChangeOrderDetail(ACCOUNT_ID, PO_ID, summary('co-6'));

    expect(reloaded.status).toBe('Signed');
    expect(reloaded.signature).toEqual({ name: 'Deepak Rathore', fontId: 'SignatureFont2', date: '2026-10-13' });
    await expect(
      addChangeOrderItem(ACCOUNT_ID, PO_ID, summary('co-6'), { description: 'X', quantity: 1, unitPrice: 1 }),
    ).rejects.toThrow('can no longer be changed');
  });

  it('throws the API message when signing fails, falling back to today only for a missing date', async () => {
    mockedSend.mockResolvedValueOnce(signResponse({ success: false, message: 'Change Order not found.' }));
    await expect(
      signChangeOrder(ACCOUNT_ID, 'missing', { name: 'Deepak Rathore', fontId: 'SignatureFont1' }, SIGNED_PDF),
    ).rejects.toThrow('Change Order not found.');

    mockedSend.mockResolvedValueOnce({ success: true });
    const result = await signChangeOrder(ACCOUNT_ID, 'no-date', { name: 'Deepak Rathore', fontId: 'SignatureFont1' }, SIGNED_PDF);
    expect(result).toMatchObject({ status: 'Signed', signature: { date: todayDateString() } });
  });

  it('needs a name, without calling the API', async () => {
    await expect(signChangeOrder(ACCOUNT_ID, 'co-7', { name: '   ', fontId: 'SignatureFont1' }, SIGNED_PDF)).rejects.toThrow(
      'Please sign with your full name.',
    );
    expect(mockedSend).not.toHaveBeenCalled();
  });
});

describe('lineItemAmount', () => {
  it('multiplies in whole cents and rounds half-up', () => {
    expect(lineItemAmount(2.5, 33.33)).toBe(83.33);
    expect(lineItemAmount(1, 1650)).toBe(1650);
    expect(lineItemAmount(0.1, 0.2)).toBe(0.02);
    expect(lineItemAmount(3, 19.99)).toBe(59.97);
  });
});

describe('isChangeOrderSigned', () => {
  it('is true once signed in the app or when the API says it is signed', () => {
    expect(isChangeOrderSigned({ status: 'Draft', signature: null })).toBe(false);
    expect(isChangeOrderSigned({ status: 'Signed by Both Parties', signature: null })).toBe(true);
    expect(
      isChangeOrderSigned({ status: 'Draft', signature: { name: 'A', fontId: 'SignatureFont1', date: '2026-10-09' } }),
    ).toBe(true);
  });
});
