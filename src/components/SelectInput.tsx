import React, { useState } from 'react';
import { FlatList, Keyboard, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronRightIcon } from '../assets/icons';
import { fontFamily, radius, welcomeColors } from '../theme';

type SelectInputProps = {
  label: string;
  placeholder: string;
  value: string;
  options: string[];
  onSelect: (value: string) => void;
  /** Display text for an option (e.g. "IL" → "Illinois (IL)"). Defaults to the value itself. */
  formatOption?: (value: string) => string;
  /**
   * A smaller field without the visible label (still used as the options
   * sheet's title and the accessibility label), for use inside table rows.
   */
  compact?: boolean;
};

export function SelectInput({
  label,
  placeholder,
  value,
  options,
  onSelect,
  formatOption = (option) => option,
  compact = false,
}: SelectInputProps): React.JSX.Element {
  const [isOpen, setIsOpen] = useState(false);
  // Edge-to-edge draws the modal under the system nav bar, so lift the sheet above it.
  const insets = useSafeAreaInsets();

  return (
    <View style={compact ? styles.compactContainer : styles.container}>
      {!compact && <Text style={styles.label}>{label}</Text>}
      <Pressable
        style={[styles.inputWrapper, compact && styles.compactInputWrapper]}
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityValue={value ? { text: formatOption(value) } : undefined}
        onPress={() => {
          // Close the keyboard so it doesn't cover the options sheet.
          Keyboard.dismiss();
          setIsOpen(true);
        }}
      >
        <Text
          style={[styles.value, compact && styles.compactValue, !value && styles.placeholder]}
          numberOfLines={compact ? 1 : undefined}
        >
          {value ? formatOption(value) : placeholder}
        </Text>
        <View style={styles.chevron}>
          <ChevronRightIcon size={14} color={welcomeColors.inputPlaceholder} />
        </View>
      </Pressable>

      <Modal visible={isOpen} transparent animationType="fade" onRequestClose={() => setIsOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setIsOpen(false)}>
          <View style={[styles.sheet, { paddingBottom: styles.sheet.paddingBottom + insets.bottom }]}>
            <Text style={styles.sheetTitle}>{label}</Text>
            <FlatList
              data={options}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <Pressable
                  style={styles.option}
                  onPress={() => {
                    onSelect(item);
                    setIsOpen(false);
                  }}
                >
                  <Text style={[styles.optionText, item === value && styles.optionTextActive]}>{formatOption(item)}</Text>
                </Pressable>
              )}
            />
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 14,
  },
  compactContainer: {
    flex: 1,
  },
  label: {
    fontFamily: fontFamily.semiBold,
    fontWeight: '600',
    fontSize: 11,
    lineHeight: 16.5,
    color: welcomeColors.textPrimary,
    marginBottom: 6,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: welcomeColors.inputBorder,
    borderRadius: radius.md,
    backgroundColor: welcomeColors.inputBackground,
    paddingHorizontal: 12,
    height: 44,
  },
  compactInputWrapper: {
    height: 36,
    paddingHorizontal: 8,
    borderRadius: radius.sm,
  },
  value: {
    flex: 1,
    fontFamily: fontFamily.regular,
    fontWeight: '400',
    fontSize: 12,
    color: welcomeColors.textPrimary,
  },
  compactValue: {
    fontSize: 11,
  },
  placeholder: {
    color: welcomeColors.inputPlaceholder,
  },
  chevron: {
    marginLeft: 8,
    transform: [{ rotate: '90deg' }],
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(33, 29, 26, 0.4)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: welcomeColors.cardBackground,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 24,
    maxHeight: '60%',
  },
  sheetTitle: {
    fontFamily: fontFamily.semiBold,
    fontWeight: '600',
    fontSize: 14,
    color: welcomeColors.textPrimary,
    marginBottom: 12,
  },
  option: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: welcomeColors.cardBorder,
  },
  optionText: {
    fontFamily: fontFamily.regular,
    fontWeight: '400',
    fontSize: 13,
    color: welcomeColors.textPrimary,
  },
  optionTextActive: {
    fontFamily: fontFamily.semiBold,
    fontWeight: '600',
    color: welcomeColors.loginButton,
  },
});
