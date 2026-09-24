import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { CheckCircleIcon, ShieldIcon } from '../assets/icons';
import { fontFamily, radius, welcomeColors } from '../theme';
import { PASSWORD_REQUIREMENTS } from '../utils/passwordValidation';

export function PasswordRequirements(): React.JSX.Element {
  return (
    <View style={styles.requirementsBox}>
      <View style={styles.requirementsHeader}>
        <ShieldIcon size={14} color={welcomeColors.accent} />
        <Text style={styles.requirementsTitle}>Requirements:</Text>
      </View>
      {PASSWORD_REQUIREMENTS.map((requirement) => (
        <View key={requirement} style={styles.requirementRow}>
          <CheckCircleIcon size={14} />
          <Text style={styles.requirementText}>{requirement}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  requirementsBox: {
    backgroundColor: welcomeColors.iconWrapperBackground,
    borderWidth: 1,
    borderColor: welcomeColors.cardBorder,
    borderRadius: radius.md,
    padding: 12,
    marginBottom: 14,
  },
  requirementsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  requirementsTitle: {
    fontFamily: fontFamily.semiBold,
    fontWeight: '600',
    fontSize: 11,
    color: welcomeColors.textPrimary,
  },
  requirementRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  requirementText: {
    flex: 1,
    fontFamily: fontFamily.regular,
    fontWeight: '400',
    fontSize: 10.5,
    color: welcomeColors.textSecondary,
  },
});
