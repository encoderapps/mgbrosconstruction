import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Card } from './Card';
import { StatusBadge } from './StatusBadge';
import { colors, spacing, typography } from '../theme';
import { Task } from '../types/task';

interface TaskCardProps {
  task: Task;
}

export function TaskCard({ task }: TaskCardProps): React.JSX.Element {
  return (
    <Card style={styles.card}>
      <View style={styles.headerRow}>
        <Text style={styles.name}>{task.name}</Text>
        <StatusBadge value={task.priority} />
      </View>
      <Text style={styles.meta}>{task.projectName}</Text>
      <View style={styles.footerRow}>
        <Text style={styles.meta}>Assigned to {task.assignedTo}</Text>
        <Text style={styles.meta}>Due {task.dueDate}</Text>
      </View>
      <StatusBadge value={task.status} />
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: spacing.md,
    gap: spacing.xs,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  name: {
    ...typography.subtitle,
    color: colors.textPrimary,
    flexShrink: 1,
    marginRight: spacing.sm,
  },
  meta: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
});
