import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { fontFamily, radius, welcomeColors } from '../theme';

type IconComponent = (props: { size?: number; color?: string }) => React.JSX.Element;

type ActionChipProps = {
  label: string;
  Icon: IconComponent;
  /** Left out while the action isn't available yet: the chip is shown dimmed and can't be tapped. */
  onPress?: () => void;
  /** Read by screen readers instead of the label, e.g. to add which project it's for. */
  accessibilityLabel?: string;
};

/** A small outlined shortcut button with an icon, e.g. "View Blueprint" on a project. */
export function ActionChip({ label, Icon, onPress, accessibilityLabel }: ActionChipProps): React.JSX.Element {
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      hitSlop={4}
      style={({ pressed }) => [styles.chip, pressed && styles.pressed, !onPress && styles.disabled]}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ disabled: !onPress }}
    >
      <Icon size={11} color={welcomeColors.accent} />
      <Text style={styles.label} numberOfLines={1}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: welcomeColors.accent,
    borderRadius: radius.sm,
    paddingHorizontal: 6,
    paddingVertical: 5,
  },
  label: {
    fontFamily: fontFamily.medium,
    fontWeight: '500',
    fontSize: 10,
    color: welcomeColors.textPrimary,
  },
  pressed: {
    opacity: 0.7,
  },
  disabled: {
    opacity: 0.45,
  },
});
