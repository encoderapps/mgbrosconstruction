import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Card, Header } from '../../components';
import { colors, spacing, typography } from '../../theme';

const APP_VERSION = '1.0.0';

export function SettingsScreen(): React.JSX.Element {
  return (
    <ScrollView style={styles.flex} contentContainerStyle={styles.container}>
      <Header title="Settings" />

      <Card style={styles.section}>
        <View style={styles.row}>
          <Text style={styles.label}>App Version</Text>
          <Text style={styles.value}>{APP_VERSION}</Text>
        </View>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  container: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xl },
  section: { gap: spacing.sm },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  label: { ...typography.caption, color: colors.textSecondary },
  value: { ...typography.bodyMedium, color: colors.textPrimary },
});
