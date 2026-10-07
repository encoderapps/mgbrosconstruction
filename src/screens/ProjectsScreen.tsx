import React, { useCallback } from 'react';
import { FlatList, ListRenderItem, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AuthPrimaryButton } from '../components/AuthPrimaryButton';
import { HomeHeader } from '../components/HomeHeader';
import { LoadStateMessage } from '../components/LoadStateMessage';
import { TableStatusMessage } from '../components/TableStatusMessage';
import {
  PROJECT_ACTION_LABELS,
  ProjectAction,
  SubcontractorProjectCard,
} from '../components/SubcontractorProjectCard';
import { ArrowLeftIcon, PlusIcon } from '../assets/icons';
import { fontFamily, welcomeColors } from '../theme';
import { AuthStackParamList } from '../navigation/types';
import { useAccountList } from '../hooks/useAccountList';
import { fetchSubcontractorProjects } from '../services/subcontractorProjectService';
import { SubcontractorProject } from '../types/subcontractorProject';
import { showComingSoon } from '../utils/comingSoon';

type Props = NativeStackScreenProps<AuthStackParamList, 'Projects'>;

const LOAD_ERROR_TEXT = 'Unable to load projects.';

const keyExtractor = (project: SubcontractorProject): string => project.id;

// TODO: open the project, its files and the add-project form once their APIs and designs exist.
const openProject = (project: SubcontractorProject): void => showComingSoon(project.name);
const runProjectAction = (project: SubcontractorProject, action: ProjectAction): void =>
  showComingSoon(`${PROJECT_ACTION_LABELS[action]} for ${project.name}`);
const addProject = (): void => showComingSoon('Add Project');

/** "View All" from the Home screen's Projects card: every project, with shortcuts to its files. */
export function ProjectsScreen({ navigation }: Props): React.JSX.Element {
  const { items: projects, count, status, reload } = useAccountList(fetchSubcontractorProjects, 'all');
  const hasProjects = projects.length > 0;

  const renderProject: ListRenderItem<SubcontractorProject> = useCallback(
    ({ item }) => <SubcontractorProjectCard project={item} onOpen={openProject} onAction={runProjectAction} />,
    [],
  );

  const renderEmpty = (): React.JSX.Element => {
    if (status === 'error') {
      return <LoadStateMessage state="error" message={LOAD_ERROR_TEXT} onRetry={reload} />;
    }
    if (status !== 'success') {
      return <LoadStateMessage state="loading" />;
    }
    return <Text style={styles.emptyText}>No projects yet.</Text>;
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <HomeHeader />
      <FlatList
        data={projects}
        keyExtractor={keyExtractor}
        renderItem={renderProject}
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
        // Pull to reload; the current list stays on screen until the new one arrives.
        refreshControl={
          <RefreshControl
            refreshing={hasProjects && status === 'loading'}
            onRefresh={reload}
            colors={[welcomeColors.accent]}
            tintColor={welcomeColors.accent}
          />
        }
        ListHeaderComponent={
          <View style={styles.header}>
            <View style={styles.titleRow}>
              <Pressable
                onPress={() => navigation.goBack()}
                hitSlop={10}
                accessibilityRole="button"
                accessibilityLabel="Back"
              >
                <ArrowLeftIcon size={20} color={welcomeColors.textPrimary} />
              </Pressable>
              <Text style={styles.title}>
                Projects
                {count !== null && <Text style={styles.count}> ({count})</Text>}
              </Text>
            </View>
            {/* A failed reload keeps the last list; say so above it rather than failing silently. */}
            {hasProjects && status === 'error' && (
              <TableStatusMessage status="error" errorText={LOAD_ERROR_TEXT} onRetry={reload} />
            )}
          </View>
        }
        ListEmptyComponent={renderEmpty()}
      />
      <View style={styles.footer}>
        <AuthPrimaryButton
          title="Add Project"
          onPress={addProject}
          icon={<PlusIcon size={16} color={welcomeColors.cardBackground} />}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: welcomeColors.background,
  },
  // Same page padding as the Home screen.
  container: {
    flexGrow: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 16,
    gap: 12,
  },
  header: {
    marginBottom: 2,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  title: {
    flex: 1,
    fontFamily: fontFamily.bold,
    fontWeight: '700',
    fontSize: 20,
    color: welcomeColors.textPrimary,
  },
  count: {
    fontFamily: fontFamily.regular,
    fontWeight: '400',
    fontSize: 16,
    color: welcomeColors.accent,
  },
  emptyText: {
    fontFamily: fontFamily.regular,
    fontWeight: '400',
    fontSize: 13,
    color: welcomeColors.textSecondary,
    textAlign: 'center',
    marginTop: 24,
  },
  // Pinned under the list so it's always reachable.
  footer: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
  },
});
