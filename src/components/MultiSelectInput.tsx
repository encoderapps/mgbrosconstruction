import React, { useState } from 'react';
import { FlatList, Keyboard, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CheckIcon, ChevronRightIcon } from '../assets/icons';
import { fontFamily, radius, welcomeColors } from '../theme';
import { AuthPrimaryButton } from './AuthPrimaryButton';

type MultiSelectInputProps = {
  label: string;
  placeholder: string;
  values: string[];
  options: string[];
  onChange: (values: string[]) => void;
};

export function MultiSelectInput({
  label,
  placeholder,
  values,
  options,
  onChange,
}: MultiSelectInputProps): React.JSX.Element {
  const [isOpen, setIsOpen] = useState(false);
  // Selections are staged here and only applied when the user taps Done.
  const [draftValues, setDraftValues] = useState<string[]>(values);
  // Edge-to-edge draws the modal under the system nav bar, so lift the sheet above it.
  const insets = useSafeAreaInsets();

  const open = (): void => {
    // Close the keyboard so it doesn't cover the options sheet.
    Keyboard.dismiss();
    setDraftValues(values);
    setIsOpen(true);
  };

  const toggleOption = (option: string): void => {
    setDraftValues((current) =>
      current.includes(option) ? current.filter((item) => item !== option) : [...current, option],
    );
  };

  const handleDone = (): void => {
    // Keep the selection in the same order as the option list.
    onChange(options.filter((option) => draftValues.includes(option)));
    setIsOpen(false);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <Pressable style={styles.inputWrapper} onPress={open}>
        <Text style={[styles.value, values.length === 0 && styles.placeholder]} numberOfLines={1}>
          {values.length > 0 ? values.join(', ') : placeholder}
        </Text>
        <View style={styles.chevron}>
          <ChevronRightIcon size={14} color={welcomeColors.inputPlaceholder} />
        </View>
      </Pressable>

      <Modal visible={isOpen} transparent animationType="fade" onRequestClose={() => setIsOpen(false)}>
        <View style={styles.backdrop}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setIsOpen(false)} />
          <View style={[styles.sheet, { paddingBottom: styles.sheet.paddingBottom + insets.bottom }]}>
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>{label}</Text>
              <Text style={styles.selectedCount}>{draftValues.length} selected</Text>
            </View>
            <FlatList
              data={options}
              keyExtractor={(item) => item}
              style={styles.list}
              renderItem={({ item }) => {
                const isSelected = draftValues.includes(item);
                return (
                  <Pressable
                    style={styles.option}
                    onPress={() => toggleOption(item)}
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked: isSelected }}
                  >
                    <View style={[styles.box, isSelected && styles.boxChecked]}>
                      {isSelected && <CheckIcon size={12} color={welcomeColors.cardBackground} />}
                    </View>
                    <Text style={[styles.optionText, isSelected && styles.optionTextActive]}>{item}</Text>
                  </Pressable>
                );
              }}
            />
            <AuthPrimaryButton title="Done" onPress={handleDone} style={styles.doneButton} />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 14,
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
  value: {
    flex: 1,
    fontFamily: fontFamily.regular,
    fontWeight: '400',
    fontSize: 12,
    color: welcomeColors.textPrimary,
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
    maxHeight: '70%',
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sheetTitle: {
    fontFamily: fontFamily.semiBold,
    fontWeight: '600',
    fontSize: 14,
    color: welcomeColors.textPrimary,
  },
  selectedCount: {
    fontFamily: fontFamily.regular,
    fontWeight: '400',
    fontSize: 12,
    color: welcomeColors.textSecondary,
  },
  list: {
    flexGrow: 0,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: welcomeColors.cardBorder,
  },
  box: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: welcomeColors.inputBorder,
    backgroundColor: welcomeColors.inputBackground,
    alignItems: 'center',
    justifyContent: 'center',
  },
  boxChecked: {
    borderColor: welcomeColors.loginButton,
    backgroundColor: welcomeColors.loginButton,
  },
  optionText: {
    flex: 1,
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
  doneButton: {
    marginTop: 12,
  },
});
