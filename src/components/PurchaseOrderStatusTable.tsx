import React, { useMemo } from 'react';
import { LoadStatus } from '../hooks/useAsyncResource';
import { PurchaseOrder, PurchaseOrderListChangeOrder } from '../types/purchaseOrder';
import { formatCurrency } from '../utils/formatCurrency';
import { DataTable, DataTableColumn } from './DataTable';

/** A row of a status table on the Purchase Orders screen: a PO or a change order. */
export type PurchaseOrderStatusRow =
  | { type: 'PO'; key: string; status: string; order: PurchaseOrder }
  | { type: 'CO'; key: string; status: string; changeOrder: PurchaseOrderListChangeOrder };

/** POs then change orders, each in its list's order, as rows to group by status. */
export function toPurchaseOrderStatusRows(
  orders: readonly PurchaseOrder[],
  changeOrders: readonly PurchaseOrderListChangeOrder[],
): PurchaseOrderStatusRow[] {
  return [
    ...orders.map((order): PurchaseOrderStatusRow => ({ type: 'PO', key: `po-${order.id}`, status: order.status, order })),
    ...changeOrders.map(
      (changeOrder): PurchaseOrderStatusRow => ({
        type: 'CO',
        key: `co-${changeOrder.id}`,
        status: changeOrder.status,
        changeOrder,
      }),
    ),
  ];
}

function rowName(row: PurchaseOrderStatusRow): string {
  return row.type === 'PO' ? row.order.name : row.changeOrder.name;
}

function getColumns(
  onOrderPress: (order: PurchaseOrder) => void,
  onChangeOrderPress: (changeOrder: PurchaseOrderListChangeOrder) => void,
): DataTableColumn<PurchaseOrderStatusRow>[] {
  return [
    {
      key: 'name',
      label: 'Name',
      width: 120,
      isLink: true,
      getValue: rowName,
      onPress: (row) => (row.type === 'PO' ? onOrderPress(row.order) : onChangeOrderPress(row.changeOrder)),
    },
    { key: 'type', label: 'Type', width: 56, getValue: (row) => row.type },
    {
      key: 'purchaseOrderName',
      label: 'Purchase Order',
      width: 120,
      // A change order's PO; a PO is its own.
      getValue: (row) => (row.type === 'PO' ? row.order.name : row.changeOrder.purchaseOrderName),
    },
    {
      key: 'projectName',
      label: 'Project',
      width: 180,
      getValue: (row) => (row.type === 'PO' ? row.order.projectName : row.changeOrder.projectName),
    },
    {
      key: 'totalAmount',
      label: 'Total Amount',
      width: 100,
      grow: true,
      getValue: (row) => formatCurrency(row.type === 'PO' ? row.order.totalAmount : row.changeOrder.totalAmount),
    },
  ];
}

type PurchaseOrderStatusTableProps = {
  rows: PurchaseOrderStatusRow[];
  status: LoadStatus;
  onRetry: () => void;
  /** Tapping a PO's name opens its details. */
  onOrderPress: (order: PurchaseOrder) => void;
  /** Tapping a change order's name opens it. */
  onChangeOrderPress: (changeOrder: PurchaseOrderListChangeOrder) => void;
};

/** The POs and change orders with one status, in one table, on the Purchase Orders screen. */
export function PurchaseOrderStatusTable({
  rows,
  status,
  onRetry,
  onOrderPress,
  onChangeOrderPress,
}: PurchaseOrderStatusTableProps): React.JSX.Element {
  const columns = useMemo(() => getColumns(onOrderPress, onChangeOrderPress), [onOrderPress, onChangeOrderPress]);
  return (
    <DataTable
      columns={columns}
      rows={rows}
      getRowKey={(row) => row.key}
      emptyText="No purchase orders or change orders yet."
      status={status}
      errorText="Unable to load purchase orders."
      onRetry={onRetry}
    />
  );
}
