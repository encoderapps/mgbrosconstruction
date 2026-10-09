import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import { Text } from 'react-native';
import { InvoicesTable } from '../src/components/InvoicesTable';
import { Invoice } from '../src/types/invoice';

async function renderTexts(invoices: Invoice[]): Promise<string[]> {
  let renderer!: ReactTestRenderer.ReactTestRenderer;
  await ReactTestRenderer.act(() => {
    renderer = ReactTestRenderer.create(<InvoicesTable invoices={invoices} status="success" onRetry={jest.fn()} />);
  });
  return renderer.root.findAllByType(Text).map((node) => [node.props.children].flat().join(''));
}

describe('InvoicesTable', () => {
  it('shows each value, with the amount as currency', async () => {
    const texts = await renderTexts([
      { id: 'a', invoiceNumber: 'INV-1', vendorInvoiceNumber: 'V-1', amount: 1000, status: 'New' },
    ]);

    expect(texts).toEqual(['Invoice Number', 'Vendor Invoice Number', 'Amount', 'Status', 'INV-1', 'V-1', '$1,000.00', 'New']);
  });

  it('shows a dash for every value the API left out', async () => {
    const texts = await renderTexts([{ id: 'b', invoiceNumber: '', vendorInvoiceNumber: ' ', amount: null, status: '' }]);

    expect(texts.slice(4)).toEqual(['—', '—', '—', '—']);
  });
});
