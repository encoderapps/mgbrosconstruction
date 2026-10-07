import React from 'react';
import { Pressable, StyleProp, StyleSheet, Text, ViewStyle } from 'react-native';
import { fontFamily, radius, welcomeColors } from '../theme';

type AuthPrimaryButtonProps = {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  /** Shown before the title, e.g. a plus for "Add Project". */
  icon?: React.ReactNode;
};

export function AuthPrimaryButton({
  title,
  onPress,
  disabled,
  style,
  icon,
}: AuthPrimaryButtonProps): React.JSX.Element {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [styles.button, (pressed || disabled) && styles.pressed, style]}
      accessibilityRole="button"
      accessibilityState={{ disabled }}
    >
      {icon}
      <Text style={styles.text}>{title}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: welcomeColors.loginButton,
    borderRadius: radius.md,
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  pressed: {
    opacity: 0.85,
  },
  text: {
    fontFamily: fontFamily.semiBold,
    fontWeight: '600',
    fontSize: 15,
    lineHeight: 22.5,
    color: welcomeColors.cardBackground,
    textAlign: 'center',
  },
});
