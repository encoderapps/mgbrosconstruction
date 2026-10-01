import React from 'react';
import { LoadStatus } from '../hooks/useAsyncResource';
import { Invoice } from '../types/invoice';
import { DataTable, DataTableColumn } from './DataTable';

const COLUMNS: DataTableColumn<Invoice>[] = [
  { key: 'company', label: 'Company', width: 96, isLink: true, getValue: (invoice) => invoice.company },
  { key: 'toFrom', label: 'To/From', width: 104, grow: true, getValue: (invoice) => invoice.toFrom },
  { key: 'status', label: 'Status', width: 88, align: 'right', getValue: (invoice) => invoice.status },
  {
    key: 'vendorNumber',
    label: 'Vendor Number',
    width: 92,
    align: 'right',
    getValue: (invoice) => invoice.vendorNumber,
  },
];

type InvoicesTableProps = {
  invoices: Invoice[];
  status: LoadStatus;
  onRetry: () => void;
};

export function InvoicesTable({ invoices, status, onRetry }: InvoicesTableProps): React.JSX.Element {
  return (
    <DataTable
      columns={COLUMNS}
      rows={invoices}
      getRowKey={(invoice) => invoice.id}
      emptyText="No invoices yet."
      status={status}
      errorText="Unable to load invoices."
      onRetry={onRetry}
    />
  );
}
