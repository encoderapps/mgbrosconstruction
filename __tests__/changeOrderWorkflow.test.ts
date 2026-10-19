import {
  CHANGE_ORDER_APPROVAL_UNAVAILABLE_MESSAGE,
  CREATE_CHANGE_ORDER_UNAVAILABLE_MESSAGE,
  NEW_CHANGE_ORDER_STATUS,
  createChangeOrder,
  requestChangeOrderApproval,
} from '../src/services/changeOrderService';
import { salesforceSend } from '../src/services/salesforceClient';
import { changeOrderStage, toChangeOrderSummary } from '../src/utils/changeOrder';
import { statusTone } from '../src/utils/purchaseOrderStatus';

jest.mock('../src/services/salesforceClient', () => ({
  salesforceSend: jest.fn(),
}));

const mockedSend = salesforceSend as jest.MockedFunction<typeof salesforceSend>;

afterEach(() => {
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
    const signature = { name: 'Jane Doe', fontId: 'SignatureFont1' as const, date: '2026-10-19' };

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
  it('starts every change order as a Draft', () => {
    expect(changeOrderStage({ status: NEW_CHANGE_ORDER_STATUS })).toBe('draft');
  });

  it('reports that creating change orders is unavailable without calling the backend', async () => {
    await expect(
      createChangeOrder('001ACCOUNT', {
        poId: 'po1',
        status: NEW_CHANGE_ORDER_STATUS,
        amount: 2500,
        description: 'Extra outlet',
      }),
    ).rejects.toThrow(CREATE_CHANGE_ORDER_UNAVAILABLE_MESSAGE);
    expect(mockedSend).not.toHaveBeenCalled();
  });
});

describe('requestChangeOrderApproval', () => {
  it('reports that approval requests are unavailable without calling the backend', async () => {
    await expect(requestChangeOrderApproval('001ACCOUNT', 'co1')).rejects.toThrow(
      CHANGE_ORDER_APPROVAL_UNAVAILABLE_MESSAGE,
    );
    expect(mockedSend).not.toHaveBeenCalled();
  });
});
