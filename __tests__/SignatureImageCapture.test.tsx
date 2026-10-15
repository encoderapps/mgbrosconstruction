import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import { PixelRatio } from 'react-native';
import { SignatureImageCapture, SignatureImageCaptureHandle } from '../src/components/SignatureImageCapture';

const mockToDataUrl = jest.fn();

// A stand-in Svg whose toDataURL returns base64 split over lines, as iOS does.
jest.mock('react-native-svg', () => {
  const ReactInMock = jest.requireActual<typeof React>('react');
  class MockSvg extends ReactInMock.Component<Record<string, unknown>> {
    toDataURL(callback: (base64: string) => void, ...rest: unknown[]): void {
      mockToDataUrl(...rest);
      callback('iVBORw0K\nGgoAAAAN\r\nSUhEUg==');
    }
    render(): React.ReactNode {
      return ReactInMock.createElement('MockSvg', this.props, this.props.children as React.ReactNode);
    }
  }
  return { __esModule: true, default: MockSvg, Text: 'MockSvgText' };
});

describe('SignatureImageCapture', () => {
  beforeEach(() => {
    jest.spyOn(PixelRatio, 'get').mockReturnValue(2.75);
    mockToDataUrl.mockClear();
  });

  it('lays each image out at its pixel size on this screen, with the viewBox in image pixels', async () => {
    let renderer!: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(<SignatureImageCapture name="Maya Bennett" initials="MB" fontId="SignatureFont1" />);
    });

    const [signature, initials] = renderer.root.findAll((node) => (node.type as unknown) === 'MockSvg');
    expect(signature.props).toMatchObject({ width: 500 / 2.75, height: 160 / 2.75, viewBox: '0 0 500 160' });
    expect(initials.props).toMatchObject({ width: 260 / 2.75, height: 160 / 2.75, viewBox: '0 0 260 160' });
  });

  it('exports both images at the view size, as single-line base64', async () => {
    const ref = React.createRef<SignatureImageCaptureHandle>();
    await ReactTestRenderer.act(() => {
      ReactTestRenderer.create(<SignatureImageCapture ref={ref} name="Maya Bennett" initials="MB" fontId="SignatureFont1" />);
    });

    await expect(ref.current?.capture()).resolves.toEqual({
      signature: 'iVBORw0KGgoAAAANSUhEUg==',
      initials: 'iVBORw0KGgoAAAANSUhEUg==',
    });
    // No size passed: on Android that crops the drawing instead of scaling it.
    expect(mockToDataUrl).toHaveBeenCalledTimes(2);
    mockToDataUrl.mock.calls.forEach((args) => expect(args).toEqual([]));
  });
});
