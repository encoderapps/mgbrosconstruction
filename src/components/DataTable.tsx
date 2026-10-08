import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { LoadStatus } from '../hooks/useAsyncResource';
import { fontFamily, welcomeColors } from '../theme';
import { TableStatusMessage } from './TableStatusMessage';

export interface DataTableColumn<Row> {
  key: string;
  label: string;
  /** Fixed width: the table can be wider than the screen and scrolls sideways. */
  width: number;
  /**
   * Widens this column (from `width`) to take up any spare room when the table
   * is narrower than its container, so the header always spans the full width.
   */
  grow?: boolean;
  align?: 'left' | 'right';
  /** Shown in the link style (blue, medium weight), like a record name. */
  isLink?: boolean;
  getValue: (row: Row) => string;
  /** Text colour for this column's cell in `row` (e.g. green for "Signed"); the default when undefined. */
  getColor?: (row: Row) => string | undefined;
  /** Makes this column's cells tappable (e.g. the name opens the record). */
  onPress?: (row: Row) => void;
  /** Custom cell content (e.g. a status pill) in place of the getValue text, which stays the accessible label. */
  renderCell?: (row: Row) => React.ReactNode;
}

type DataTableProps<Row> = {
  columns: DataTableColumn<Row>[];
  rows: Row[];
  getRowKey: (row: Row) => string;
  emptyText: string;
  /** For a list loaded from the API: shows a spinner while loading and an error with retry. */
  status?: LoadStatus;
  errorText?: string;
  onRetry?: () => void;
};

/** The Home screen's list tables (Purchase Orders, Invoices), with a brown header row. */
export function DataTable<Row>({
  columns,
  rows,
  getRowKey,
  emptyText,
  status = 'success',
  errorText = 'Unable to load this list.',
  onRetry,
}: DataTableProps<Row>): React.JSX.Element {
  if (status !== 'success') {
    return <TableStatusMessage status={status} errorText={errorText} onRetry={onRetry} />;
  }
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator
      persistentScrollbar
      nestedScrollEnabled
      contentContainerStyle={styles.scrollContent}
    >
      <View style={styles.table}>
        <View style={[styles.row, styles.headerRow]}>
          {columns.map((column) => (
            <Text
              key={column.key}
              style={[styles.headerCell, columnWidth(column), column.align === 'right' && styles.alignRight]}
              numberOfLines={1}
            >
              {column.label}
            </Text>
          ))}
        </View>

        {rows.length === 0 ? (
          <Text style={styles.emptyText}>{emptyText}</Text>
        ) : (
          rows.map((row, index) => (
            <View key={getRowKey(row)} style={[styles.row, index > 0 && styles.rowDivider]}>
              {columns.map((column) => {
                const { onPress } = column;
                // Only override when a colour is given: `color: undefined` would wipe the cell's own colour.
                const color = column.getColor?.(row);
                const cell = column.renderCell ? (
                  <View
                    style={[styles.customCell, columnWidth(column), column.align === 'right' && styles.alignEnd]}
                    accessible
                    accessibilityLabel={column.getValue(row)}
                  >
                    {column.renderCell(row)}
                  </View>
                ) : (
                  <Text
                    style={[
                      styles.cellText,
                      columnWidth(column),
                      column.isLink && styles.linkText,
                      column.align === 'right' && styles.alignRight,
                      color !== undefined && { color },
                    ]}
                    numberOfLines={1}
                  >
                    {column.getValue(row)}
                  </Text>
                );
                return onPress ? (
                  <Pressable key={column.key} onPress={() => onPress(row)} hitSlop={6} accessibilityRole="link">
                    {cell}
                  </Pressable>
                ) : (
                  <React.Fragment key={column.key}>{cell}</React.Fragment>
                );
              })}
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}

function columnWidth<Row>(column: DataTableColumn<Row>) {
  return column.grow ? { minWidth: column.width, flexGrow: 1, flexBasis: column.width } : { width: column.width };
}

const styles = StyleSheet.create({
  // At least as wide as the container, so rows and the header fill it.
  scrollContent: {
    flexGrow: 1,
  },
  table: {
    flexGrow: 1,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 11,
    gap: 8,
  },
  headerRow: {
    backgroundColor: welcomeColors.loginButton,
    paddingVertical: 9,
  },
  rowDivider: {
    borderTopWidth: 1,
    borderTopColor: welcomeColors.cardBorder,
  },
  headerCell: {
    fontFamily: fontFamily.semiBold,
    fontWeight: '600',
    fontSize: 11,
    color: welcomeColors.cardBackground,
  },
  cellText: {
    fontFamily: fontFamily.regular,
    fontWeight: '400',
    fontSize: 11,
    lineHeight: 15,
    color: welcomeColors.textPrimary,
  },
  linkText: {
    fontFamily: fontFamily.medium,
    fontWeight: '500',
    color: welcomeColors.link,
  },
  alignRight: {
    textAlign: 'right',
  },
  customCell: {
    alignItems: 'flex-start',
  },
  alignEnd: {
    alignItems: 'flex-end',
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
