import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { CheckCircleIcon } from '../assets/icons';
import { fontFamily, welcomeColors } from '../theme';

interface RegisterBenefitProps {
  text: string;
}

export function RegisterBenefit({ text }: RegisterBenefitProps): React.JSX.Element {
  return (
    <View style={styles.row}>
      <CheckCircleIcon size={16} color={welcomeColors.registerGreen} />
      <Text style={styles.text}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  text: {
    flex: 1,
    fontFamily: fontFamily.regular,
    fontWeight: '400',
    fontSize: 12,
    lineHeight: 17,
    color: welcomeColors.textPrimary,
    marginLeft: 8,
  },
});
