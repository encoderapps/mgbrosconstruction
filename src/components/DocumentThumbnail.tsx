import React from 'react';
import { DimensionValue, StyleSheet, View } from 'react-native';
import { portalColors, radius, shadows, welcomeColors } from '../theme';

/** Widths of the page's text lines, so it reads as a filled-in form. */
const LINE_WIDTHS: readonly DimensionValue[] = ['90%', '60%', '100%', '100%', '70%', '100%', '50%'];

/** Stand-in preview of an uploaded PDF: a page with a few text lines. */
export function DocumentThumbnail(): React.JSX.Element {
  return (
    <View style={styles.thumbnail} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <View style={styles.page}>
        {LINE_WIDTHS.map((width, index) => (
          <View key={index} style={[styles.line, { width }]} />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  thumbnail: {
    width: 112,
    height: 104,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: welcomeColors.cardBorder,
    backgroundColor: portalColors.thumbnailBackground,
    alignItems: 'center',
    justifyContent: 'center',
  },
  page: {
    width: 62,
    height: 80,
    padding: 7,
    gap: 5,
    backgroundColor: welcomeColors.cardBackground,
    ...shadows.sm,
  },
  line: {
    height: 3,
    borderRadius: 1,
    backgroundColor: portalColors.thumbnailLine,
  },
});
