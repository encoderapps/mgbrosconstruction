import React, { useMemo } from 'react';
import { LoadStatus } from '../hooks/useAsyncResource';
import { Bid } from '../types/bid';
import { bidStatusTone } from '../utils/bidStatus';
import { formatCurrency } from '../utils/formatCurrency';
import { DataTable, DataTableColumn } from './DataTable';
import { StatusPill } from './StatusPill';

type BidsTableVariant = 'preview' | 'full';

function getColumns(variant: BidsTableVariant, onBidPress: (bid: Bid) => void): DataTableColumn<Bid>[] {
  return [
    {
      key: 'bidNumber',
      label: 'Bid #',
      width: 72,
      isLink: true,
      getValue: (bid) => bid.bidNumber,
      onPress: onBidPress,
    },
    { key: 'projectName', label: 'Project', width: 100, grow: true, getValue: (bid) => bid.projectName },
    { key: 'total', label: 'Total', width: 64, getValue: (bid) => formatCurrency(bid.total) },
    variant === 'full'
      ? {
          key: 'status',
          label: 'Status',
          width: 72,
          align: 'right',
          getValue: (bid) => bid.status,
          renderCell: (bid) => <StatusPill label={bid.status} tone={bidStatusTone(bid.status)} />,
        }
      : // The Home preview shows the status as plain text, like the reference.
        { key: 'status', label: 'Status', width: 64, getValue: (bid) => bid.status },
  ];
}

type BidsTableProps = {
  bids: Bid[];
  status: LoadStatus;
  onRetry: () => void;
  /** preview = the Home card (plain status text); full = the Bids screen (status pills). */
  variant: BidsTableVariant;
  /** Tapping a bid number opens the bid. */
  onBidPress: (bid: Bid) => void;
};

export function BidsTable({ bids, status, onRetry, variant, onBidPress }: BidsTableProps): React.JSX.Element {
  const columns = useMemo(() => getColumns(variant, onBidPress), [variant, onBidPress]);
  return (
    <DataTable
      columns={columns}
      rows={bids}
      getRowKey={(bid) => bid.id}
      emptyText="No bids yet."
      status={status}
      errorText="Unable to load bids."
      onRetry={onRetry}
    />
  );
}
