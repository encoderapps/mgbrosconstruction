import React from 'react';
import { StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { LockIcon } from '../assets/icons';
import { fontFamily, radius, welcomeColors } from '../theme';

type SecurityInfoProps = {
  style?: StyleProp<ViewStyle>;
};

export function SecurityInfo({ style }: SecurityInfoProps): React.JSX.Element {
  return (
    <View style={[styles.container, style]}>
      <View style={styles.iconWrapper}>
        <LockIcon width={14} height={9} color={welcomeColors.securityText} />
      </View>
      <Text style={styles.text}>
        Your information is securely transmitted to Plaid for verification. We do not store your
        information
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: welcomeColors.iconWrapperBackground,
    borderRadius: radius.lg,
    padding: 14,
  },
  iconWrapper: {
    width: 16,
    height: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  text: {
    flex: 1,
    fontFamily: fontFamily.regular,
    fontWeight: '400',
    fontSize: 10,
    lineHeight: 14,
    color: welcomeColors.securityText,
  },
});
