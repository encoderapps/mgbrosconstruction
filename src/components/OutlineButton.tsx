import React from 'react';
import { ActivityIndicator, Pressable, StyleProp, StyleSheet, Text, ViewStyle } from 'react-native';
import { fontFamily, radius, welcomeColors } from '../theme';

type OutlineButtonProps = {
  title: string;
  onPress: () => void;
  /** Shown before the title. */
  icon?: React.ReactNode;
  disabled?: boolean;
  /** Shows a spinner in place of the icon while its action runs. */
  isBusy?: boolean;
  style?: StyleProp<ViewStyle>;
};

/** The white, outlined counterpart to AuthPrimaryButton, for secondary actions (Download, Print, Share…). */
export function OutlineButton({ title, onPress, icon, disabled, isBusy, style }: OutlineButtonProps): React.JSX.Element {
  const isDisabled = disabled || isBusy;
  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => [styles.button, (pressed || isDisabled) && styles.dimmed, style]}
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled, busy: isBusy }}
    >
      {isBusy ? <ActivityIndicator size="small" color={welcomeColors.loginButton} /> : icon}
      <Text style={styles.title}>{title}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    height: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: welcomeColors.loginButton,
    borderRadius: radius.md,
    backgroundColor: welcomeColors.cardBackground,
  },
  dimmed: {
    opacity: 0.6,
  },
  title: {
    fontFamily: fontFamily.semiBold,
    fontWeight: '600',
    fontSize: 14,
    color: welcomeColors.textPrimary,
  },
});
