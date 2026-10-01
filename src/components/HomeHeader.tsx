import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import MgBrosSubcontractorLogo from '../assets/images/mg-bros-subcontractor-logo.svg';
import { BellIcon, ChatIcon, CheckCircleIcon, UserIcon } from '../assets/icons';
import { fontFamily, portalColors, radius, toneColors, welcomeColors } from '../theme';
import { AuthStackParamList } from '../navigation/types';

type HomeHeaderProps = {
  /** Highlights the header button for the screen being shown (and hides the Documents pill). */
  active?: 'notifications' | 'profile';
};

/** Top bar of the signed-in screens: logo, Documents status, notifications, chat and profile. */
export function HomeHeader({ active }: HomeHeaderProps): React.JSX.Element {
  const navigation = useNavigation<NativeStackNavigationProp<AuthStackParamList>>();

  const openScreen = (screen: 'Notifications' | 'Profile'): void => {
    // Already there: don't stack a second copy of the same screen.
    if ((screen === 'Notifications' && active === 'notifications') || (screen === 'Profile' && active === 'profile')) {
      return;
    }
    navigation.navigate(screen);
  };

  return (
    <View style={styles.header}>
      <MgBrosSubcontractorLogo width={102} height={40} />

      {!active && (
        <View style={styles.documentsPill}>
          <Text style={styles.documentsPillText}>Documents:</Text>
          <CheckCircleIcon size={18} />
        </View>
      )}

      <View style={styles.headerIcons}>
        <Pressable
          onPress={() => openScreen('Notifications')}
          hitSlop={4}
          style={({ pressed }) => [
            styles.headerIconWrapper,
            active === 'notifications' && styles.headerIconActive,
            pressed && styles.pressed,
          ]}
          accessibilityRole="button"
          accessibilityLabel="Notifications"
        >
          <BellIcon size={16} color={active === 'notifications' ? welcomeColors.textPrimary : welcomeColors.accent} />
        </Pressable>
        <View style={styles.headerIconWrapper}>
          <ChatIcon size={16} color={welcomeColors.accent} />
        </View>
        <Pressable
          onPress={() => openScreen('Profile')}
          hitSlop={4}
          style={({ pressed }) => [
            styles.headerIconWrapper,
            active === 'profile' && styles.headerIconActive,
            pressed && styles.pressed,
          ]}
          accessibilityRole="button"
          accessibilityLabel="Profile"
        >
          <UserIcon size={16} color={active === 'profile' ? welcomeColors.textPrimary : welcomeColors.accent} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    minHeight: 61,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 14,
    backgroundColor: welcomeColors.cardBackground,
    borderBottomWidth: 1,
    borderBottomColor: portalColors.headerBorder,
  },
  documentsPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: toneColors.success.background,
    borderWidth: 1,
    borderColor: toneColors.success.border,
    borderRadius: radius.pill,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  documentsPillText: {
    fontFamily: fontFamily.semiBold,
    fontWeight: '600',
    fontSize: 14,
    lineHeight: 21,
    letterSpacing: 0,
    color: toneColors.success.foreground,
  },
  headerIcons: {
    flexDirection: 'row',
    gap: 8,
  },
  headerIconWrapper: {
    width: 32,
    height: 32,
    borderRadius: radius.pill,
    backgroundColor: welcomeColors.cardBackground,
    borderWidth: 1,
    borderColor: portalColors.headerBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerIconActive: {
    backgroundColor: welcomeColors.iconWrapperBackground,
    borderColor: welcomeColors.iconWrapperBackground,
  },
  pressed: {
    opacity: 0.7,
  },
});
