import {
  addJobChangeOrderItem,
  addMyJobChangeOrderItem,
  fetchChangeOrderDetail,
  fetchMyJobPurchaseOrderItems,
  signChangeOrder,
} from '../src/services/changeOrderService';
import { salesforceGet, salesforceSend } from '../src/services/salesforceClient';
import {
  AddChangeOrderItemApiResponse,
  ChangeOrderDetailApiRecord,
  MyJobPurchaseOrderItemsApiResponse,
  PurchaseOrderChangeOrdersApiResponse,
  SignChangeOrderApiResponse,
} from '../src/types';
import { ChangeOrderSummary } from '../src/types/changeOrder';
import { isChangeOrderSigned, lineItemAmount } from '../src/utils/changeOrder';
import { todayDateString } from '../src/utils/dateValidation';

jest.mock('../src/services/salesforceClient', () => ({
  salesforceGet: jest.fn(),
  salesforceSend: jest.fn(),
}));

const mockedGet = salesforceGet as jest.MockedFunction<typeof salesforceGet>;
const mockedSend = salesforceSend as jest.MockedFunction<typeof salesforceSend>;

const ACCOUNT_ID = '001QL00002WQD8ZYAX';
const PO_ID = 'a1wQL000008jUa1YAE';
const SIGNED_PDF = { fileName: 'Signed_Test.pdf', base64: 'JVBERi0xLjQK' };
/** The signature on file (a PNG, base64). */
const SIGNATURE_IMAGE = 'iVBORw0KGgo=';
const SIGNER = { name: 'Deepak Rathore', imageBase64: SIGNATURE_IMAGE };

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

/** A loaded change order response, typed (the mocked salesforceSend only knows { success }). */
function loaded(changeOrderDetail: ChangeOrderDetailApiRecord): PurchaseOrderChangeOrdersApiResponse {
  return { success: true, changeOrderDetail };
}

/** An add-line-item response, typed. */
function added(success: boolean, message: string): AddChangeOrderItemApiResponse {
  return { success, message };
}

/** A sign change order response, typed (the mocked salesforceSend only knows { success }). */
function signResponse(response: SignChangeOrderApiResponse): SignChangeOrderApiResponse {
  return response;
}

