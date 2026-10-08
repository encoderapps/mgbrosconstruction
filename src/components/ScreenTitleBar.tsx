import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ArrowLeftIcon } from '../assets/icons';
import { fontFamily, radius, welcomeColors } from '../theme';

type ScreenTitleBarProps = {
  title: string;
  onBackPress: () => void;
  /** e.g. while the screen is saving, so its result isn't lost. */
  backDisabled?: boolean;
};

/** The brown bar under the header with a back arrow and the screen's centred title (Bid Details and its forms). */
export function ScreenTitleBar({ title, onBackPress, backDisabled = false }: ScreenTitleBarProps): React.JSX.Element {
  return (
    <View style={styles.bar}>
      <Pressable
        onPress={onBackPress}
        disabled={backDisabled}
        hitSlop={10}
        style={[styles.backButton, backDisabled && styles.backDisabled]}
        accessibilityRole="button"
        accessibilityLabel="Back"
        accessibilityState={{ disabled: backDisabled }}
      >
        <ArrowLeftIcon size={18} color={welcomeColors.cardBackground} />
      </Pressable>
      <Text style={styles.title} numberOfLines={1} accessibilityRole="header">
        {title}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    height: 38,
    borderRadius: radius.sm,
    backgroundColor: welcomeColors.loginButton,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 44,
    marginBottom: 12,
  },
  // Pinned left so the title stays centred on the bar.
  backButton: {
    position: 'absolute',
    left: 14,
  },
  backDisabled: {
    opacity: 0.5,
  },
  title: {
    fontFamily: fontFamily.semiBold,
    fontWeight: '600',
    fontSize: 14,
    color: welcomeColors.cardBackground,
  },
});
