import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ChevronRightIcon } from '../assets/icons';
import { fontFamily, radius, shadows, welcomeColors } from '../theme';

interface RoleCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  onPress: () => void;
}

export function RoleCard({ title, description, icon, onPress }: RoleCardProps): React.JSX.Element {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
    >
      <View style={styles.iconWrapper}>{icon}</View>

      <View style={styles.content}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.description}>{description}</Text>
      </View>

      <ChevronRightIcon size={16} color={welcomeColors.chevron} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: welcomeColors.cardBackground,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: welcomeColors.cardBorder,
    paddingVertical: 14,
    paddingHorizontal: 14,
    ...shadows.sm,
  },
  cardPressed: {
    opacity: 0.85,
  },
  iconWrapper: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: welcomeColors.iconWrapperBackground,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    marginLeft: 14,
    marginRight: 8,
  },
  title: {
    fontFamily: fontFamily.bold,
    fontWeight: '700',
    fontSize: 16,
    lineHeight: 16,
    color: welcomeColors.textPrimary,
    marginBottom: 4,
  },
  description: {
    fontFamily: fontFamily.regular,
    fontWeight: '400',
    fontSize: 12,
    lineHeight: 16,
    color: welcomeColors.textSecondary,
  },
});
