import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { fontFamily, radius, Tone, toneColors } from '../theme';

type StatusPillProps = {
  label: string;
  tone: Tone;
};

/** A small rounded status label tinted by its tone, e.g. a green "Won". */
export function StatusPill({ label, tone }: StatusPillProps): React.JSX.Element {
  const colors = toneColors[tone];
  return (
    <View style={[styles.pill, { backgroundColor: colors.background }]}>
      <Text style={[styles.label, { color: colors.foreground }]} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  // Sized to its label; the parent decides where it sits (e.g. alignItems).
  pill: {
    borderRadius: radius.sm,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  label: {
    fontFamily: fontFamily.semiBold,
    fontWeight: '600',
    fontSize: 10,
    lineHeight: 14,
  },
});
