import { groupPurchaseOrdersByStatus, NO_STATUS_LABEL } from '../src/utils/purchaseOrderStatus';

function po(id: string, status: string): { id: string; status: string } {
  return { id, status };
}

function summary(groups: ReturnType<typeof groupPurchaseOrdersByStatus<{ id: string; status: string }>>) {
  return groups.map((group) => [group.status, group.orders.map((order) => order.id)]);
}

describe('groupPurchaseOrdersByStatus', () => {
  it('puts Ready for Signature, Signed and Signed by both sides first, in that order', () => {
    const groups = groupPurchaseOrdersByStatus([
      po('a', 'Signed by both sides'),
      po('b', 'Signed'),
      po('c', 'Ready for Signature'),
      po('d', 'Signed by both sides'),
    ]);

    expect(summary(groups)).toEqual([
      ['Ready for Signature', ['c']],
      ['Signed', ['b']],
      ['Signed by both sides', ['a', 'd']],
    ]);
  });

  it('keeps "Signed" and "Signed by both sides" apart but ignores case and spacing', () => {
    const groups = groupPurchaseOrdersByStatus([
      po('a', 'signed'),
      po('b', ' SIGNED '),
      po('c', 'Signed  by Both   Sides'),
    ]);

    expect(summary(groups)).toEqual([
      ['signed', ['a', 'b']],
      ['Signed  by Both   Sides', ['c']],
    ]);
  });

  it('lists other statuses after the known ones in the order they appear, then POs with no status', () => {
    const groups = groupPurchaseOrdersByStatus([
      po('a', ''),
      po('b', 'Cancelled'),
      po('c', 'Signed'),
      po('d', 'Draft'),
      po('e', 'Cancelled'),
    ]);

    expect(summary(groups)).toEqual([
      ['Signed', ['c']],
      ['Cancelled', ['b', 'e']],
      ['Draft', ['d']],
      [NO_STATUS_LABEL, ['a']],
    ]);
  });

  it('leaves out statuses with no POs and gives every group a unique key', () => {
    const groups = groupPurchaseOrdersByStatus([po('a', ''), po('b', 'No Status')]);

    expect(groups.map((group) => group.status)).toEqual(['No Status', NO_STATUS_LABEL]);
    expect(new Set(groups.map((group) => group.key)).size).toBe(2);
    expect(groupPurchaseOrdersByStatus([])).toEqual([]);
  });
});
