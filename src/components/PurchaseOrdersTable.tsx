import React, { useMemo } from 'react';
import { LoadStatus } from '../hooks/useAsyncResource';
import { PurchaseOrder } from '../types/purchaseOrder';
import { formatCurrency } from '../utils/formatCurrency';
import { DataTable, DataTableColumn } from './DataTable';

function getColumns(onOrderPress: (order: PurchaseOrder) => void): DataTableColumn<PurchaseOrder>[] {
  return [
    {
      key: 'name',
      label: 'Name',
      width: 112,
      isLink: true,
      getValue: (order) => order.name,
      onPress: onOrderPress,
    },
    { key: 'status', label: 'Status', width: 128, getValue: (order) => order.status },
    {
      key: 'paidAmount',
      label: 'Paid Amount',
      width: 128,
      getValue: (order) => formatCurrency(order.paidAmount),
    },
    { key: 'vendor', label: 'Vendor', width: 160, grow: true, getValue: (order) => order.vendor },
  ];
}

type PurchaseOrdersTableProps = {
  orders: PurchaseOrder[];
  status: LoadStatus;
  onRetry: () => void;
  /** Tapping a purchase order's name opens its details. */
  onOrderPress: (order: PurchaseOrder) => void;
};

export function PurchaseOrdersTable({
  orders,
  status,
  onRetry,
  onOrderPress,
}: PurchaseOrdersTableProps): React.JSX.Element {
  const columns = useMemo(() => getColumns(onOrderPress), [onOrderPress]);
  return (
    <DataTable
      columns={columns}
      rows={orders}
      getRowKey={(order) => order.id}
      emptyText="No purchase orders yet."
      status={status}
      errorText="Unable to load purchase orders."
      onRetry={onRetry}
    />
  );
}
