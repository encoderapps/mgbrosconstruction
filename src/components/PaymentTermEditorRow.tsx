import React, { memo } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { TrashIcon } from '../assets/icons';
import { fontFamily, portalColors, radius, welcomeColors } from '../theme';
import { formatCurrency } from '../utils/formatCurrency';
import { PaymentTermDraft } from '../utils/paymentTerms';
import { SelectInput } from './SelectInput';

type PaymentTermEditorRowProps = {
  draft: PaymentTermDraft;
  /** 1-based row number. */
  position: number;
  /** Calculated from the PO total; not editable. */
  amount: number;
  descriptionOptions: string[];
  canDelete: boolean;
  disabled: boolean;
  onDescriptionChange: (key: string, description: string) => void;
  onPercentageChange: (key: string, text: string) => void;
  onDelete: (key: string) => void;
};

/** Column widths shared with the screen's header row. */
export const PAYMENT_TERM_COLUMN_WIDTHS = {
  index: 16,
  percentage: 44,
  amount: 74,
  delete: 24,
} as const;

/** One editable row on Modify Payment Terms: # · description · % · amount · delete. */
export const PaymentTermEditorRow = memo(function PaymentTermEditorRowView({
  draft,
  position,
  amount,
  descriptionOptions,
  canDelete,
  disabled,
  onDescriptionChange,
  onPercentageChange,
  onDelete,
}: PaymentTermEditorRowProps): React.JSX.Element {
  return (
    <View style={styles.row} pointerEvents={disabled ? 'none' : 'auto'}>
      <Text style={[styles.text, styles.indexColumn]}>{position}</Text>
      <SelectInput
        compact
        label={`Payment term ${position} description`}
        placeholder="Select"
        value={draft.description}
        options={descriptionOptions}
        onSelect={(description) => onDescriptionChange(draft.key, description)}
      />
      <TextInput
        style={[styles.text, styles.percentageInput]}
        value={draft.percentageText}
        onChangeText={(text) => onPercentageChange(draft.key, text)}
        keyboardType="decimal-pad"
        maxLength={6}
        selectTextOnFocus
        editable={!disabled}
        accessibilityLabel={`Payment term ${position} percentage`}
      />
      <Text style={[styles.text, styles.amount]} numberOfLines={1} adjustsFontSizeToFit>
        {formatCurrency(amount, true)}
      </Text>
      <Pressable
        onPress={() => onDelete(draft.key)}
        disabled={!canDelete || disabled}
        hitSlop={8}
        style={[styles.deleteButton, !canDelete && styles.deleteDisabled]}
        accessibilityRole="button"
        accessibilityLabel={`Delete payment term ${position}`}
        accessibilityState={{ disabled: !canDelete || disabled }}
      >
        <TrashIcon size={16} color={portalColors.danger} />
      </Pressable>
    </View>
  );
});

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  text: {
    fontFamily: fontFamily.regular,
    fontWeight: '400',
    fontSize: 12,
    color: welcomeColors.textPrimary,
  },
  indexColumn: {
    width: PAYMENT_TERM_COLUMN_WIDTHS.index,
  },
  percentageInput: {
    width: PAYMENT_TERM_COLUMN_WIDTHS.percentage,
    height: 36,
    paddingHorizontal: 4,
    paddingVertical: 0,
    borderWidth: 1,
    borderColor: welcomeColors.inputBorder,
    borderRadius: radius.sm,
    backgroundColor: welcomeColors.cardBackground,
    fontFamily: fontFamily.semiBold,
    fontWeight: '600',
    textAlign: 'center',
  },
  amount: {
    width: PAYMENT_TERM_COLUMN_WIDTHS.amount,
    height: 36,
    lineHeight: 36,
    paddingHorizontal: 6,
    borderRadius: radius.sm,
    backgroundColor: welcomeColors.inputBackground,
    borderWidth: 1,
    borderColor: welcomeColors.inputBorder,
    color: welcomeColors.textSecondary,
    fontSize: 11,
    textAlign: 'center',
    overflow: 'hidden',
  },
  deleteButton: {
    width: PAYMENT_TERM_COLUMN_WIDTHS.delete,
    alignItems: 'center',
  },
  deleteDisabled: {
    opacity: 0.35,
  },
});
