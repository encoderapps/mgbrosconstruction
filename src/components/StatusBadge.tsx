import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing, typography } from '../theme';
import { ProjectStatus } from '../types/project';
import { TaskPriority, TaskStatus } from '../types/task';

type BadgeValue = ProjectStatus | TaskStatus | TaskPriority;

const LABELS: Record<BadgeValue, string> = {
  planned: 'Planned',
  in_progress: 'In Progress',
  completed: 'Completed',
  on_hold: 'On Hold',
  delayed: 'Delayed',
  todo: 'To Do',
  low: 'Low',
  medium: 'Medium',
  high: 'High',
};

const BADGE_COLORS: Record<BadgeValue, string> = {
  planned: colors.statusPlanned,
  in_progress: colors.statusInProgress,
  completed: colors.statusCompleted,
  on_hold: colors.statusOnHold,
  delayed: colors.statusDelayed,
  todo: colors.statusPlanned,
  low: colors.priorityLow,
  medium: colors.priorityMedium,
  high: colors.priorityHigh,
};

interface StatusBadgeProps {
  value: BadgeValue;
}

export function StatusBadge({ value }: StatusBadgeProps): React.JSX.Element {
  const color = BADGE_COLORS[value];

  return (
    <View style={[styles.badge, { backgroundColor: `${color}1F` }]}>
      <Text style={[styles.label, { color }]}>{LABELS[value]}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
  },
  label: {
    ...typography.small,
    fontWeight: '600',
  },
});
