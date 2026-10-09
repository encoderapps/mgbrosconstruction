import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import { ZoomablePdf } from '../src/components/ZoomablePdf';

const mockPdfRender = jest.fn();

// Records each render of the native viewer and the props it got.
jest.mock('react-native-pdf', () => {
  const ReactInMock = jest.requireActual<typeof React>('react');
  return function MockPdf(props: Record<string, unknown>) {
    mockPdfRender(props);
    return ReactInMock.createElement('MockPdf');
  };
});

const STYLE = { flex: 1 };

async function render(element: React.ReactElement): Promise<ReactTestRenderer.ReactTestRenderer> {
  let renderer!: ReactTestRenderer.ReactTestRenderer;
  await ReactTestRenderer.act(() => {
    renderer = ReactTestRenderer.create(element);
  });
  return renderer;
}

beforeEach(() => {
  mockPdfRender.mockClear();
});

describe('ZoomablePdf', () => {
  it('leaves zoom to the native viewer: no controlled scale, pinch and double-tap enabled', async () => {
    await render(<ZoomablePdf path="/cache/documents/W9.pdf" style={STYLE} onError={jest.fn()} />);

    const props = mockPdfRender.mock.calls[0][0];
    expect(props.source).toEqual({ uri: 'file:///cache/documents/W9.pdf' });
    expect(props).not.toHaveProperty('scale');
    expect(props).not.toHaveProperty('onScaleChanged');
    expect(props).toMatchObject({ minScale: 1, maxScale: 4, enableDoubleTapZoom: true });
  });

  it('does not re-render the viewer when its screen re-renders with the same props (Android would reload the PDF)', async () => {
    const onError = jest.fn();
    const renderer = await render(<ZoomablePdf path="/a.pdf" style={STYLE} onError={onError} />);

    await ReactTestRenderer.act(() => {
      renderer.update(<ZoomablePdf path="/a.pdf" style={STYLE} onError={onError} />);
    });
    expect(mockPdfRender).toHaveBeenCalledTimes(1);

    await ReactTestRenderer.act(() => {
      renderer.update(<ZoomablePdf path="/b.pdf" style={STYLE} onError={onError} />);
    });
    expect(mockPdfRender).toHaveBeenCalledTimes(2);
    expect(mockPdfRender.mock.calls[1][0].source).toEqual({ uri: 'file:///b.pdf' });
  });

  it('passes errors to onError', async () => {
    const onError = jest.fn();
    await render(<ZoomablePdf path="/a.pdf" style={STYLE} onError={onError} />);

    mockPdfRender.mock.calls[0][0].onError(new Error('corrupt'));

    expect(onError).toHaveBeenCalledWith(new Error('corrupt'));
  });
});
