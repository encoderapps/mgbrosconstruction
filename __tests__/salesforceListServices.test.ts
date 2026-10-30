import { fetchInvoices } from '../src/services/invoiceService';
import { fetchPurchaseOrderDetail } from '../src/services/purchaseOrderDetailService';
import { fetchAllPurchaseOrders, fetchPurchaseOrders } from '../src/services/purchaseOrderService';
import { salesforceGet } from '../src/services/salesforceClient';
import { toDateOnlyString } from '../src/utils/dateValidation';

jest.mock('../src/services/salesforceClient', () => ({
  salesforceGet: jest.fn(),
}));

const mockedGet = salesforceGet as jest.MockedFunction<typeof salesforceGet>;

afterEach(() => {
  mockedGet.mockReset();
});

describe('fetchPurchaseOrders', () => {
  it('requests the given view for the account and maps the records', async () => {
    mockedGet.mockResolvedValue({
      success: true,
      count: 1,
      purchaseOrders: [
        {
          id: 'a1w1',
          name: 'Job-PO#0001122',
          status: 'Signed by both sides',
          paidAmount: 0,
          vendor: 'ABC Construction Services',
          createdDate: '2026-09-29T20:21:34.000Z',
          totalAmount: 1400,
          projectName: '[TEST] 666 Post Street - Test Account',
        },
      ],
    });

    const result = await fetchPurchaseOrders('001ACCOUNT', 'all');

    expect(mockedGet).toHaveBeenCalledTimes(1);
    expect(mockedGet).toHaveBeenCalledWith(expect.stringMatching(/\/purchaseorders$/), {
      accountId: '001ACCOUNT',
      view: 'all',
    });
    expect(result).toEqual({
      count: 1,
      items: [
        {
          id: 'a1w1',
          name: 'Job-PO#0001122',
          status: 'Signed by both sides',
          paidAmount: 0,
          vendor: 'ABC Construction Services',
          // The timestamp's calendar date on this machine (it differs by time zone).
          createdDate: toDateOnlyString(new Date('2026-09-29T20:21:34.000Z')),
          totalAmount: 1400,
          projectName: '[TEST] 666 Post Street - Test Account',
        },
      ],
    });
  });

  it('returns the latest purchase orders for view=home with the total count from view=all', async () => {
    const order = { id: 'a1w1', name: 'PO-1', status: 'Signed', paidAmount: 0, vendor: 'ABC', createdDate: null };
    mockedGet.mockImplementation(async (_url, params) =>
      params?.view === 'home'
        ? { success: true, count: 1, purchaseOrders: [order] }
        : { success: true, count: 12, purchaseOrders: [] },
    );

    const result = await fetchPurchaseOrders('001ACCOUNT', 'home');

    expect(mockedGet).toHaveBeenCalledWith(expect.any(String), { accountId: '001ACCOUNT', view: 'home' });
    expect(mockedGet).toHaveBeenCalledWith(expect.any(String), { accountId: '001ACCOUNT', view: 'all' });
    expect(result.items.map((item) => item.id)).toEqual(['a1w1']);
    expect(result.count).toBe(12);
  });

  it('falls back to the returned count when the total for view=home cannot be loaded', async () => {
    const order = { id: 'a1w1', name: 'PO-1', status: 'Signed', paidAmount: 0, vendor: 'ABC', createdDate: null };
    mockedGet.mockImplementation(async (_url, params) => {
      if (params?.view === 'all') {
        throw new Error('Network Error');
      }
      return { success: true, count: 1, purchaseOrders: [order] };
    });

    await expect(fetchPurchaseOrders('001ACCOUNT', 'home')).resolves.toMatchObject({ count: 1 });
  });

  it('fills in missing fields', async () => {
    mockedGet.mockResolvedValue({
      success: true,
      count: 1,
      purchaseOrders: [{ id: 'a1w2', name: null, status: null, paidAmount: null, vendor: null, createdDate: null }],
    });

    const { items } = await fetchPurchaseOrders('001ACCOUNT', 'all');

    expect(items[0]).toEqual({
      id: 'a1w2',
      name: '',
      status: '',
      paidAmount: 0,
      vendor: '',
      createdDate: null,
      totalAmount: 0,
      projectName: '',
    });
  });

  it('throws the API message when the request is unsuccessful', async () => {
    mockedGet.mockResolvedValue({ success: false, message: 'accountId is required.', count: 0, purchaseOrders: [] });

    await expect(fetchPurchaseOrders('', 'all')).rejects.toThrow('accountId is required.');
  });
});

