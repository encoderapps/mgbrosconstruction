import React, { useMemo } from 'react';
import { LoadStatus } from '../hooks/useAsyncResource';
import { PurchaseOrder } from '../types/purchaseOrder';
import { formatCurrency } from '../utils/formatCurrency';
import { DataTable, DataTableColumn } from './DataTable';

function getColumns(
  onOrderPress: (order: PurchaseOrder) => void,
  showStatus: boolean,
  showProjectAndTotal: boolean,
): DataTableColumn<PurchaseOrder>[] {
  const columns: DataTableColumn<PurchaseOrder>[] = [
    {
      key: 'name',
      label: 'Name',
      width: 112,
      isLink: true,
      getValue: (order) => order.name,
      onPress: onOrderPress,
    },
    { key: 'status', label: 'Status', width: 128, getValue: (order) => order.status },
    ...(showProjectAndTotal
      ? [
          { key: 'projectName', label: 'Project', width: 180, getValue: (order: PurchaseOrder) => order.projectName },
          {
            key: 'totalAmount',
            label: 'Total Amount',
            width: 100,
            grow: true,
            getValue: (order: PurchaseOrder) => formatCurrency(order.totalAmount),
          },
        ]
      : [
          {
            key: 'paidAmount',
            label: 'Paid Amount',
            width: 90,
            getValue: (order: PurchaseOrder) => formatCurrency(order.paidAmount),
          },
          { key: 'vendor', label: 'Vendor', width: 160, grow: true, getValue: (order: PurchaseOrder) => order.vendor },
        ]),
  ];
  return showStatus ? columns : columns.filter((column) => column.key !== 'status');
}

type PurchaseOrdersTableProps = {
  orders: PurchaseOrder[];
  status: LoadStatus;
  onRetry: () => void;
  /** Tapping a purchase order's name opens its details. */
  onOrderPress: (order: PurchaseOrder) => void;
  /** Off when the table already sits under its status, e.g. on the Purchase Orders screen. */
  showStatus?: boolean;
  /** Project and Total Amount in place of Paid Amount and Vendor, as on the Purchase Orders screen. */
  showProjectAndTotal?: boolean;
};

export function PurchaseOrdersTable({
  orders,
  status,
  onRetry,
  onOrderPress,
  showStatus = true,
  showProjectAndTotal = false,
}: PurchaseOrdersTableProps): React.JSX.Element {
  const columns = useMemo(
    () => getColumns(onOrderPress, showStatus, showProjectAndTotal),
    [onOrderPress, showStatus, showProjectAndTotal],
  );
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
