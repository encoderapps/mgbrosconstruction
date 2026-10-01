import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AuthPrimaryButton } from '../components/AuthPrimaryButton';
import { getContactDisplayName } from '../components/ContactsSection';
import { HomeHeader } from '../components/HomeHeader';
import { ArrowLeftIcon } from '../assets/icons';
import { fontFamily, radius, welcomeColors } from '../theme';
import { AuthStackParamList } from '../navigation/types';
import { EMPTY_VALUE } from '../constants/display';
import { useContacts } from '../context/ContactsContext';
import { formatPhoneNumber } from '../utils/formatPhoneNumber';
import { getInitials } from '../utils/signature';

type Props = NativeStackScreenProps<AuthStackParamList, 'ContactDetails'>;

export function ContactDetailsScreen({ navigation, route }: Props): React.JSX.Element {
  const { contacts } = useContacts();
  const contact = contacts.find((item) => item.id === route.params.contactId);
  const name = contact ? getContactDisplayName(contact) : '';

  const handleEditContact = (): void => {
    navigation.navigate('EditContact', { contactId: route.params.contactId });
  };

  const infoRows = contact
    ? [
        { label: 'Email', value: contact.email },
        { label: 'Phone', value: contact.phone && formatPhoneNumber(contact.phone) },
        { label: 'Address', value: contact.address },
      ]
    : [];

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <HomeHeader />
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.titleBar}>
          <Pressable
            onPress={() => navigation.goBack()}
            hitSlop={10}
            style={styles.backButton}
            accessibilityRole="button"
            accessibilityLabel="Back"
          >
            <ArrowLeftIcon size={18} color={welcomeColors.cardBackground} />
          </Pressable>
          <Text style={styles.titleBarText}>Contact Details</Text>
        </View>

        {contact ? (
          <>
            <View style={styles.profile}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{getInitials(name)}</Text>
              </View>
              <Text style={styles.name}>{name}</Text>
              {!!contact.role && <Text style={styles.role}>{contact.role}</Text>}
            </View>

            <View style={styles.infoCard}>
              <Text style={styles.infoTitle}>Contact Information</Text>
              {infoRows.map((row) => (
                <View key={row.label} style={styles.infoRow}>
                  <Text style={styles.infoLabel}>{row.label}</Text>
                  <Text style={styles.infoValue}>{row.value || EMPTY_VALUE}</Text>
                </View>
              ))}
            </View>

            <AuthPrimaryButton title="Edit Contact" onPress={handleEditContact} />
          </>
        ) : (
          <Text style={styles.notFound}>This contact could not be found.</Text>
        )}
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
    paddingTop: 12,
    paddingBottom: 24,
    gap: 14,
  },
  titleBar: {
    height: 36,
    borderRadius: radius.sm,
    backgroundColor: 'rgba(132, 114, 106, 0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Pinned left so the title stays centred on the bar.
  backButton: {
    position: 'absolute',
    left: 14,
  },
  titleBarText: {
    fontFamily: fontFamily.semiBold,
    fontWeight: '600',
    fontSize: 14,
    color: welcomeColors.cardBackground,
  },
  profile: {
    alignItems: 'center',
    marginBottom: 14,
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
    borderWidth: 1,
    borderColor: welcomeColors.cardBorder,
    overflow: 'hidden',
  },
  infoTitle: {
    fontFamily: fontFamily.semiBold,
    fontWeight: '600',
    fontSize: 14,
    color: welcomeColors.textPrimary,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  infoRow: {
    borderTopWidth: 1,
    borderTopColor: welcomeColors.cardBorder,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 3,
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
  notFound: {
    fontFamily: fontFamily.regular,
    fontWeight: '400',
    fontSize: 13,
    color: welcomeColors.textSecondary,
    textAlign: 'center',
    marginTop: 24,
  },
});
