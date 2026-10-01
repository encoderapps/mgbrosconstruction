import React from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AuthPrimaryButton } from '../components/AuthPrimaryButton';
import { HomeHeader } from '../components/HomeHeader';
import { ChevronRightIcon } from '../assets/icons';
import { fontFamily, portalColors, radius, shadows, welcomeColors } from '../theme';
import { AuthStackParamList } from '../navigation/types';
import { EMPTY_VALUE } from '../constants/display';
import { useSubcontractorSession } from '../context/SubcontractorSessionContext';
import { formatPhoneNumber } from '../utils/formatPhoneNumber';
import { getInitials } from '../utils/signature';

type Props = NativeStackScreenProps<AuthStackParamList, 'Profile'>;


/** The user icon in the header opens this: the logged-in subcontractor's details. */
export function ProfileScreen({ navigation }: Props): React.JSX.Element {
  const { company, setCompany } = useSubcontractorSession();
  // The login response's companyName is the subcontractor's display name.
  const name = company?.name ?? '';

  const infoRows = [
    { label: 'Email', value: company?.email },
    { label: 'Phone', value: company?.phone && formatPhoneNumber(company.phone) },
    { label: 'Company', value: company?.name },
    { label: 'Address', value: company?.address },
  ];

  const handleUpdateProfile = (): void => {
    // There's no profile update API yet.
    Alert.alert('Update Profile', 'Updating your profile is coming soon.');
  };

  const handleLogout = (): void => {
    Alert.alert('Log out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log out',
        style: 'destructive',
        onPress: () => {
          setCompany(null);
          navigation.reset({ index: 0, routes: [{ name: 'Welcome' }] });
        },
      },
    ]);
  };

  const handleDeleteProfile = (): void => {
    // There's no delete-account API yet, so nothing is deleted.
    Alert.alert('Delete Profile', 'Deleting your profile is coming soon. Please contact MG Bros Construction for now.');
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <HomeHeader active="profile" />
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.titleRow}>
          <Pressable
            onPress={() => navigation.goBack()}
            hitSlop={10}
            style={styles.backButton}
            accessibilityRole="button"
            accessibilityLabel="Back"
          >
            <ChevronRightIcon size={16} color={welcomeColors.textPrimary} />
          </Pressable>
          <Text style={styles.title}>Profile</Text>
        </View>

        <View style={styles.profile}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{getInitials(name) || '?'}</Text>
          </View>
          <Text style={styles.name}>{name || EMPTY_VALUE}</Text>
          <Text style={styles.role}>Subcontractor</Text>
        </View>

        <View style={styles.infoCard}>
          {infoRows.map((row, index) => (
            <View key={row.label} style={[styles.infoRow, index > 0 && styles.infoRowDivider]}>
              <Text style={styles.infoLabel}>{row.label}</Text>
              <Text style={styles.infoValue}>{row.value || EMPTY_VALUE}</Text>
            </View>
          ))}
        </View>

        <View style={styles.actions}>
          <AuthPrimaryButton title="Update Profile" onPress={handleUpdateProfile} />
          <Pressable
            onPress={handleLogout}
            style={({ pressed }) => [styles.outlineButton, pressed && styles.pressed]}
            accessibilityRole="button"
          >
            <Text style={styles.logoutText}>Logout</Text>
          </Pressable>
          <Pressable
            onPress={handleDeleteProfile}
            style={({ pressed }) => [styles.outlineButton, styles.deleteButton, pressed && styles.pressed]}
            accessibilityRole="button"
          >
            <Text style={styles.deleteText}>Delete Profile</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: welcomeColors.background,
  },
  // Same page padding as the Home screen.
  container: {
    flexGrow: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 24,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  backButton: {
    transform: [{ rotate: '180deg' }],
  },
  title: {
    fontFamily: fontFamily.bold,
    fontWeight: '700',
    fontSize: 18,
    color: welcomeColors.textPrimary,
  },
  profile: {
    alignItems: 'center',
    marginTop: 4,
    marginBottom: 18,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: welcomeColors.loginButton,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  avatarText: {
    fontFamily: fontFamily.semiBold,
    fontWeight: '600',
    fontSize: 26,
    color: welcomeColors.cardBackground,
  },
  name: {
    fontFamily: fontFamily.semiBold,
    fontWeight: '600',
    fontSize: 17,
    color: welcomeColors.textPrimary,
  },
  role: {
    fontFamily: fontFamily.regular,
    fontWeight: '400',
    fontSize: 13,
    color: welcomeColors.textSecondary,
    marginTop: 2,
  },
  infoCard: {
    backgroundColor: welcomeColors.cardBackground,
    borderRadius: radius.md,
    paddingHorizontal: 16,
    ...shadows.sm,
  },
  infoRow: {
    paddingVertical: 10,
    gap: 3,
  },
  infoRowDivider: {
    borderTopWidth: 1,
    borderTopColor: welcomeColors.cardBorder,
  },
  infoLabel: {
    fontFamily: fontFamily.regular,
    fontWeight: '400',
    fontSize: 11,
    color: welcomeColors.textSecondary,
  },
  infoValue: {
    fontFamily: fontFamily.regular,
    fontWeight: '400',
    fontSize: 13,
    color: welcomeColors.textPrimary,
  },
  actions: {
    gap: 12,
    marginTop: 32,
  },
  outlineButton: {
    height: 48,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: welcomeColors.loginButton,
    backgroundColor: welcomeColors.cardBackground,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoutText: {
    fontFamily: fontFamily.semiBold,
    fontWeight: '600',
    fontSize: 15,
    color: welcomeColors.loginButton,
  },
  deleteButton: {
    borderColor: portalColors.danger,
  },
  deleteText: {
    fontFamily: fontFamily.semiBold,
    fontWeight: '600',
    fontSize: 15,
    color: portalColors.danger,
  },
  pressed: {
    opacity: 0.85,
  },
});
