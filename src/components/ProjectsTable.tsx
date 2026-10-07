import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { BriefcaseIcon, ChevronRightIcon } from '../assets/icons';
import { LoadStatus } from '../hooks/useAsyncResource';
import { fontFamily, welcomeColors } from '../theme';
import { SubcontractorProject } from '../types/subcontractorProject';
import { TableStatusMessage } from './TableStatusMessage';

type ProjectsTableProps = {
  projects: SubcontractorProject[];
  status: LoadStatus;
  onRetry: () => void;
  onProjectPress: (project: SubcontractorProject) => void;
};

/** The Home screen's Projects preview: a brown "Project" header over one tappable row per project. */
export function ProjectsTable({ projects, status, onRetry, onProjectPress }: ProjectsTableProps): React.JSX.Element {
  if (status !== 'success') {
    return <TableStatusMessage status={status} errorText="Unable to load projects." onRetry={onRetry} />;
  }

  return (
    <View>
      <Text style={styles.headerRow}>Project</Text>
      {projects.length === 0 ? (
        <Text style={styles.emptyText}>No projects yet.</Text>
      ) : (
        <View style={styles.rows}>
          {projects.map((project, index) => (
            <Pressable
              key={project.id}
              onPress={() => onProjectPress(project)}
              style={({ pressed }) => [styles.row, index > 0 && styles.rowDivider, pressed && styles.pressed]}
              accessibilityRole="link"
            >
              <View style={styles.iconWrapper}>
                <BriefcaseIcon size={14} color={welcomeColors.accent} />
              </View>
              <Text style={styles.name} numberOfLines={1}>
                {project.name}
              </Text>
              <ChevronRightIcon size={14} color={welcomeColors.accent} />
            </Pressable>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  // Matches DataTable's header row.
  headerRow: {
    backgroundColor: welcomeColors.loginButton,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontFamily: fontFamily.semiBold,
    fontWeight: '600',
    fontSize: 11,
    color: welcomeColors.cardBackground,
  },
  rows: {
    paddingHorizontal: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
  },
  rowDivider: {
    borderTopWidth: 1,
    borderTopColor: welcomeColors.cardBorder,
  },
  iconWrapper: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: welcomeColors.iconWrapperBackground,
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: {
    flex: 1,
    fontFamily: fontFamily.medium,
    fontWeight: '500',
    fontSize: 12,
    color: welcomeColors.link,
  },
  pressed: {
    opacity: 0.7,
  },
  emptyText: {
    fontFamily: fontFamily.regular,
    fontWeight: '400',
    fontSize: 11,
    color: welcomeColors.textSecondary,
    paddingHorizontal: 12,
    paddingVertical: 14,
  },
});
