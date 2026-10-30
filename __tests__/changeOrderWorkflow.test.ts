import {
  NEW_CHANGE_ORDER_STATUS,
  createBlankChangeOrder,
  createChangeOrder,
} from '../src/services/changeOrderService';
import { salesforceGet, salesforceSend } from '../src/services/salesforceClient';
import { CreateChangeOrderApiResponse } from '../src/types';
import { NewChangeOrder } from '../src/types/changeOrder';
import { changeOrderKind, changeOrderStage, isAwaitingApproval, toChangeOrderSummary } from '../src/utils/changeOrder';
import { statusTone } from '../src/utils/purchaseOrderStatus';

jest.mock('../src/services/salesforceClient', () => ({
  salesforceGet: jest.fn(),
  salesforceSend: jest.fn(),
}));

const mockedGet = salesforceGet as jest.MockedFunction<typeof salesforceGet>;
const mockedSend = salesforceSend as jest.MockedFunction<typeof salesforceSend>;

const ACCOUNT_ID = '001QL00002caUn6YAE';
const PO_ID = 'a1wQL0000091T1BYAU';
const JOB_ID = '006QL00000iAe7kYAC';

afterEach(() => {
  mockedGet.mockReset();
  mockedSend.mockReset();
});

describe('changeOrderStage', () => {
  it.each([
    ['Draft', 'draft'],
    [' draft ', 'draft'],
    ['Pending Approval', 'pendingApproval'],
    ['Awaiting Approval', 'pendingApproval'],
    ['Submitted', 'pendingApproval'],
    ['Ready for Signature', 'readyForSignature'],
    ['Ready For Signature', 'readyForSignature'],
    ['Signed', 'signed'],
    ['Signed by Both Parties', 'signed'],
    ['Rejected', 'rejected'],
    ['Approval Rejected', 'rejected'],
    ['Not Signed', 'unknown'],
    ['', 'unknown'],
    ['Cancelled', 'unknown'],
  ])('maps %p to %p', (status, stage) => {
    expect(changeOrderStage({ status })).toBe(stage);
  });

  it('treats a change order signed in the app as signed whatever its status says', () => {
    const signature = { name: 'Jane Doe', imageBase64: 'iVBORw0KGgo=', date: '2026-10-19' };

    expect(changeOrderStage({ status: 'Ready for Signature', signature })).toBe('signed');
  });
});

describe('statusTone', () => {
  it('colours a pending approval as waiting and a rejection as refused', () => {
    expect(statusTone('Pending Approval')).toBe('warning');
    expect(statusTone('Rejected')).toBe('danger');
    expect(statusTone('Draft')).toBeNull();
  });
});

describe('toChangeOrderSummary', () => {
  it('keeps only the list-level fields', () => {
    const detail = {
      id: 'co1',
      name: 'CO#01',
      status: 'Draft',
      amount: 200,
      description: 'Extra outlet',
      items: [],
      notes: 'Extra outlet',
      signature: null,
    };

    expect(toChangeOrderSummary(detail)).toEqual({
      id: 'co1',
      name: 'CO#01',
      status: 'Draft',
      amount: 200,
      description: 'Extra outlet',
    });
  });
});