afterEach(() => {
  mockedGet.mockReset();
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
          categoryId: 'a4oQL000000uIiDYAU',
          quantity: 1,
          unitPrice: 500,
          amount: 500,
        },
        {
          id: 'a4nQL000002OgRZYA0',
          description: 'Air conditioning not responding',
          category: 'HVAC Service',
          categoryId: 'a4oQL000000uIiDYAU',
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

describe('addMyJobChangeOrderItem', () => {
  it('posts the description, item cost and item price to /myjobchangeorderitems', async () => {
    // First call loads the change order (still Draft), the second adds the item.
    mockedSend
      .mockResolvedValueOnce(loaded(detail('a6XQL000000XQ5N2AW', { status: 'Draft' })))
      .mockResolvedValueOnce(added(true, 'Change Order Item created successfully.'));

    await addMyJobChangeOrderItem(ACCOUNT_ID, PO_ID, summary('a6XQL000000XQ5N2AW'), {
      purchaseOrderItemId: null,
      description: ' Condensate drain ',
      itemCost: 222,
      itemPrice: 333,
    });

    expect(mockedSend).toHaveBeenLastCalledWith(
      {
        method: 'post',
        url: expect.stringMatching(/\/services\/apexrest\/myjobchangeorderitems\/$/),
        data: { changeOrderId: 'a6XQL000000XQ5N2AW', description: 'Condensate drain', itemCost: 222, itemPrice: 333 },
      },
      expect.any(String),
    );
  });

  it('sends the picked Job Purchase Order item', async () => {
    mockedSend
      .mockResolvedValueOnce(loaded(detail('co-10', { status: 'Draft' })))
      .mockResolvedValueOnce(added(true, 'Change Order Item created successfully.'));

    await addMyJobChangeOrderItem(ACCOUNT_ID, PO_ID, summary('co-10'), {
      purchaseOrderItemId: 'a6aQL000000Kp3BYAS',
      description: 'Extra vent',
      itemCost: 80,
      itemPrice: 96,
    });

    expect(mockedSend.mock.calls[1][0].data).toEqual({
      changeOrderId: 'co-10',
      purchaseOrderItemId: 'a6aQL000000Kp3BYAS',
      description: 'Extra vent',
      itemCost: 80,
      itemPrice: 96,
    });
  });

  it('throws the API message when the item is not created', async () => {
    mockedSend
      .mockResolvedValueOnce(loaded(detail('co-8', { status: 'Draft' })))
      .mockResolvedValueOnce(added(false, 'Change Order not found.'));

    await expect(
      addMyJobChangeOrderItem(ACCOUNT_ID, PO_ID, summary('co-8'), { purchaseOrderItemId: null, description: 'X', itemCost: 1, itemPrice: 2 }),
    ).rejects.toThrow('Change Order not found.');
  });

  it('refuses a change order the API says is signed', async () => {
    respondWith(detail('co-5', { status: 'Signed by Both Parties' }));

    await expect(
      addMyJobChangeOrderItem(ACCOUNT_ID, PO_ID, summary('co-5'), { purchaseOrderItemId: null, description: 'X', itemCost: 1, itemPrice: 2 }),
    ).rejects.toThrow('can no longer be changed');
  });
});

describe('fetchMyJobPurchaseOrderItems', () => {
  it("lists the change order's Job Purchase Order items by number and name", async () => {
    // Shaped like the sandbox response.
    const response: MyJobPurchaseOrderItemsApiResponse = {
      success: true,
      message: 'Purchase Order Items fetched successfully.',
      changeOrderId: 'a6XQL000000XcjF2AS',
      purchaseOrderId: 'a6bQL000001ocJFYAY',
      items: [
        {
          id: 'a6aQL000000Kp3BYAS',
          name: 'J-POI#00000004',
          itemName: 'Item #1',
          itemId: 'a6VQL000003mn4j2AA',
          purchaseOrderId: 'a6bQL000001ocJFYAY',
        },
        { id: 'a6aQL000000Kp4nYAC', name: 'J-POI#00000005', itemName: null, itemId: null, purchaseOrderId: null },
      ],
    };
    mockedGet.mockResolvedValueOnce(response);

    const items = await fetchMyJobPurchaseOrderItems('a6XQL000000XcjF2AS');

    expect(mockedGet).toHaveBeenCalledWith(expect.stringMatching(/\/services\/apexrest\/myjobchangeorderitems\/$/), {
      changeOrderId: 'a6XQL000000XcjF2AS',
    });
    expect(items).toEqual([
      { id: 'a6aQL000000Kp3BYAS', label: 'J-POI#00000004 – Item #1' },
      { id: 'a6aQL000000Kp4nYAC', label: 'J-POI#00000005' },
    ]);
  });

  it('throws the API message when they cannot be loaded', async () => {
    const response: MyJobPurchaseOrderItemsApiResponse = { success: false, message: 'Change Order not found.', items: null };
    mockedGet.mockResolvedValueOnce(response);

    await expect(fetchMyJobPurchaseOrderItems('missing')).rejects.toThrow('Change Order not found.');
  });
});

describe('addJobChangeOrderItem', () => {
  const ITEM = {
    serviceItem: 'HVAC',
    category: 'hvac service',
    product: 'Service',
    description: ' Additional duct work ',
    markup: 20,
    cost: 80,
    poCost: 96,
  };

  it("posts EXISTING_CATEGORY with the Id of the change order's category of that name", async () => {
    mockedSend
      .mockResolvedValueOnce(loaded(detail('a1uQL00000JrM5tYAF', { status: 'Draft' })))
      .mockResolvedValueOnce(added(true, 'Line item added to the existing category successfully.'));

    await addJobChangeOrderItem(ACCOUNT_ID, PO_ID, summary('a1uQL00000JrM5tYAF'), ITEM);

    expect(mockedSend).toHaveBeenLastCalledWith(
      {
        method: 'post',
        url: expect.stringMatching(/\/services\/apexrest\/jobchangeorderlineitems\/$/),
        data: {
          operation: 'EXISTING_CATEGORY',
          changeOrderId: 'a1uQL00000JrM5tYAF',
          categoryId: 'a4oQL000000uIiDYAU',
          product: 'Service',
          description: 'Additional duct work',
          markup: 20,
          cost: 80,
          poCost: 96,
        },
      },
      expect.any(String),
    );
  });

  it('posts NEW_CATEGORY with the service item and category name for a category not on it yet', async () => {
    mockedSend
      .mockResolvedValueOnce(loaded(detail('a1uQL00000JvJnlYAF', { status: 'Draft' })))
      .mockResolvedValueOnce(added(true, 'Line item added to a new category successfully.'));

    await addJobChangeOrderItem(ACCOUNT_ID, PO_ID, summary('a1uQL00000JvJnlYAF'), {
      ...ITEM,
      serviceItem: 'Asphalt',
      category: 'Asphalt Service',
      markup: 30,
      cost: 100,
      poCost: 130,
    });

    expect(mockedSend).toHaveBeenLastCalledWith(
      {
        method: 'post',
        url: expect.stringMatching(/\/services\/apexrest\/jobchangeorderlineitems\/$/),
        data: {
          operation: 'NEW_CATEGORY',
          changeOrderId: 'a1uQL00000JvJnlYAF',
          serviceItem: 'Asphalt',
          category: 'Asphalt Service',
          product: 'Service',
          description: 'Additional duct work',
          markup: 30,
          cost: 100,
          poCost: 130,
        },
      },
      expect.any(String),
    );
  });

  it('throws the API message when the line item is not added', async () => {
    mockedSend
      .mockResolvedValueOnce(loaded(detail('co-9', { status: 'Draft' })))
      .mockResolvedValueOnce(added(false, 'Invalid service item.'));

    await expect(addJobChangeOrderItem(ACCOUNT_ID, PO_ID, summary('co-9'), ITEM)).rejects.toThrow('Invalid service item.');
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

    const result = await signChangeOrder(
      ACCOUNT_ID,
      'a1uQL00000JeVN7YAN',
      { name: '  Deepak   Rathore ', imageBase64: SIGNATURE_IMAGE },
      SIGNED_PDF,
    );

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
      signature: { name: 'Deepak Rathore', imageBase64: SIGNATURE_IMAGE, date: '2026-10-13' },
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

    const result = await signChangeOrder(ACCOUNT_ID, 'co-signed', SIGNER, SIGNED_PDF);

    expect(result).toMatchObject({ status: 'Signed', message: 'Change Order is already signed.' });
    expect(result.signature.date).toBe('2026-10-10');
  });

  it('shows the signature afterwards with the API status, which the change order keeps on reload', async () => {
    mockedSend.mockResolvedValueOnce(signResponse({ success: true, status: 'Signed', vendorSignedDate: '2026-10-13' }));
    await signChangeOrder(ACCOUNT_ID, 'co-6', SIGNER, SIGNED_PDF);

    respondWith(detail('co-6', { status: 'Signed' }));
    const reloaded = await fetchChangeOrderDetail(ACCOUNT_ID, PO_ID, summary('co-6'));

    expect(reloaded.status).toBe('Signed');
    expect(reloaded.signature).toEqual({ name: 'Deepak Rathore', imageBase64: SIGNATURE_IMAGE, date: '2026-10-13' });
    await expect(
      addMyJobChangeOrderItem(ACCOUNT_ID, PO_ID, summary('co-6'), { purchaseOrderItemId: null, description: 'X', itemCost: 1, itemPrice: 2 }),
    ).rejects.toThrow('can no longer be changed');
  });

  it('throws the API message when signing fails, falling back to today only for a missing date', async () => {
    mockedSend.mockResolvedValueOnce(signResponse({ success: false, message: 'Change Order not found.' }));
    await expect(signChangeOrder(ACCOUNT_ID, 'missing', SIGNER, SIGNED_PDF)).rejects.toThrow('Change Order not found.');

    mockedSend.mockResolvedValueOnce({ success: true });
    const result = await signChangeOrder(ACCOUNT_ID, 'no-date', SIGNER, SIGNED_PDF);
    expect(result).toMatchObject({ status: 'Signed', signature: { date: todayDateString() } });
  });

  it.each([
    ['no name', { name: '   ', imageBase64: SIGNATURE_IMAGE }],
    ['no signature image', { name: 'Deepak Rathore', imageBase64: '' }],
  ])('needs the signature on file (%s), without calling the API', async (_case, signer) => {
    await expect(signChangeOrder(ACCOUNT_ID, 'co-7', signer, SIGNED_PDF)).rejects.toThrow(
      'Your signature is not on file. Please contact MG Bros.',
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
      isChangeOrderSigned({ status: 'Draft', signature: { name: 'A', imageBase64: SIGNATURE_IMAGE, date: '2026-10-09' } }),
    ).toBe(true);
  });
});
