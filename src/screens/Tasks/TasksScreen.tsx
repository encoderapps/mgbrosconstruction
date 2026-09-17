import React from 'react';
import { FlatList, StyleSheet } from 'react-native';
import { EmptyState, Header, TaskCard } from '../../components';
import { colors, spacing } from '../../theme';
import { MOCK_TASKS } from '../../constants/mockData';

export function TasksScreen(): React.JSX.Element {
  return (
    <FlatList
      style={styles.flex}
      contentContainerStyle={styles.container}
      data={MOCK_TASKS}
      keyExtractor={(item) => item._id}
      ListHeaderComponent={<Header title="Tasks" subtitle={`${MOCK_TASKS.length} tasks across your projects`} />}
      renderItem={({ item }) => <TaskCard task={item} />}
      ListEmptyComponent={<EmptyState title="No tasks yet" description="Tasks assigned to you will appear here." />}
    />
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  container: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xl },
});
