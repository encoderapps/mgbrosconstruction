import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { fontFamily, welcomeColors } from '../theme';

type AuthCardHeaderProps = {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  iconBackgroundColor?: string;
};

export function AuthCardHeader({
  icon,
  title,
  subtitle,
  iconBackgroundColor = welcomeColors.iconWrapperBackground,
}: AuthCardHeaderProps): React.JSX.Element {
  return (
    <View style={styles.row}>
      <View style={[styles.iconWrapper, { backgroundColor: iconBackgroundColor }]}>{icon}</View>
      <View style={styles.textWrapper}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  iconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  textWrapper: {
    flex: 1,
  },
  title: {
    fontFamily: fontFamily.semiBold,
    fontWeight: '600',
    fontSize: 13,
    lineHeight: 13,
    color: welcomeColors.textPrimary,
    marginBottom: 4,
  },
  subtitle: {
    fontFamily: fontFamily.regular,
    fontWeight: '400',
    fontSize: 10,
    lineHeight: 13,
    color: welcomeColors.textSecondary,
  },
});
