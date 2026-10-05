import { PurchaseOrderLineItem, PurchaseOrderLineItemGroup } from '../types/purchaseOrder';

/** Groups line items by category, keeping the order categories first appear in. */
export function groupLineItemsByCategory(items: PurchaseOrderLineItem[]): PurchaseOrderLineItemGroup[] {
  const groups = new Map<string, PurchaseOrderLineItem[]>();
  items.forEach((item) => {
    const group = groups.get(item.category);
    if (group) {
      group.push(item);
    } else {
      groups.set(item.category, [item]);
    }
  });
  return Array.from(groups, ([category, groupItems]) => ({ category, items: groupItems }));
}
