import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { BagIcon, ChevronRightIcon } from '../assets/icons';
import { fontFamily, welcomeColors } from '../theme';
import { AuthCard } from './AuthCard';

type ChangeOrderHeaderCardProps = {
  title: string;
  onBackPress: () => void;
  /** e.g. while a request runs, so its result isn't lost. */
  backDisabled?: boolean;
};

/** The change-order screens' title card: back arrow, bag icon and title. */
export function ChangeOrderHeaderCard({
  title,
  onBackPress,
  backDisabled = false,
}: ChangeOrderHeaderCardProps): React.JSX.Element {
  return (
    <AuthCard style={styles.card}>
      <View style={styles.header}>
        <Pressable
          onPress={onBackPress}
          disabled={backDisabled}
          hitSlop={10}
          style={styles.backButton}
          accessibilityRole="button"
          accessibilityLabel="Back"
          accessibilityState={{ disabled: backDisabled }}
        >
          <ChevronRightIcon size={16} color={welcomeColors.textPrimary} />
        </Pressable>
        <View style={styles.iconWrapper}>
          <BagIcon size={18} color={welcomeColors.accent} />
        </View>
        <Text style={styles.title} numberOfLines={1} accessibilityRole="header">
          {title}
        </Text>
      </View>
    </AuthCard>
  );
}

const styles = StyleSheet.create({
  card: {
    paddingVertical: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  // The chevron points right; turned around it's the back arrow from the reference.
  backButton: {
    transform: [{ rotate: '180deg' }],
  },
  iconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: welcomeColors.iconWrapperBackground,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    flex: 1,
    fontFamily: fontFamily.semiBold,
    fontWeight: '600',
    fontSize: 16,
    color: welcomeColors.textPrimary,
  },
});
