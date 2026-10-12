import React from 'react';
import { StyleSheet, TextInput } from 'react-native';
import { SIGNATURE_FONTS } from '../constants/signatureFonts';
import { fontFamily, radius, welcomeColors } from '../theme';
import { useScrollFocusedInputIntoView } from './KeyboardAwareScrollView';

type SignatureInputProps = {
  value: string;
  onChangeText: (text: string) => void;
  editable?: boolean;
};

const SIGNATURE_MAX_LENGTH = 80;

/** The handwriting font typed signatures are shown in (here and once signed). */
export const SIGNATURE_DISPLAY_FONT = SIGNATURE_FONTS[0].fontFamily;

/**
 * The "Sign here" box: the signer types their name, shown in a handwriting
 * font (the placeholder stays in the regular font so it reads as a prompt).
 */
export function SignatureInput({ value, onChangeText, editable = true }: SignatureInputProps): React.JSX.Element {
  const scrollFocusedInputIntoView = useScrollFocusedInputIntoView();

  return (
    <TextInput
      style={[styles.input, value ? styles.signature : styles.placeholder, !editable && styles.disabled]}
      value={value}
      onChangeText={onChangeText}
      placeholder="Sign here"
      placeholderTextColor={welcomeColors.inputPlaceholder}
      autoCapitalize="words"
      autoCorrect={false}
      maxLength={SIGNATURE_MAX_LENGTH}
      editable={editable}
      textAlignVertical="center"
      accessibilityLabel="Your signature: type your full name"
      onFocus={() => scrollFocusedInputIntoView?.()}
    />
  );
}

const styles = StyleSheet.create({
  input: {
    height: 84,
    borderWidth: 1,
    borderColor: welcomeColors.inputBorder,
    borderRadius: radius.md,
    backgroundColor: welcomeColors.inputBackground,
    paddingHorizontal: 12,
    color: welcomeColors.textPrimary,
  },
  placeholder: {
    fontFamily: fontFamily.regular,
    fontSize: 13,
  },
  signature: {
    fontFamily: SIGNATURE_DISPLAY_FONT,
    fontSize: 30,
  },
  disabled: {
    opacity: 0.6,
  },
});
