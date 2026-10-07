import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { LoadStatus } from '../hooks/useAsyncResource';
import { fontFamily, welcomeColors } from '../theme';

type TableStatusMessageProps = {
  status: Exclude<LoadStatus, 'success'>;
  errorText: string;
  onRetry?: () => void;
};

/** What a Home list shows in place of its rows: a spinner while loading, or the error with a retry. */
export function TableStatusMessage({ status, errorText, onRetry }: TableStatusMessageProps): React.JSX.Element {
  return (
    <View style={styles.message}>
      {status === 'error' ? (
        <>
          <Text style={styles.messageText}>{errorText}</Text>
          {onRetry && (
            <Pressable onPress={onRetry} hitSlop={8} accessibilityRole="button">
              <Text style={styles.retryText}>Try again</Text>
            </Pressable>
          )}
        </>
      ) : (
        <ActivityIndicator color={welcomeColors.accent} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  message: {
    alignItems: 'center',
    gap: 6,
    paddingVertical: 18,
  },
  messageText: {
    fontFamily: fontFamily.regular,
    fontWeight: '400',
    fontSize: 12,
    color: welcomeColors.textSecondary,
  },
  retryText: {
    fontFamily: fontFamily.semiBold,
    fontWeight: '600',
    fontSize: 12,
    color: welcomeColors.link,
  },
});
