import React from 'react';
import { Pressable, StyleProp, StyleSheet, Text, ViewStyle } from 'react-native';
import { fontFamily, radius, welcomeColors } from '../theme';

type AuthPrimaryButtonProps = {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
};

export function AuthPrimaryButton({
  title,
  onPress,
  disabled,
  style,
}: AuthPrimaryButtonProps): React.JSX.Element {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [styles.button, (pressed || disabled) && styles.pressed, style]}
    >
      <Text style={styles.text}>{title}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: welcomeColors.loginButton,
    borderRadius: radius.md,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
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
