import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ChevronRightIcon } from '../assets/icons';
import { fontFamily, radius, welcomeColors } from '../theme';
import { Address } from '../navigation/types';
import { formatAddress } from '../utils/address';
import { LoginInput } from './LoginInput';

type AddressInputProps = {
  label: string;
  value: Address;
  onChange: (field: keyof Address, value: string) => void;
  isExpanded: boolean;
  onToggle: () => void;
};

/**
 * Collapsible address field. Collapsed, it shows a single summary row; tapping
 * it reveals the separate address inputs. Collapsing never clears the values —
 * they are owned by the parent form.
 */
export function AddressInput({
  label,
  value,
  onChange,
  isExpanded,
  onToggle,
}: AddressInputProps): React.JSX.Element {
  const summary = formatAddress(value);

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <Pressable
        style={styles.inputWrapper}
        onPress={onToggle}
        accessibilityRole="button"
        accessibilityState={{ expanded: isExpanded }}
      >
        <Text style={[styles.value, !summary && styles.placeholder]} numberOfLines={1}>
          {summary || 'Enter address'}
        </Text>
        <View style={[styles.chevron, isExpanded && styles.chevronExpanded]}>
          <ChevronRightIcon size={14} color={welcomeColors.inputPlaceholder} />
        </View>
      </Pressable>

      {isExpanded && (
        <View style={styles.fields}>
          <LoginInput
            label="Address 1"
            placeholder="Enter address 1"
            value={value.address1}
            onChangeText={(text) => onChange('address1', text)}
            autoCapitalize="words"
          />

          <LoginInput
            label="Address 2"
            placeholder="Enter address 2 (optional)"
            value={value.address2}
            onChangeText={(text) => onChange('address2', text)}
            autoCapitalize="words"
          />

          <LoginInput
            label="City"
            placeholder="Enter city"
            value={value.city}
            onChangeText={(text) => onChange('city', text)}
            autoCapitalize="words"
          />

          <LoginInput
            label="State"
            placeholder="Enter state"
            value={value.state}
            onChangeText={(text) => onChange('state', text)}
            autoCapitalize="words"
          />

          <LoginInput
            label="Country"
            placeholder="Enter country"
            value={value.country}
            onChangeText={(text) => onChange('country', text)}
            autoCapitalize="words"
          />

          <LoginInput
            label="Pincode"
            placeholder="Enter pincode"
            value={value.pincode}
            onChangeText={(text) => onChange('pincode', text)}
            autoCapitalize="characters"
            maxLength={10}
          />
        </View>
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
  chevron: {
    marginLeft: 8,
    transform: [{ rotate: '90deg' }],
  },
  chevronExpanded: {
    transform: [{ rotate: '-90deg' }],
  },
  fields: {
    marginTop: 12,
    // The last field's own bottom margin is covered by this container's margin.
    marginBottom: -14,
  },
});
