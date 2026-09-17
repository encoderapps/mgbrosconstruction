import React from 'react';
import { StyleSheet, View } from 'react-native';
import MgBrosSubcontractorLogo from '../assets/images/mg-bros-subcontractor-logo.svg';

export function AuthHeader(): React.JSX.Element {
  return (
    <View style={styles.header}>
      <MgBrosSubcontractorLogo style={styles.logo} />
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    alignItems: 'center',
  },
  logo: {
    width: '62%',
    height: undefined,
    aspectRatio: 311 / 116,
  },
});