describe('createChangeOrder', () => {
  function input(overrides: Partial<NewChangeOrder> = {}): NewChangeOrder {
    return {
      poId: PO_ID,
      opportunityId: JOB_ID,
      amount: 3799,
      description: ' Additional HVAC work ',
      dateOfIssue: '2026-10-19',
      specialInstructions: '',
      ...overrides,
    };
  }

  // Shaped like the sandbox response.
  const CREATED: CreateChangeOrderApiResponse = {
    success: true,
    message: 'Draft Change Order created successfully. Approval is pending.',
    changeOrderId: 'a1uQL00000Jr93pYAB',
    changeOrderNo: 'CO#08',
    changeOrderNumber: 'Job-CO#0000568',
    status: 'Draft',
    approvalStatus: 'Pending',
  };

  it('starts every change order as a Draft', () => {
    expect(changeOrderStage({ status: NEW_CHANGE_ORDER_STATUS })).toBe('draft');
  });

  it('posts the change order as a Draft and returns what the API created', async () => {
    mockedSend.mockResolvedValue(CREATED);

    const created = await createChangeOrder(ACCOUNT_ID, input({ specialInstructions: ' Call before arriving ' }));

    expect(mockedSend).toHaveBeenCalledWith(
      {
        method: 'post',
        url: expect.stringMatching(/\/services\/apexrest\/createjobchangeorder\/$/),
        data: {
          poId: PO_ID,
          accountId: ACCOUNT_ID,
          jobId: JOB_ID,
          status: 'Draft',
          changeOrderAmount: 3799,
          description: 'Additional HVAC work',
          dateOfIssue: '2026-10-19',
          specialInstructions: 'Call before arriving',
        },
      },
      expect.any(String),
    );
    expect(created).toEqual({
      id: 'a1uQL00000Jr93pYAB',
      changeOrderNumber: 'CO#08',
      status: 'Draft',
      approvalStatus: 'Pending',
      amount: 3799,
      message: 'Draft Change Order created successfully. Approval is pending.',
    });
  });

  it('leaves out empty special instructions', async () => {
    mockedSend.mockResolvedValue(CREATED);

    await createChangeOrder(ACCOUNT_ID, input());

    expect(mockedSend.mock.calls[0][0].data).not.toHaveProperty('specialInstructions');
  });

  it('looks up the job when the purchase order detail did not send it', async () => {
    mockedGet.mockResolvedValue({ totalSize: 1, done: true, records: [{ Job__c: JOB_ID }] });
    mockedSend.mockResolvedValue(CREATED);

    await createChangeOrder(ACCOUNT_ID, input({ opportunityId: null }));

    expect(mockedSend.mock.calls[0][0].data).toMatchObject({ jobId: JOB_ID });
  });

  it('refuses a purchase order with no job without calling the create API', async () => {
    mockedGet.mockResolvedValue({ totalSize: 0, done: true, records: [] });

    await expect(createChangeOrder(ACCOUNT_ID, input({ opportunityId: null }))).rejects.toThrow(/not linked to a job/);
    expect(mockedSend).not.toHaveBeenCalled();
  });

  it.each([
    ['a zero amount', { amount: 0 }, /greater than \$0/],
    ['a blank description', { description: '   ' }, /describe the change order/],
    ['a missing date of issue', { dateOfIssue: '' }, /date of issue/],
  ])('rejects %s before calling the API', async (_case, overrides, message) => {
    await expect(createChangeOrder(ACCOUNT_ID, input(overrides))).rejects.toThrow(message);
    expect(mockedSend).not.toHaveBeenCalled();
  });

  it('throws the API message when the change order is not created', async () => {
    const failure: CreateChangeOrderApiResponse = { success: false, message: 'Purchase order is not signed.' };
    mockedSend.mockResolvedValue(failure);

    await expect(createChangeOrder(ACCOUNT_ID, input())).rejects.toThrow('Purchase order is not signed.');
  });
});

