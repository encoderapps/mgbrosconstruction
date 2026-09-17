import React from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { radius, shadows, welcomeColors } from '../theme';

type AuthCardProps = {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
};

export function AuthCard({ children, style }: AuthCardProps): React.JSX.Element {
  return <View style={[styles.card, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: welcomeColors.cardBackground,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: welcomeColors.cardBorder,
    padding: 16,
    ...shadows.sm,
  },
});
