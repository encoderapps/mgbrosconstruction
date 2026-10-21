import React, { forwardRef, useImperativeHandle, useRef } from 'react';
import { PixelRatio, StyleSheet, View } from 'react-native';
import Svg, { Text as SvgText } from 'react-native-svg';
import { SignatureFontId, getSignatureFont } from '../constants/signatureFonts';

/** An image size in physical pixels. */
interface PixelSize {
  width: number;
  height: number;
}

// Image sizes in pixels, as the registration API's samples.
const SIGNATURE_SIZE: PixelSize = { width: 500, height: 160 };
const INITIALS_SIZE: PixelSize = { width: 260, height: 160 };
const MAX_SIGNATURE_FONT_SIZE = 72;
/** Room per character at the largest size; longer names get a smaller font so they fit the width. */
const SIGNATURE_CHARACTER_BUDGET = 1000;
const INITIALS_FONT_SIZE = 84;
/** Ink blue, matching the signature and initials drawn on the agreement. */
const INK_COLOR = '#0D1A59';
/** toDataURL has no error callback; give up rather than wait forever. */
const CAPTURE_TIMEOUT_MS = 5000;

export interface SignatureImages {
  /** base64 PNG, without a data: prefix or line breaks. */
  signature: string;
  initials: string;
}

export interface SignatureImageCaptureHandle {
  /** Draws the signature and initials and returns them as base64 PNGs. */
  capture: () => Promise<SignatureImages>;
}

type SignatureImageCaptureProps = {
  name: string;
  initials: string;
  fontId: SignatureFontId;
};

type SvgWithDataUrl = { toDataURL: (callback: (base64: string) => void) => void };

/**
 * The layout size (in dp) that is exactly `size` physical pixels on this
 * screen. toDataURL exports the view at its own pixel size (Android draws it
 * at layout × density; iOS at points × screen scale), so laying it out in dp
 * of the target pixel size gives an image of exactly that size on any screen.
 * (Passing a size to toDataURL instead crops on Android: it makes a bitmap of
 * that many pixels but still draws at layout × density, so a 500 × 160 image
 * only got the top-left corner of the drawing.)
 */
function toLayoutSize({ width, height }: PixelSize): PixelSize {
  const density = PixelRatio.get();
  return { width: width / density, height: height / density };
}

function toPng(svg: SvgWithDataUrl | null): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!svg) {
      reject(new Error('The signature is not ready yet.'));
      return;
    }
    const timer = setTimeout(() => reject(new Error('Creating the signature image took too long.')), CAPTURE_TIMEOUT_MS);
    svg.toDataURL((base64) => {
      clearTimeout(timer);
      // iOS breaks its base64 into lines every 76 characters; the API needs one unbroken string.
      const png = base64?.replace(/\s/g, '');
      if (png) {
        resolve(png);
      } else {
        reject(new Error('The signature image could not be created.'));
      }
    });
  });
}

type SignatureSvgProps = {
  svgRef: React.MutableRefObject<SvgWithDataUrl | null>;
  size: PixelSize;
  text: string;
  fontFamily: string;
  fontSize: number;
};

/** One image: `text` centred in a `size`-pixel canvas (the viewBox is in image pixels). */
function SignatureSvg({ svgRef, size, text, fontFamily, fontSize }: SignatureSvgProps): React.JSX.Element {
  const layout = toLayoutSize(size);
  return (
    <Svg
      ref={(svg) => {
        svgRef.current = svg as unknown as SvgWithDataUrl | null;
      }}
      width={layout.width}
      height={layout.height}
      viewBox={`0 0 ${size.width} ${size.height}`}
    >
      <SvgText
        x={size.width / 2}
        y={size.height / 2 + fontSize / 3}
        fontFamily={fontFamily}
        fontSize={fontSize}
        fill={INK_COLOR}
        textAnchor="middle"
      >
        {text}
      </SvgText>
    </Svg>
  );
}

/**
 * Renders the signature (the name in its handwriting style) and the initials
 * off screen, so they can be exported as PNGs (react-native-svg's toDataURL)
 * for the registration API: 500 × 160 and 260 × 160 pixels, transparent
 * background, ink-blue text.
 */
export const SignatureImageCapture = forwardRef<SignatureImageCaptureHandle, SignatureImageCaptureProps>(
  function SignatureImageCaptureView({ name, initials, fontId }, ref) {
    const signatureRef = useRef<SvgWithDataUrl | null>(null);
    const initialsRef = useRef<SvgWithDataUrl | null>(null);
    const { fontFamily } = getSignatureFont(fontId);
    const signatureFontSize = Math.min(MAX_SIGNATURE_FONT_SIZE, SIGNATURE_CHARACTER_BUDGET / Math.max(name.length, 1));

    useImperativeHandle(ref, () => ({
      capture: async () => ({
        signature: await toPng(signatureRef.current),
        initials: await toPng(initialsRef.current),
      }),
    }));

    return (
      <View
        style={styles.offscreen}
        pointerEvents="none"
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
      >
        <SignatureSvg
          svgRef={signatureRef}
          size={SIGNATURE_SIZE}
          text={name}
          fontFamily={fontFamily}
          fontSize={signatureFontSize}
        />
        <SignatureSvg
          svgRef={initialsRef}
          size={INITIALS_SIZE}
          text={initials}
          fontFamily={fontFamily}
          fontSize={INITIALS_FONT_SIZE}
        />
      </View>
    );
  },
);

const styles = StyleSheet.create({
  // Laid out (so it can be drawn and exported) but placed where it's never seen.
  offscreen: {
    position: 'absolute',
    left: -10000,
    top: 0,
  },
});
