import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { LoadStatus } from '../hooks/useAsyncResource';
import { EMPTY_VALUE } from '../constants/display';
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
  /** Lets long text wrap onto more lines within the column's width (otherwise one line, cut off). */
  wrap?: boolean;
  /** Shown in the link style (blue, medium weight), like a record name. */
  isLink?: boolean;
  /** The cell's text; an empty or blank value shows as a dash. */
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
  /**
   * Fits the table to its container instead of scrolling sideways: `grow`
   * columns share the room left by the fixed ones and long text wraps onto
   * more lines.
   */
  fitWidth?: boolean;
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
  fitWidth = false,
}: DataTableProps<Row>): React.JSX.Element {
  if (status !== 'success') {
    return <TableStatusMessage status={status} errorText={errorText} onRetry={onRetry} />;
  }
  const widthOf = (column: DataTableColumn<Row>) => (fitWidth ? fittedColumnWidth(column) : columnWidth(column));
  // Wrapping only when the table can't scroll to show the rest, or the column asks for it.
  const linesOf = (column: DataTableColumn<Row>) => (fitWidth || column.wrap ? undefined : 1);
  // Multi-line cells start at the top so a row's texts line up.
  const wrapsRows = fitWidth || columns.some((column) => column.wrap);

  const table = (
    // collapsable={false} here and on each row: see LoginInput (rows are added as data arrives).
    <View style={styles.table} collapsable={false}>
      <View style={[styles.row, styles.headerRow]}>
        {columns.map((column) => (
          <Text
            key={column.key}
            style={[styles.headerCell, widthOf(column), column.align === 'right' && styles.alignRight]}
            numberOfLines={fitWidth ? undefined : 1}
          >
            {column.label}
          </Text>
        ))}
      </View>

      {rows.length === 0 ? (
        <Text style={styles.emptyText}>{emptyText}</Text>
      ) : (
        rows.map((row, index) => (
          <View
            key={getRowKey(row)}
            style={[styles.row, wrapsRows && styles.wrappingRow, index > 0 && styles.rowDivider]}
            collapsable={false}
          >
            {columns.map((column) => {
              const { onPress } = column;
              const value = column.getValue(row).trim() || EMPTY_VALUE;
              // Only override when a colour is given: `color: undefined` would wipe the cell's own colour.
              const color = column.getColor?.(row);
              const cell = column.renderCell ? (
                <View
                  style={[widthOf(column), styles.customCell, column.align === 'right' && styles.alignEnd]}
                  accessible
                  accessibilityLabel={value}
                >
                  {column.renderCell(row)}
                </View>
              ) : (
                <Text
                  style={[
                    styles.cellText,
                    widthOf(column),
                    column.isLink && styles.linkText,
                    column.align === 'right' && styles.alignRight,
                    color !== undefined && { color },
                  ]}
                  numberOfLines={linesOf(column)}
                >
                  {value}
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
  );

  if (fitWidth) {
    return table;
  }
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator
      persistentScrollbar
      nestedScrollEnabled
      contentContainerStyle={styles.scrollContent}
    >
      {table}
    </ScrollView>
  );
}

function columnWidth<Row>(column: DataTableColumn<Row>) {
  return column.grow ? { minWidth: column.width, flexGrow: 1, flexBasis: column.width } : { width: column.width };
}

/** For `fitWidth`: grow columns split the leftover room (and may get narrower than `width`). */
function fittedColumnWidth<Row>(column: DataTableColumn<Row>) {
  return column.grow ? { flex: 1, minWidth: 0 } : { width: column.width };
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
  // Multi-line cells start at the top so a row's texts line up.
  wrappingRow: {
    alignItems: 'flex-start',
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
  // A renderCell cell sizes its content (e.g. a pill) to fit rather than stretching it across the column.
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
