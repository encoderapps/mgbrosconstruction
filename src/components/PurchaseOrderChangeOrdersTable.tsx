import React, { useMemo } from 'react';
import { LoadStatus } from '../hooks/useAsyncResource';
import { PurchaseOrderListChangeOrder } from '../types/purchaseOrder';
import { formatCurrency } from '../utils/formatCurrency';
import { DataTable, DataTableColumn } from './DataTable';

function getColumns(
  onChangeOrderPress: (changeOrder: PurchaseOrderListChangeOrder) => void,
): DataTableColumn<PurchaseOrderListChangeOrder>[] {
  return [
    {
      key: 'name',
      label: 'Name',
      width: 120,
      isLink: true,
      getValue: (changeOrder) => changeOrder.name,
      onPress: onChangeOrderPress,
    },
    {
      key: 'purchaseOrderName',
      label: 'Purchase Order Name',
      width: 140,
      getValue: (changeOrder) => changeOrder.purchaseOrderName,
    },
    { key: 'status', label: 'Status', width: 150, getValue: (changeOrder) => changeOrder.status },
    {
      key: 'totalAmount',
      label: 'Total Amount',
      width: 100,
      getValue: (changeOrder) => formatCurrency(changeOrder.totalAmount),
    },
    { key: 'projectName', label: 'Project', width: 180, grow: true, getValue: (changeOrder) => changeOrder.projectName },
  ];
}

type PurchaseOrderChangeOrdersTableProps = {
  changeOrders: PurchaseOrderListChangeOrder[];
  status: LoadStatus;
  onRetry: () => void;
  /** Tapping a change order's name opens it. */
  onChangeOrderPress: (changeOrder: PurchaseOrderListChangeOrder) => void;
};

/** Every PO's change orders, on the Purchase Orders screen. */
export function PurchaseOrderChangeOrdersTable({
  changeOrders,
  status,
  onRetry,
  onChangeOrderPress,
}: PurchaseOrderChangeOrdersTableProps): React.JSX.Element {
  const columns = useMemo(() => getColumns(onChangeOrderPress), [onChangeOrderPress]);
  return (
    <DataTable
      columns={columns}
      rows={changeOrders}
      getRowKey={(changeOrder) => changeOrder.id}
      emptyText="No change orders yet."
      status={status}
      errorText="Unable to load change orders."
      onRetry={onRetry}
    />
  );
}
