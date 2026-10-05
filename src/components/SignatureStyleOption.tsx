import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { fontFamily, radius, welcomeColors } from '../theme';
import { SignatureFont } from '../constants/signatureFonts';

type SignatureStyleOptionProps = {
  font: SignatureFont;
  signatureName: string;
  /** Shown beside the signature; leave out for a signature-only option. */
  initials?: string;
  isSelected: boolean;
  disabled?: boolean;
  onSelect: () => void;
};

/** One selectable signature style: radio, the signature, and the matching initials. */
export function SignatureStyleOption({
  font,
  signatureName,
  initials,
  isSelected,
  disabled,
  onSelect,
}: SignatureStyleOptionProps): React.JSX.Element {
  const signatureText = { fontFamily: font.fontFamily };

  return (
    <Pressable
      onPress={onSelect}
      disabled={disabled}
      style={[styles.container, isSelected && styles.containerSelected, disabled && styles.containerDisabled]}
      accessibilityRole="radio"
      accessibilityState={{ checked: isSelected, disabled }}
      accessibilityLabel={font.label}
    >
      <View style={styles.header}>
        <View style={[styles.radio, isSelected && styles.radioSelected]}>
          {isSelected && <View style={styles.radioDot} />}
        </View>
        <Text style={[styles.styleLabel, isSelected && styles.styleLabelSelected]}>{font.label}</Text>
      </View>

      <View style={styles.previewRow}>
        <View style={[styles.previewBox, styles.signatureBox]}>
          <Text style={[styles.signatureText, signatureText]} numberOfLines={1} adjustsFontSizeToFit>
            {signatureName || 'Your Name'}
          </Text>
          <Text style={styles.caption}>Signature</Text>
        </View>
        {initials !== undefined && (
          <View style={[styles.previewBox, styles.initialsBox]}>
            <Text style={[styles.signatureText, signatureText]} numberOfLines={1}>
              {initials || 'YN'}
            </Text>
            <Text style={styles.caption}>Initial</Text>
          </View>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    borderColor: welcomeColors.inputBorder,
    borderRadius: radius.md,
    backgroundColor: welcomeColors.inputBackground,
    padding: 10,
    marginBottom: 10,
  },
  containerSelected: {
    borderColor: welcomeColors.loginButton,
    backgroundColor: welcomeColors.iconWrapperBackground,
  },
  containerDisabled: {
    opacity: 0.5,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  radio: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: welcomeColors.inputBorder,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: welcomeColors.cardBackground,
  },
  radioSelected: {
    borderColor: welcomeColors.loginButton,
  },
  radioDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: welcomeColors.loginButton,
  },
  styleLabel: {
    fontFamily: fontFamily.semiBold,
    fontWeight: '600',
    fontSize: 11,
    color: welcomeColors.textSecondary,
  },
  styleLabelSelected: {
    color: welcomeColors.textPrimary,
  },
  previewRow: {
    flexDirection: 'row',
    gap: 8,
  },
  previewBox: {
    borderWidth: 1,
    borderColor: welcomeColors.cardBorder,
    borderRadius: radius.md,
    backgroundColor: welcomeColors.cardBackground,
    paddingHorizontal: 10,
    paddingTop: 4,
    paddingBottom: 4,
    alignItems: 'center',
  },
  signatureBox: {
    flex: 1,
  },
  initialsBox: {
    width: 78,
  },
  signatureText: {
    fontSize: 26,
    lineHeight: 38,
    color: '#0D1A59', // ink blue, matching the initials drawn on the agreement
  },
  caption: {
    fontFamily: fontFamily.regular,
    fontWeight: '400',
    fontSize: 10,
    color: welcomeColors.textSecondary,
  },
});
