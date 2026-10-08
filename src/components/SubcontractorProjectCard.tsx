import React, { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { CameraIcon, ChevronRightIcon, DocumentIcon, FolderIcon, RulerIcon } from '../assets/icons';
import { fontFamily, welcomeColors } from '../theme';
import { SubcontractorProject } from '../types/subcontractorProject';
import { ActionChip } from './ActionChip';
import { AuthCard } from './AuthCard';

export type ProjectAction = 'blueprint' | 'designPanel' | 'scans' | 'photos';

/** Names shown to the user for each action, also used in "coming soon" messages. */
export const PROJECT_ACTION_LABELS: Record<ProjectAction, string> = {
  blueprint: 'View Blueprint',
  designPanel: 'Show Design Panel',
  scans: 'Scans',
  photos: 'Photos',
};

/** The shortcut buttons, in display order. */
const ACTIONS: readonly { key: ProjectAction; Icon: React.ComponentProps<typeof ActionChip>['Icon'] }[] = [
  { key: 'blueprint', Icon: DocumentIcon },
  { key: 'designPanel', Icon: RulerIcon },
  { key: 'scans', Icon: DocumentIcon },
  { key: 'photos', Icon: CameraIcon },
];

type SubcontractorProjectCardProps = {
  project: SubcontractorProject;
  onOpen: (project: SubcontractorProject) => void;
  onAction: (project: SubcontractorProject, action: ProjectAction) => void;
};

/**
 * A project in the full Projects list: its name (opens the project) above a
 * row of shortcuts to its blueprint, design panel, scans and photos.
 * Memoised, as the list re-renders while scrolling; pass stable callbacks.
 */
export const SubcontractorProjectCard = memo(function SubcontractorProjectCardView({
  project,
  onOpen,
  onAction,
}: SubcontractorProjectCardProps): React.JSX.Element {
  return (
    <AuthCard style={styles.card}>
      <Pressable
        onPress={() => onOpen(project)}
        style={({ pressed }) => [styles.header, pressed && styles.pressed]}
        accessibilityRole="button"
        accessibilityLabel={`Open ${project.name}`}
      >
        <View style={styles.iconWrapper}>
          <FolderIcon size={18} color={welcomeColors.accent} />
        </View>
        <Text style={styles.name} numberOfLines={1}>
          {project.name}
        </Text>
        <ChevronRightIcon size={16} color={welcomeColors.accent} />
      </Pressable>

      <View style={styles.actions}>
        {ACTIONS.map(({ key, Icon }) => (
          <ActionChip
            key={key}
            label={PROJECT_ACTION_LABELS[key]}
            Icon={Icon}
            onPress={() => onAction(project, key)}
            accessibilityLabel={`${PROJECT_ACTION_LABELS[key]}, ${project.name}`}
          />
        ))}
      </View>
    </AuthCard>
  );
});

const styles = StyleSheet.create({
  card: {
    paddingVertical: 12,
    gap: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: welcomeColors.cardBorder,
  },
  iconWrapper: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: welcomeColors.iconWrapperBackground,
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: {
    flex: 1,
    fontFamily: fontFamily.semiBold,
    fontWeight: '600',
    fontSize: 15,
    color: welcomeColors.textPrimary,
  },
  // Wraps onto a second line on narrow screens rather than overflowing.
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  pressed: {
    opacity: 0.7,
  },
});
