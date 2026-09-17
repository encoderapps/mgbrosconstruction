import React from 'react';
import { FlatList, StyleSheet } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { EmptyState, Header, ProjectCard } from '../../components';
import { colors, spacing } from '../../theme';
import { MOCK_PROJECTS } from '../../constants/mockData';
import { Project } from '../../types/project';
import { ProjectsStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<ProjectsStackParamList, 'ProjectsList'>;

export function ProjectsListScreen({ navigation }: Props): React.JSX.Element {
  const handlePress = (project: Project): void => {
    navigation.navigate('ProjectDetails', { projectId: project._id });
  };

  return (
    <FlatList
      style={styles.flex}
      contentContainerStyle={styles.container}
      data={MOCK_PROJECTS}
      keyExtractor={(item) => item._id}
      ListHeaderComponent={<Header title="Projects" subtitle={`${MOCK_PROJECTS.length} construction projects`} />}
      renderItem={({ item }) => <ProjectCard project={item} onPress={handlePress} />}
      ListEmptyComponent={<EmptyState title="No projects yet" description="Projects you're assigned to will appear here." />}
    />
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  container: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xl },
});
