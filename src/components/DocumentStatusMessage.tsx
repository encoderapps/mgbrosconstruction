import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { CheckCircleOutlineIcon, WarningIcon } from '../assets/icons';
import { fontFamily, radius, toneColors } from '../theme';
import { DocumentStatus } from '../utils/complianceDocument';

/**
 * A document's status: a plain line with a check when all is well, a
 * highlighted banner with a warning icon when it's expiring or expired.
 */
export function DocumentStatusMessage({ status }: { status: DocumentStatus }): React.JSX.Element {
  const colors = toneColors[status.tone];
  const isOk = status.tone === 'success';

  return (
    <View
      style={[styles.row, !isOk && [styles.banner, { backgroundColor: colors.background, borderColor: colors.border }]]}
      accessibilityRole={isOk ? undefined : 'alert'}
    >
      {isOk ? (
        <CheckCircleOutlineIcon size={18} color={colors.foreground} />
      ) : (
        <WarningIcon size={18} color={colors.foreground} />
      )}
      <Text style={[styles.text, { color: colors.foreground }]}>{status.message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  banner: {
    borderWidth: 1,
    borderRadius: radius.sm,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  text: {
    flex: 1,
    fontFamily: fontFamily.semiBold,
    fontWeight: '600',
    fontSize: 13,
  },
});
