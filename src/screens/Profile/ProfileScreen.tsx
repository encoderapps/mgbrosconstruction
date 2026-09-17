import React from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Button, Card, Header } from '../../components';
import { colors, spacing, typography } from '../../theme';
import { useAuth } from '../../hooks/useAuth';

export function ProfileScreen(): React.JSX.Element {
  const { user, logout } = useAuth();

  const handleLogout = (): void => {
    Alert.alert('Log out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log Out', style: 'destructive', onPress: () => logout() },
    ]);
  };

  return (
    <ScrollView style={styles.flex} contentContainerStyle={styles.container}>
      <Header title="Profile" />

      <Card style={styles.section}>
        <View style={styles.row}>
          <Text style={styles.label}>Full Name</Text>
          <Text style={styles.value}>{user?.fullName ?? '-'}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Email</Text>
          <Text style={styles.value}>{user?.email ?? '-'}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Phone</Text>
          <Text style={styles.value}>{user?.phone ?? '-'}</Text>
        </View>
      </Card>

      <Button
        title="Edit Profile"
        variant="outline"
        onPress={() => Alert.alert('Edit Profile', 'Profile editing is coming in a future update.')}
      />
      <View style={styles.spacer} />
      <Button title="Logout" variant="secondary" onPress={handleLogout} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  container: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xl },
  section: { marginBottom: spacing.lg, gap: spacing.sm },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  label: { ...typography.caption, color: colors.textSecondary },
  value: { ...typography.bodyMedium, color: colors.textPrimary },
  spacer: { height: spacing.sm },
});
