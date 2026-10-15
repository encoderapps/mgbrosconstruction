import React from 'react';
import { StyleSheet, TextInput } from 'react-native';
import { SIGNATURE_FONTS, SignatureFontId, getSignatureFont } from '../constants/signatureFonts';
import { fontFamily, radius, welcomeColors } from '../theme';
import { useScrollFocusedInputIntoView } from './KeyboardAwareScrollView';

type SignatureInputProps = {
  value: string;
  onChangeText: (text: string) => void;
  editable?: boolean;
  /** The handwriting style to show the name in (the first style by default). */
  fontId?: SignatureFontId;
};

const SIGNATURE_MAX_LENGTH = 80;

/** The font family for a signature style; the first style when none is given. */
export function getSignatureFontFamily(fontId?: SignatureFontId): string {
  return fontId ? getSignatureFont(fontId).fontFamily : SIGNATURE_FONTS[0].fontFamily;
}

/**
 * The "Sign here" box: the signer types their name, shown in a handwriting
 * font (the placeholder stays in the regular font so it reads as a prompt).
 */
export function SignatureInput({ value, onChangeText, editable = true, fontId }: SignatureInputProps): React.JSX.Element {
  const scrollFocusedInputIntoView = useScrollFocusedInputIntoView();

  return (
    <TextInput
      style={[
        styles.input,
        value ? [styles.signature, { fontFamily: getSignatureFontFamily(fontId) }] : styles.placeholder,
        !editable && styles.disabled,
      ]}
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
    fontSize: 30,
  },
  disabled: {
    opacity: 0.6,
  },
});
