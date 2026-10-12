import React from 'react';
import {
  KeyboardTypeOptions,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { fontFamily, portalColors, radius, welcomeColors } from '../theme';
import { useScrollFocusedInputIntoView } from './AuthScreenLayout';

type LoginInputProps = {
  label: string;
  placeholder: string;
  value: string;
  onChangeText: (text: string) => void;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  onRightIconPress?: () => void;
  secureTextEntry?: boolean;
  keyboardType?: KeyboardTypeOptions;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  maxLength?: number;
  /** Adds a red asterisk after the label. */
  required?: boolean;
  /** Off while the form is saving. */
  editable?: boolean;
};

export function LoginInput({
  label,
  placeholder,
  value,
  onChangeText,
  leftIcon,
  rightIcon,
  onRightIconPress,
  secureTextEntry,
  keyboardType,
  autoCapitalize,
  maxLength,
  required,
  editable = true,
}: LoginInputProps): React.JSX.Element {
  const scrollFocusedInputIntoView = useScrollFocusedInputIntoView();

  return (
    <View style={styles.container}>
      <Text style={styles.label}>
        {label}
        {required && <Text style={styles.required}> *</Text>}
      </Text>
      <View style={[styles.inputWrapper, !editable && styles.inputDisabled]}>
        {!!leftIcon && <View style={styles.leftIcon}>{leftIcon}</View>}
        <TextInput
          style={styles.input}
          placeholder={placeholder}
          placeholderTextColor={welcomeColors.inputPlaceholder}
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={secureTextEntry}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize ?? 'none'}
          maxLength={maxLength}
          editable={editable}
          accessibilityLabel={label}
          onFocus={() => scrollFocusedInputIntoView?.()}
        />
        {!!rightIcon && (
          <Pressable onPress={onRightIconPress} hitSlop={8} style={styles.rightIcon}>
            {rightIcon}
          </Pressable>
        )}
      </View>
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
    borderWidth: 1,
    borderColor: welcomeColors.inputBorder,
    borderRadius: radius.md,
    backgroundColor: welcomeColors.inputBackground,
    paddingHorizontal: 12,
    height: 44,
  },
  inputDisabled: {
    opacity: 0.6,
  },
  leftIcon: {
    marginRight: 8,
  },
  rightIcon: {
    marginLeft: 6,
  },
  input: {
    flex: 1,
    fontFamily: fontFamily.regular,
    fontWeight: '400',
    fontSize: 12,
    color: welcomeColors.textPrimary,
    padding: 0,
  },
});
