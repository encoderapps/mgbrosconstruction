import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import { ScrollView, Text } from 'react-native';
import { DataTable, DataTableColumn } from '../src/components/DataTable';

type Row = { id: string; description: string };

const COLUMNS: DataTableColumn<Row>[] = [
  { key: 'description', label: 'Description', width: 170, grow: true, getValue: (row) => row.description },
];
const ROWS: Row[] = [{ id: '1', description: 'A long description that should wrap onto more lines' }];

async function render(fitWidth?: boolean): Promise<ReactTestRenderer.ReactTestRenderer> {
  let renderer!: ReactTestRenderer.ReactTestRenderer;
  await ReactTestRenderer.act(() => {
    renderer = ReactTestRenderer.create(
      <DataTable columns={COLUMNS} rows={ROWS} getRowKey={(row) => row.id} emptyText="None" fitWidth={fitWidth} />,
    );
  });
  return renderer;
}

describe('DataTable', () => {
  it('scrolls sideways with single-line cells by default', async () => {
    const renderer = await render();

    expect(renderer.root.findAllByType(ScrollView)).toHaveLength(1);
    expect(renderer.root.findAllByType(Text).every((node) => node.props.numberOfLines === 1)).toBe(true);
  });

  it('fits its container and wraps long text with fitWidth', async () => {
    const renderer = await render(true);

    expect(renderer.root.findAllByType(ScrollView)).toHaveLength(0);
    expect(renderer.root.findAllByType(Text).every((node) => node.props.numberOfLines === undefined)).toBe(true);
  });
});
