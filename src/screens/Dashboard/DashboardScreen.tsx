import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Card, Header } from '../../components';
import { colors, spacing, typography } from '../../theme';
import { MOCK_PROJECTS, MOCK_TASKS } from '../../constants/mockData';
import { useAuth } from '../../hooks/useAuth';

interface StatTile {
  label: string;
  value: number;
  accent: string;
}

export function DashboardScreen(): React.JSX.Element {
  const { user } = useAuth();

  const stats = useMemo<StatTile[]>(() => {
    const totalProjects = MOCK_PROJECTS.length;
    const activeProjects = MOCK_PROJECTS.filter((p) => p.status === 'in_progress').length;
    const completedProjects = MOCK_PROJECTS.filter((p) => p.status === 'completed').length;
    const pendingTasks = MOCK_TASKS.filter((t) => t.status !== 'completed').length;

    return [
      { label: 'Total Projects', value: totalProjects, accent: colors.primary },
      { label: 'Active Projects', value: activeProjects, accent: colors.statusInProgress },
      { label: 'Completed Projects', value: completedProjects, accent: colors.statusCompleted },
      { label: 'Pending Tasks', value: pendingTasks, accent: colors.statusOnHold },
    ];
  }, []);

  return (
    <ScrollView style={styles.flex} contentContainerStyle={styles.container}>
      <Header title="Dashboard" subtitle={user ? `Welcome back, ${user.fullName}` : undefined} />

      <View style={styles.grid}>
        {stats.map((stat) => (
          <Card key={stat.label} style={styles.statCard}>
            <Text style={[styles.statValue, { color: stat.accent }]}>{stat.value}</Text>
            <Text style={styles.statLabel}>{stat.label}</Text>
          </Card>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  container: { paddingBottom: spacing.xl },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  statCard: {
    width: '47%',
    alignItems: 'flex-start',
  },
  statValue: {
    ...typography.h1,
  },
  statLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
});
