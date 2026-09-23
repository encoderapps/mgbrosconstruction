import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { CalendarIcon } from '../assets/icons';
import { fontFamily, radius, welcomeColors } from '../theme';

type DateInputProps = {
  label: string;
  placeholder: string;
  /** Stored/returned as YYYY-MM-DD, matching the backend's expected format. */
  value: string;
  onChange: (date: string) => void;
};

function toDateOnlyString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function DateInput({ label, placeholder, value, onChange }: DateInputProps): React.JSX.Element {
  const [isPickerOpen, setIsPickerOpen] = useState(false);

  const handleChange = (event: DateTimePickerEvent, selectedDate?: Date): void => {
    setIsPickerOpen(false);
    if (event.type === 'set' && selectedDate) {
      onChange(toDateOnlyString(selectedDate));
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <Pressable style={styles.inputWrapper} onPress={() => setIsPickerOpen(true)}>
        <Text style={[styles.value, !value && styles.placeholder]}>{value || placeholder}</Text>
        <CalendarIcon size={16} color={welcomeColors.inputPlaceholder} />
      </Pressable>

      {isPickerOpen && (
        <DateTimePicker
          value={value ? new Date(value) : new Date()}
          mode="date"
          display="default"
          onChange={handleChange}
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
});