describe('fetchAllPurchaseOrders', () => {
  it('returns every change order, linked to its PO by name', async () => {
    mockedGet.mockResolvedValue({
      success: true,
      count: 1,
      purchaseOrders: [
        { id: 'a1w1', name: 'Job-PO#0001135', status: 'Signed', paidAmount: 0, vendor: 'ABC', createdDate: null },
      ],
      changeOrders: [
        {
          id: 'a1u1',
          name: 'Job-CO#0000552',
          status: 'Signed by Vendor',
          totalAmount: 500,
          source: 'Job Change Order',
          purchaseOrderName: 'Job-PO#0001135',
          projectName: '[TEST] 666 Post Street - Test Account',
        },
        {
          id: 'a6X1',
          name: null,
          status: null,
          totalAmount: null,
          purchaseOrderName: 'J-PO#0000004',
          projectName: null,
        },
      ],
    });

    const result = await fetchAllPurchaseOrders('001ACCOUNT');

    expect(mockedGet).toHaveBeenCalledWith(expect.any(String), { accountId: '001ACCOUNT', view: 'all' });
    expect(result.count).toBe(1);
    expect(result.changeOrders).toEqual([
      {
        id: 'a1u1',
        name: 'Job-CO#0000552',
        status: 'Signed by Vendor',
        totalAmount: 500,
        source: 'Job Change Order',
        purchaseOrderName: 'Job-PO#0001135',
        purchaseOrderId: 'a1w1',
        projectName: '[TEST] 666 Post Street - Test Account',
      },
      {
        id: 'a6X1',
        name: '',
        status: '',
        totalAmount: 0,
        purchaseOrderName: 'J-PO#0000004',
        purchaseOrderId: null,
        projectName: '',
      },
    ]);
  });
});

describe('fetchInvoices', () => {
  it('uses totalRecords as the count', async () => {
    mockedGet.mockResolvedValue({ success: true, totalRecords: 55, invoices: [] });

    const result = await fetchInvoices('001ACCOUNT', 'recent');

    expect(mockedGet).toHaveBeenCalledWith(expect.stringMatching(/\/bookkeeping\/fetch$/), {
      accountId: '001ACCOUNT',
      view: 'recent',
    });
    expect(result).toEqual({ items: [], count: 55 });
  });

  it('maps each invoice, reading text amounts and leaving missing values empty (shown as a dash)', async () => {
    mockedGet.mockResolvedValue({
      success: true,
      totalRecords: 2,
      invoices: [
        { id: 'a1k1', invoiceNumber: 'BR-000027379', vendorInvoiceNumber: 'V-77', totalAmount: '1000.00', status: 'Created' },
        { invoiceId: 'a0n2', invoiceNumber: null, vendorInvoiceNumber: null, totalAmount: null, status: null },
      ],
    });

    const { items } = await fetchInvoices('001ACCOUNT', 'all');

    expect(items).toEqual([
      { id: 'a1k1', invoiceNumber: 'BR-000027379', vendorInvoiceNumber: 'V-77', amount: 1000, status: 'Created' },
      { id: 'a0n2', invoiceNumber: '', vendorInvoiceNumber: '', amount: null, status: '' },
    ]);
  });
});

