import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { InfoIcon } from '../assets/icons';
import { fontFamily, portalColors, radius, welcomeColors } from '../theme';

/** A short explanatory line with an info icon, on a beige panel. */
export function InfoNote({ children }: { children: React.ReactNode }): React.JSX.Element {
  return (
    <View style={styles.note}>
      <InfoIcon size={16} color={welcomeColors.textSecondary} />
      <Text style={styles.text}>{children}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  note: {
    flexDirection: 'row',
    gap: 8,
    backgroundColor: portalColors.unreadBackground,
    borderWidth: 1,
    borderColor: welcomeColors.cardBorder,
    borderRadius: radius.sm,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  text: {
    flex: 1,
    fontFamily: fontFamily.regular,
    fontWeight: '400',
    fontSize: 12,
    lineHeight: 18,
    color: welcomeColors.textSecondary,
  },
});
