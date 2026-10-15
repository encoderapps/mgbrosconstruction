import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { CalendarIcon } from '../assets/icons';
import { fontFamily, portalColors, radius, welcomeColors } from '../theme';
import { parseDateOnlyString, toDateOnlyString } from '../utils/dateValidation';

type DateInputProps = {
  label: string;
  placeholder: string;
  /** Stored/returned as YYYY-MM-DD, matching the backend's expected format. */
  value: string;
  onChange: (date: string) => void;
  /** Earliest selectable date in the picker. */
  minimumDate?: Date;
  /** Latest selectable date in the picker. */
  maximumDate?: Date;
  /** Can't be opened (e.g. while the form is saving); shown dimmed. */
  disabled?: boolean;
  /** Adds a red asterisk after the label. */
  required?: boolean;
};

export function DateInput({
  label,
  placeholder,
  value,
  onChange,
  minimumDate,
  maximumDate,
  disabled = false,
  required,
}: DateInputProps): React.JSX.Element {
  const [isPickerOpen, setIsPickerOpen] = useState(false);

  const handleValueChange = (_event: unknown, selectedDate: Date): void => {
    setIsPickerOpen(false);
    onChange(toDateOnlyString(selectedDate));
  };

  return (
    // collapsable={false}: see LoginInput.
    <View style={styles.container} collapsable={false}>
      <Text style={styles.label}>
        {label}
        {required && <Text style={styles.required}> *</Text>}
      </Text>
      <Pressable
        style={[styles.inputWrapper, disabled && styles.disabled]}
        onPress={() => setIsPickerOpen(true)}
        disabled={disabled}
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityState={{ disabled }}
      >
        <Text style={[styles.value, !value && styles.placeholder]}>{value || placeholder}</Text>
        <CalendarIcon size={16} color={welcomeColors.inputPlaceholder} />
      </Pressable>

      {isPickerOpen && (
        <DateTimePicker
          value={value ? parseDateOnlyString(value) : new Date()}
          mode="date"
          display="default"
          minimumDate={minimumDate}
          maximumDate={maximumDate}
          onValueChange={handleValueChange}
          onDismiss={() => setIsPickerOpen(false)}
        />
      )}
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
  required: {
    color: portalColors.danger,
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
  disabled: {
    opacity: 0.6,
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
});