describe('fetchPurchaseOrderDetail', () => {
  it('joins the project address into one line', async () => {
    mockedGet.mockResolvedValue({
      success: true,
      purchaseOrder: {
        id: 'a1w1',
        name: 'Job-PO#0001122',
        status: 'Signed by both sides',
        project: '[TEST] 666 Post Street - Test Account',
        projectAddress: {
          street: '666 Post Street',
          city: 'San Francisco',
          state: 'CA',
          postalCode: '94109',
          country: 'US',
        },
        totalAmount: 0,
        paymentTerms: [],
      },
    });

    const detail = await fetchPurchaseOrderDetail('001ACCOUNT', 'a1w1');

    expect(mockedGet).toHaveBeenCalledWith(expect.stringMatching(/\/purchaseorderdetail$/), {
      poId: 'a1w1',
      accountId: '001ACCOUNT',
    });
    expect(detail.projectAddress).toBe('666 Post Street, San Francisco, CA 94109');
    expect(detail.paymentTerms).toEqual([]);
  });

  it('maps the signature on file, and the vendor signature once signed', async () => {
    const purchaseOrder = {
      id: 'a1wQL000008z68mYAA',
      name: 'Job-PO#0001142',
      status: 'Ready For Signature',
      project: null,
      projectAddress: null,
      totalAmount: 0,
      paymentTerms: null,
      subcontractorFullName: ' Sachin Ramesh Tendulkar ',
      // Line breaks inside the base64 are dropped.
      signatureBase64Data: 'iVBORw0K\nGgoSIG',
      signatureInitialsBase64Data: 'iVBORw0KGgoINI',
      signedDate: '2026-10-14',
      vendorSigned: false,
      vendorSignedDate: null,
    };
    mockedGet.mockResolvedValue({ success: true, purchaseOrder });

    const unsigned = await fetchPurchaseOrderDetail('001ACCOUNT', 'a1w1');

    expect(unsigned.signatureOnFile).toEqual({
      name: 'Sachin Ramesh Tendulkar',
      imageBase64: 'iVBORw0KGgoSIG',
      initialsImageBase64: 'iVBORw0KGgoINI',
      date: '2026-10-14',
    });
    expect(unsigned.signedDate).toBeNull();
    expect(unsigned.vendorSignature).toBeNull();

    mockedGet.mockResolvedValue({
      success: true,
      purchaseOrder: { ...purchaseOrder, status: 'Signed', vendorSigned: true, vendorSignedDate: '2026-10-15' },
    });
    const signed = await fetchPurchaseOrderDetail('001ACCOUNT', 'a1w1');

    expect(signed.signedDate).toBe('2026-10-15');
    expect(signed.vendorSignature).toEqual({
      name: 'Sachin Ramesh Tendulkar',
      fontId: null,
      imageBase64: 'iVBORw0KGgoSIG',
      date: '2026-10-15',
    });
  });

  it('has no signature on file when the API sends none', async () => {
    mockedGet.mockResolvedValue({
      success: true,
      purchaseOrder: { id: 'a1w1', name: 'PO', status: 'Draft', project: null, projectAddress: null, totalAmount: 0, paymentTerms: null },
    });

    await expect(fetchPurchaseOrderDetail('001ACCOUNT', 'a1w1')).resolves.toMatchObject({
      signatureOnFile: null,
      vendorSignature: null,
      signedDate: null,
      opportunityId: null,
    });
  });

  it("reads the PO's job (opportunityId), for creating invoices on it", async () => {
    mockedGet.mockResolvedValue({
      success: true,
      purchaseOrder: {
        id: 'a1w1',
        name: 'PO',
        status: 'Signed',
        project: 'ABC Construction opportunity',
        projectAddress: null,
        totalAmount: 0,
        paymentTerms: null,
        opportunityId: ' 006QL00000iYFEtYAO ',
      },
    });

    await expect(fetchPurchaseOrderDetail('001ACCOUNT', 'a1w1')).resolves.toMatchObject({
      opportunityId: '006QL00000iYFEtYAO',
    });
  });

  it("maps the PO's invoices from bookkeepingRecords", async () => {
    mockedGet.mockResolvedValue({
      success: true,
      purchaseOrder: {
        id: 'a1wQL0000091T61YAE',
        name: 'Job-PO#0001147',
        status: 'Signed',
        project: null,
        projectAddress: null,
        totalAmount: 0,
        paymentTerms: null,
        bookkeepingRecords: [
          {
            id: 'a1kQL0000bGuqjuYAB',
            name: 'BR-000027381',
            recordNumber: 'BR-000027381',
            vendorNumber: null,
            status: 'Created',
            totalAmount: 0,
            paidAmount: 0,
          },
          { id: 'a1k2', recordNumber: 'BR-000027382', vendorNumber: ' INV-7 ', status: 'Paid', totalAmount: '250.50' },
        ],
      },
    });

    const detail = await fetchPurchaseOrderDetail('001ACCOUNT', 'a1w1');

    expect(detail.invoices).toEqual([
      { id: 'a1kQL0000bGuqjuYAB', name: 'BR-000027381', vendorInvoiceNumber: '', status: 'Created', amount: 0 },
      { id: 'a1k2', name: 'BR-000027382', vendorInvoiceNumber: 'INV-7', status: 'Paid', amount: 250.5 },
    ]);
  });

  it('leaves the invoices null when the API does not send them', async () => {
    mockedGet.mockResolvedValue({
      success: true,
      purchaseOrder: { id: 'a1w1', name: 'PO', status: 'Signed', project: null, projectAddress: null, totalAmount: 0, paymentTerms: null },
    });

    await expect(fetchPurchaseOrderDetail('001ACCOUNT', 'a1w1')).resolves.toMatchObject({ invoices: null });
  });

  it('maps line items and falls back to their sum when the total is 0', async () => {
    mockedGet.mockResolvedValue({
      success: true,
      purchaseOrder: {
        id: 'a1w1',
        name: 'Job-PO#0001115',
        status: 'Signed by both sides',
        project: null,
        projectAddress: null,
        totalAmount: 0,
        poDetails: [
          {
            unitPrice: 400,
            quantity: 1,
            productOrService: 'Service',
            description: '<p>Duct work 1st floor</p>',
            category: 'HVAC Service',
            amount: 400,
          },
          {
            unitPrice: 400,
            quantity: 1,
            productOrService: 'Service',
            description: null,
            category: 'Plumbing Service',
            amount: 400,
          },
        ],
        paymentTerms: '[{&quot;description&quot;:false,&quot;percentage&quot;:25,&quot;amount&quot;:&quot;100.00&quot;}]',
      },
    });

    const detail = await fetchPurchaseOrderDetail('001ACCOUNT', 'a1w1');

    expect(detail.totalAmount).toBe(800);
    expect(detail.lineItems.map((lineItem) => lineItem.description)).toEqual(['Duct work 1st floor', '']);
    // The amount is recalculated from the total (25% of $800), not the API's "100.00".
    expect(detail.paymentTerms).toEqual([{ id: 'term-0', percentage: 25, description: '', amount: 200 }]);
  });

  it('coerces numeric strings in line items and treats unparseable values as 0', async () => {
    mockedGet.mockResolvedValue({
      success: true,
      purchaseOrder: {
        id: 'a1w1',
        name: 'Job-PO#0001115',
        status: 'Ready for Signature',
        project: null,
        projectAddress: null,
        totalAmount: null,
        poDetails: [
          { unitPrice: '250.50', quantity: '2', productOrService: null, description: null, category: null, amount: 'abc' },
        ],
        paymentTerms: null,
      },
    });

    const detail = await fetchPurchaseOrderDetail('001ACCOUNT', 'a1w1');

    expect(detail.lineItems[0]).toMatchObject({ quantity: 2, unitPrice: 250.5, amount: 0 });
    expect(detail.totalAmount).toBe(0);
  });

  it('throws when the purchase order is missing', async () => {
    mockedGet.mockResolvedValue({ success: false, purchaseOrder: null, message: 'poId is required.' });

    await expect(fetchPurchaseOrderDetail('001ACCOUNT', '')).rejects.toThrow('poId is required.');
  });
});
