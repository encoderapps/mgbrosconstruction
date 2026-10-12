import React from 'react';
import { LoadStatus } from '../hooks/useAsyncResource';
import { Invoice } from '../types/invoice';
import { formatCurrency } from '../utils/formatCurrency';
import { DataTable, DataTableColumn } from './DataTable';

const COLUMNS: DataTableColumn<Invoice>[] = [
  {
    key: 'invoiceNumber',
    label: 'Invoice Number',
    width: 92,
    align: 'left',
    getValue: (invoice) => invoice.invoiceNumber,
  },
  {
    key: 'vendorInvoiceNumber',
    label: 'Vendor Invoice Number',
    width: 125,
    align: 'left',
    getValue: (invoice) => invoice.vendorInvoiceNumber,
  },
  {
    key: 'amount',
    label: 'Amount',
    width: 92,
    align: 'left',
    getValue: (invoice) => (invoice.amount === null ? '' : formatCurrency(invoice.amount, true)),
  },
  { key: 'status', label: 'Status', width: 88, align: 'left', getValue: (invoice) => invoice.status },
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
