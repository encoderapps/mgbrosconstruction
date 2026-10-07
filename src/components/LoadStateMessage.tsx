import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { fontFamily, welcomeColors } from '../theme';

type LoadStateMessageProps =
  | { state: 'loading' }
  | { state: 'error'; message: string; onRetry: () => void };

/** In-page spinner while a screen's data loads, or its error with a retry. */
export function LoadStateMessage(props: LoadStateMessageProps): React.JSX.Element {
  if (props.state === 'loading') {
    return <ActivityIndicator style={styles.container} color={welcomeColors.accent} accessibilityLabel="Loading" />;
  }
  return (
    <View style={[styles.container, styles.errorBox]}>
      <Text style={styles.message}>{props.message}</Text>
      <Pressable onPress={props.onRetry} hitSlop={8} accessibilityRole="button">
        <Text style={styles.retry}>Try again</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 32,
  },
  errorBox: {
    alignItems: 'center',
    gap: 6,
  },
  message: {
    fontFamily: fontFamily.regular,
    fontWeight: '400',
    fontSize: 13,
    color: welcomeColors.textSecondary,
    textAlign: 'center',
  },
  retry: {
    fontFamily: fontFamily.semiBold,
    fontWeight: '600',
    fontSize: 13,
    color: welcomeColors.link,
  },
});
