import React from 'react';
import { StyleSheet, Text, TouchableOpacity } from 'react-native';
import { Card } from './Card';
import { StatusBadge } from './StatusBadge';
import { ProgressBar } from './ProgressBar';
import { colors, spacing, typography } from '../theme';
import { Project } from '../types/project';

interface ProjectCardProps {
  project: Project;
  onPress?: (project: Project) => void;
}

export function ProjectCard({ project, onPress }: ProjectCardProps): React.JSX.Element {
  return (
    <TouchableOpacity activeOpacity={0.85} onPress={() => onPress?.(project)}>
      <Card style={styles.card}>
        <Text style={styles.name}>{project.name}</Text>
        <Text style={styles.meta}>
          {project.location} · {project.client}
        </Text>
        <StatusBadge value={project.status} />
        <ProgressBar progress={project.progressPercentage} />
        <Text style={styles.progressLabel}>{project.progressPercentage}% complete</Text>
      </Card>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  name: {
    ...typography.subtitle,
    color: colors.textPrimary,
  },
  meta: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  progressLabel: {
    ...typography.small,
    color: colors.textSecondary,
  },
});
