import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Card, EmptyState, Header, ProgressBar, StatusBadge, TaskCard } from '../../components';
import { colors, spacing, typography } from '../../theme';
import { MOCK_PROJECT_DETAILS, MOCK_TASKS } from '../../constants/mockData';
import { ProjectsStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<ProjectsStackParamList, 'ProjectDetails'>;

export function ProjectDetailsScreen({ route }: Props): React.JSX.Element {
  const { projectId } = route.params;
  const project = MOCK_PROJECT_DETAILS[projectId];

  if (!project) {
    return <EmptyState title="Project not found" />;
  }

  const projectTasks = MOCK_TASKS.filter((task) => task.projectName === project.name);

  return (
    <ScrollView style={styles.flex} contentContainerStyle={styles.container}>
      <Header title={project.name} subtitle={`${project.location} · ${project.client}`} />

      <Card style={styles.section}>
        <View style={styles.row}>
          <Text style={styles.label}>Status</Text>
          <StatusBadge value={project.status} />
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Start Date</Text>
          <Text style={styles.value}>{project.startDate}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Expected Completion</Text>
          <Text style={styles.value}>{project.expectedCompletionDate}</Text>
        </View>
        <Text style={styles.label}>Progress ({project.progressPercentage}%)</Text>
        <ProgressBar progress={project.progressPercentage} />
      </Card>

      <Text style={styles.sectionTitle}>Team Members</Text>
      <Card style={styles.section}>
        {project.team.map((member) => (
          <View key={member._id} style={styles.row}>
            <Text style={styles.value}>{member.name}</Text>
            <Text style={styles.label}>{member.role}</Text>
          </View>
        ))}
      </Card>

      <Text style={styles.sectionTitle}>Tasks</Text>
      {projectTasks.length === 0 ? (
        <EmptyState title="No tasks for this project yet" />
      ) : (
        projectTasks.map((task) => <TaskCard key={task._id} task={task} />)
      )}

      <Text style={styles.sectionTitle}>Documents</Text>
      <Card style={styles.section}>
        {project.documents.map((doc) => (
          <Text key={doc._id} style={styles.value}>
            {doc.name}
          </Text>
        ))}
      </Card>

      <Text style={styles.sectionTitle}>Updates</Text>
      <Card style={styles.section}>
        {project.updates.map((update) => (
          <View key={update._id} style={styles.updateItem}>
            <Text style={styles.value}>{update.message}</Text>
            <Text style={styles.label}>
              {update.authorName} · {update.createdAt}
            </Text>
          </View>
        ))}
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  container: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xl, gap: spacing.sm },
  section: { marginBottom: spacing.md, gap: spacing.sm },
  sectionTitle: { ...typography.subtitle, color: colors.textPrimary, marginBottom: spacing.sm },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  label: { ...typography.caption, color: colors.textSecondary },
  value: { ...typography.body, color: colors.textPrimary },
  updateItem: { marginBottom: spacing.sm },
});