describe('createBlankChangeOrder', () => {
  it('posts only the PO, account and known job, and returns what the API created', async () => {
    const response: CreateChangeOrderApiResponse = {
      success: true,
      changeOrderId: 'a1uQL00000Jr93pYAB',
      changeOrderNumber: 'Job-CO#0000568',
      source: 'Job Change Order',
    };
    mockedSend.mockResolvedValue(response);

    const created = await createBlankChangeOrder(ACCOUNT_ID, { poId: PO_ID, opportunityId: JOB_ID });

    expect(mockedSend.mock.calls[0][0].data).toEqual({ poId: PO_ID, accountId: ACCOUNT_ID, jobId: JOB_ID });
    expect(created).toMatchObject({
      id: 'a1uQL00000Jr93pYAB',
      changeOrderNumber: 'Job-CO#0000568',
      status: 'Draft',
      amount: 0,
      source: 'Job Change Order',
    });
  });

  it('creates one on a My Job PO, which has no job, without sending one', async () => {
    const response: CreateChangeOrderApiResponse = {
      success: true,
      changeOrderId: 'a6XQL000000YXJJ2A4',
      changeOrderNumber: 'J-CO#0000021',
      source: 'My Job Change Order',
      status: 'Draft',
      changeOrderAmount: null,
    };
    mockedGet.mockResolvedValue({ records: [] });
    mockedSend.mockResolvedValue(response);

    const created = await createBlankChangeOrder(ACCOUNT_ID, { poId: 'a6bQL000001ocJFYAY', opportunityId: null });

    expect(mockedSend.mock.calls[0][0].data).toEqual({ poId: 'a6bQL000001ocJFYAY', accountId: ACCOUNT_ID });
    expect(created).toMatchObject({ id: 'a6XQL000000YXJJ2A4', amount: 0, source: 'My Job Change Order' });
  });

  it('looks up the job when the PO detail sends none, as on a PO whose source is a change order', async () => {
    const response: CreateChangeOrderApiResponse = { success: true, changeOrderId: 'a1uQL00000Jr93pYAB' };
    mockedGet.mockResolvedValue({ records: [{ Job__c: JOB_ID }] });
    mockedSend.mockResolvedValue(response);

    await createBlankChangeOrder(ACCOUNT_ID, { poId: PO_ID, opportunityId: null });

    expect(mockedSend.mock.calls[0][0].data).toEqual({ poId: PO_ID, accountId: ACCOUNT_ID, jobId: JOB_ID });
  });

  it('never sends a job that is not an Opportunity', async () => {
    const response: CreateChangeOrderApiResponse = { success: true, changeOrderId: 'a1uQL00000Jr93pYAB' };
    mockedGet.mockResolvedValue({ records: [{ Job__c: 'a1uQL00000Jr11bYAB' }] });
    mockedSend.mockResolvedValue(response);

    await createBlankChangeOrder(ACCOUNT_ID, { poId: PO_ID, opportunityId: 'a1uQL00000Jr00aYAB' });

    expect(mockedSend.mock.calls[0][0].data).toEqual({ poId: PO_ID, accountId: ACCOUNT_ID });
  });

  it('throws the API message when the change order is not created', async () => {
    const failure: CreateChangeOrderApiResponse = { success: false, message: 'Amount is required.' };
    mockedSend.mockResolvedValue(failure);

    await expect(createBlankChangeOrder(ACCOUNT_ID, { poId: PO_ID, opportunityId: JOB_ID })).rejects.toThrow(
      'Amount is required.',
    );
  });
});

describe('isAwaitingApproval', () => {
  it('counts a Draft (submitted for approval when created) and Pending Approval as waiting', () => {
    expect(isAwaitingApproval('draft')).toBe(true);
    expect(isAwaitingApproval('pendingApproval')).toBe(true);
    expect(isAwaitingApproval('readyForSignature')).toBe(false);
    expect(isAwaitingApproval('signed')).toBe(false);
    expect(isAwaitingApproval('rejected')).toBe(false);
    expect(isAwaitingApproval('unknown')).toBe(false);
  });
});

describe('changeOrderKind', () => {
  it.each([
    ['Change Order', 'jobChangeOrder'],
    ['Job Change Order', 'jobChangeOrder'],
    ['My Change Order', 'myChangeOrder'],
    ['my job change order', 'myChangeOrder'],
    [undefined, 'myChangeOrder'],
    ['  ', 'myChangeOrder'],
  ])('maps %p to %p', (source, kind) => {
    expect(changeOrderKind(source)).toBe(kind);
  });
});
