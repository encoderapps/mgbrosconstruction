import React, { memo, useMemo } from 'react';
import { ActivityIndicator, StyleProp, ViewStyle } from 'react-native';
import Pdf from 'react-native-pdf';
import { welcomeColors } from '../theme';

const MIN_SCALE = 1;
const MAX_SCALE = 4;

type ZoomablePdfProps = {
  /** A local file path (e.g. in the cache), without the file:// prefix. */
  path: string;
  style?: StyleProp<ViewStyle>;
  /** Must be stable (useCallback): a new function re-renders the viewer. */
  onError: (error: object) => void;
};

const renderActivityIndicator = (): React.JSX.Element => <ActivityIndicator color={welcomeColors.accent} />;

/**
 * A local PDF the user can pinch- and double-tap-zoom.
 *
 * Zoom is left entirely to the native viewer: on Android react-native-pdf
 * reloads the whole document whenever any of its props change, so feeding the
 * zoom back in as a `scale` prop (via onScaleChanged) reloads it many times a
 * second mid-pinch, and the native renderer crashes the app. For the same
 * reason this component is memoised, so its screen re-rendering (e.g. while a
 * download runs) doesn't re-render the viewer; pass a stable style and onError.
 */
export const ZoomablePdf = memo(function ZoomablePdfView({ path, style, onError }: ZoomablePdfProps) {
  const source = useMemo(() => ({ uri: `file://${path}` }), [path]);

  return (
    <Pdf
      source={source}
      style={style}
      fitPolicy={0}
      minScale={MIN_SCALE}
      maxScale={MAX_SCALE}
      enableDoubleTapZoom
      trustAllCerts={false}
      renderActivityIndicator={renderActivityIndicator}
      onError={onError}
    />
  );
});
