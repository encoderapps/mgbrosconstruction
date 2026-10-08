import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import { Text } from 'react-native';
import { BidsTable } from '../src/components/BidsTable';
import { StatusPill } from '../src/components/StatusPill';
import { Bid } from '../src/types/bid';

const BIDS: Bid[] = [
  { id: 'b1', bidNumber: 'BID-2001', projectName: 'HVAC Install', total: 14200, status: 'Submitted' },
  { id: 'b2', bidNumber: 'BID-2002', projectName: 'Duct Work', total: 8500, status: 'Won' },
];

type TableProps = React.ComponentProps<typeof BidsTable>;

async function render(props: Partial<TableProps>): Promise<ReactTestRenderer.ReactTestRenderer> {
  const allProps: TableProps = {
    bids: BIDS,
    status: 'success',
    onRetry: jest.fn(),
    variant: 'full',
    onBidPress: jest.fn(),
    ...props,
  };
  let renderer!: ReactTestRenderer.ReactTestRenderer;
  await ReactTestRenderer.act(() => {
    renderer = ReactTestRenderer.create(<BidsTable {...allProps} />);
  });
  return renderer;
}

function texts(renderer: ReactTestRenderer.ReactTestRenderer): string[] {
  return renderer.root.findAllByType(Text).map((node) => [node.props.children].flat().join(''));
}

describe('BidsTable', () => {
  it('shows each bid with its formatted total, and plain status text in the Home preview', async () => {
    const renderer = await render({ variant: 'preview' });

    expect(texts(renderer)).toEqual(
      expect.arrayContaining(['Bid #', 'Project', 'Total', 'Status', 'BID-2001', 'HVAC Install', '$14,200', 'Submitted']),
    );
    expect(renderer.root.findAllByType(StatusPill)).toHaveLength(0);
  });

  it('shows the status as a coloured pill in the full list', async () => {
    const renderer = await render({ variant: 'full' });

    const pills = renderer.root.findAllByType(StatusPill);
    expect(pills.map((pill) => [pill.props.label, pill.props.tone])).toEqual([
      ['Submitted', 'info'],
      ['Won', 'success'],
    ]);
  });

  it('opens a bid when its number is tapped', async () => {
    const onBidPress = jest.fn();
    const renderer = await render({ onBidPress });

    const links = renderer.root.findAll(
      (node) => node.props.accessibilityRole === 'link' && typeof node.props.onPress === 'function',
      { deep: false },
    );
    await ReactTestRenderer.act(() => links[1].props.onPress());

    expect(onBidPress).toHaveBeenCalledWith(BIDS[1]);
  });

  it('shows an empty message, and the error with a retry', async () => {
    const empty = await render({ bids: [] });
    expect(texts(empty)).toContain('No bids yet.');

    const failed = await render({ bids: [], status: 'error' });
    expect(texts(failed)).toEqual(['Unable to load bids.', 'Try again']);
  });
});
