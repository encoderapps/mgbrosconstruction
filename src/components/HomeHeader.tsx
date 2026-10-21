import React from 'react';
import { Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import MgBrosSubcontractorLogo from '../assets/images/mg-bros-subcontractor-logo.svg';
import { BellIcon, ChatIcon, CheckCircleIcon, UserIcon } from '../assets/icons';
import { fontFamily, portalColors, radius, toneColors, welcomeColors } from '../theme';
import { AuthStackParamList } from '../navigation/types';

// The logo artwork's viewBox is 311 × 116.
const LOGO_ASPECT_RATIO = 116 / 311;
// Below this width (or with a large system font size) the header's fixed-size
// pieces don't fit at full size, so it switches to its compact layout.
const COMPACT_MAX_WIDTH = 400;
const COMPACT_MIN_FONT_SCALE = 1.15;
// The Documents label's text stops growing with the system font size here.
const PILL_MAX_FONT_SCALE = 1.2;

const SIZES = {
  regular: { logoWidth: 102, buttonIcon: 16, checkIcon: 18 },
  compact: { logoWidth: 86, buttonIcon: 15, checkIcon: 16 },
} as const;

type HomeHeaderProps = {
  /** Highlights the header button for the screen being shown (and hides the Documents pill). */
  active?: 'notifications' | 'profile';
};

/** Top bar of the signed-in screens: logo, Documents status, notifications, chat and profile. */
export function HomeHeader({ active }: HomeHeaderProps): React.JSX.Element {
  const navigation = useNavigation<NativeStackNavigationProp<AuthStackParamList>>();
  const { width, fontScale } = useWindowDimensions();
  const compact = width < COMPACT_MAX_WIDTH || fontScale > COMPACT_MIN_FONT_SCALE;
  const sizes = compact ? SIZES.compact : SIZES.regular;

  const openScreen = (screen: 'Notifications' | 'Profile'): void => {
    // Already there: don't stack a second copy of the same screen.
    if ((screen === 'Notifications' && active === 'notifications') || (screen === 'Profile' && active === 'profile')) {
      return;
    }
    navigation.navigate(screen);
  };

  return (
    <View style={[styles.header, compact && styles.headerCompact]}>
      <MgBrosSubcontractorLogo width={sizes.logoWidth} height={Math.round(sizes.logoWidth * LOGO_ASPECT_RATIO)} />

      {!active && (
        <View style={[styles.documentsPill, compact && styles.documentsPillCompact]}>
          <Text
            style={[styles.documentsPillText, compact && styles.documentsPillTextCompact]}
            numberOfLines={1}
            maxFontSizeMultiplier={PILL_MAX_FONT_SCALE}
          >
            Documents:
          </Text>
          <CheckCircleIcon size={sizes.checkIcon} />
        </View>
      )}

      <View style={[styles.headerIcons, compact && styles.headerIconsCompact]}>
        <Pressable
          onPress={() => openScreen('Notifications')}
          hitSlop={4}
          style={({ pressed }) => [
            styles.headerIconWrapper,
            compact && styles.headerIconWrapperCompact,
            active === 'notifications' && styles.headerIconActive,
            pressed && styles.pressed,
          ]}
          accessibilityRole="button"
          accessibilityLabel="Notifications"
        >
          <BellIcon size={sizes.buttonIcon} color={active === 'notifications' ? welcomeColors.textPrimary : welcomeColors.accent} />
        </Pressable>
        <View style={[styles.headerIconWrapper, compact && styles.headerIconWrapperCompact]}>
          <ChatIcon size={sizes.buttonIcon} color={welcomeColors.accent} />
        </View>
        <Pressable
          onPress={() => openScreen('Profile')}
          hitSlop={4}
          style={({ pressed }) => [
            styles.headerIconWrapper,
            compact && styles.headerIconWrapperCompact,
            active === 'profile' && styles.headerIconActive,
            pressed && styles.pressed,
          ]}
          accessibilityRole="button"
          accessibilityLabel="Profile"
        >
          <UserIcon size={sizes.buttonIcon} color={active === 'profile' ? welcomeColors.textPrimary : welcomeColors.accent} />
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
    gap: 10,
    paddingTop: 12,
    paddingBottom: 10,
    paddingHorizontal: 16,
    backgroundColor: welcomeColors.cardBackground,
    borderBottomWidth: 1,
    borderBottomColor: portalColors.headerBorder,
  },
  headerCompact: {
    gap: 8,
    paddingHorizontal: 12,
  },
  documentsPill: {
    // Gives up width first so the logo and buttons always fit.
    flexShrink: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: toneColors.success.background,
    borderWidth: 1,
    borderColor: toneColors.success.border,
    borderRadius: radius.pill,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  documentsPillCompact: {
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  documentsPillText: {
    fontFamily: fontFamily.semiBold,
    fontWeight: '600',
    fontSize: 14,
    lineHeight: 21,
    letterSpacing: 0,
    color: toneColors.success.foreground,
    flexShrink: 1,
  },
  documentsPillTextCompact: {
    fontSize: 13,
    lineHeight: 18,
  },
  headerIcons: {
    flexDirection: 'row',
    gap: 8,
  },
  headerIconsCompact: {
    gap: 6,
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
  headerIconWrapperCompact: {
    width: 30,
    height: 30,
  },
  headerIconActive: {
    backgroundColor: welcomeColors.iconWrapperBackground,
    borderColor: welcomeColors.iconWrapperBackground,
  },
  pressed: {
    opacity: 0.7,
  },
});
