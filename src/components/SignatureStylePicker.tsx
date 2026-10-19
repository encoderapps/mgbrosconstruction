import React from 'react';
import { View } from 'react-native';
import { SIGNATURE_FONTS, SignatureFontId } from '../constants/signatureFonts';
import { getInitials } from '../utils/signature';
import { SignatureStyleOption } from './SignatureStyleOption';

type SignatureStylePickerProps = {
  /** The signer's name, previewed in each style. */
  signatureName: string;
  selectedFontId: SignatureFontId | null;
  onSelect: (fontId: SignatureFontId) => void;
  disabled?: boolean;
};

/** The three signature styles as a radio group, each previewing the name (and its initials) in that style. */
export function SignatureStylePicker({
  signatureName,
  selectedFontId,
  onSelect,
  disabled,
}: SignatureStylePickerProps): React.JSX.Element {
  const initials = getInitials(signatureName);
  return (
    <View accessibilityRole="radiogroup">
      {SIGNATURE_FONTS.map((font) => (
        <SignatureStyleOption
          key={font.id}
          font={font}
          signatureName={signatureName}
          initials={initials}
          isSelected={selectedFontId === font.id}
          disabled={disabled}
          onSelect={() => onSelect(font.id)}
        />
      ))}
    </View>
  );
}
