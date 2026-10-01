import React, { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AuthCard } from '../components/AuthCard';
import { AuthPrimaryButton } from '../components/AuthPrimaryButton';
import { HomeHeader } from '../components/HomeHeader';
import { KeyboardAwareScrollView } from '../components/KeyboardAwareScrollView';
import { LoginInput } from '../components/LoginInput';
import { SelectInput } from '../components/SelectInput';
import { ChevronRightIcon } from '../assets/icons';
import { fontFamily, radius, welcomeColors } from '../theme';
import { AuthStackParamList } from '../navigation/types';
import { SALUTATION_OPTIONS } from '../constants/salutationOptions';
import { useContacts } from '../context/ContactsContext';
import { useSubcontractorSession } from '../context/SubcontractorSessionContext';
import { useKeyboardHeight } from '../hooks/useKeyboardHeight';
import { createContact, updateContact as updateContactInSalesforce } from '../services/contactService';
import { findMissingRequiredField, isValidEmail } from '../utils/formValidation';

type Props = NativeStackScreenProps<AuthStackParamList, 'AddContact' | 'EditContact'>;

/** Add Contact, or Edit Contact when opened with a contactId (from Contact Details). */
export function ContactFormScreen({ navigation, route }: Props): React.JSX.Element {
  const { contacts, addContact, updateContact } = useContacts();
  const { company } = useSubcontractorSession();
  const insets = useSafeAreaInsets();
  const keyboardHeight = useKeyboardHeight();
  const editingId = route.params?.contactId;
  // Read once for the form's initial values; later list changes don't reset the form.
  const [existing] = useState(() => contacts.find((contact) => contact.id === editingId));
  const isEditing = !!editingId;
  const [salutation, setSalutation] = useState(existing?.salutation ?? '');
  const [firstName, setFirstName] = useState(existing?.firstName ?? '');
  const [middleName, setMiddleName] = useState(existing?.middleName ?? '');
  const [lastName, setLastName] = useState(existing?.lastName ?? '');
  const [suffix, setSuffix] = useState(existing?.suffix ?? '');
  const [contactOwner, setContactOwner] = useState(existing?.contactOwner ?? '');
  const [address, setAddress] = useState(existing?.address ?? '');
  const [phone, setPhone] = useState(existing?.phone ?? '');
  const [email, setEmail] = useState(existing?.email ?? '');
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async (): Promise<void> => {
    const missingField = findMissingRequiredField([
      { value: firstName, title: 'Missing first name', message: 'Please enter the first name.' },
      { value: lastName, title: 'Missing last name', message: 'Please enter the last name.' },
    ]);
    if (missingField) {
      Alert.alert(missingField.title, missingField.message);
      return;
    }
    if (email.trim() && !isValidEmail(email)) {
      Alert.alert('Invalid email', 'Please enter a valid email address.');
      return;
    }

    const accountId = company?.accountId;
    if (!accountId) {
      Alert.alert('Unable to save contact', 'Your account could not be found. Please log in again.');
      return;
    }

    const contact = {
      salutation,
      firstName: firstName.trim(),
      middleName: middleName.trim(),
      lastName: lastName.trim(),
      suffix: suffix.trim(),
      contactOwner: contactOwner.trim(),
      address: address.trim(),
      phone: phone.trim(),
      email: email.trim(),
    };

    setIsSaving(true);
    try {
      // Suffix and Contact Owner aren't accepted by the contact API yet, so
      // they're only kept locally.
      const payload = {
        AccountId: accountId,
        Salutation: contact.salutation,
        FirstName: contact.firstName,
        MiddleName: contact.middleName,
        LastName: contact.lastName,
        Email: contact.email,
        Phone: contact.phone,
        Address: contact.address,
      };
      const result = editingId
        ? await updateContactInSalesforce(editingId, payload)
        : await createContact(payload);
      if (!result.success || (!editingId && !result.contactId)) {
        Alert.alert('Unable to save contact', result.message || 'Please try again.');
        return;
      }
      if (editingId) {
        updateContact(editingId, contact);
      } else if (result.contactId) {
        addContact(result.contactId, contact);
      }
      navigation.goBack();
    } catch {
      Alert.alert('Unable to save contact', 'Something went wrong while saving the contact. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  // The layout doesn't scroll as a whole (the form scrolls inside the card),
  // so lift it above the keyboard to keep the fields and buttons visible.
  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <HomeHeader />
      <View
        style={[
          styles.container,
          keyboardHeight > 0 && { paddingBottom: 16 + Math.max(0, keyboardHeight - insets.bottom) },
        ]}
      >
        <View>
          <View style={styles.titleRow}>
            <Pressable
              onPress={() => navigation.goBack()}
              hitSlop={10}
              style={styles.backButton}
              accessibilityRole="button"
              accessibilityLabel="Back"
            >
              <ChevronRightIcon size={18} color={welcomeColors.textPrimary} />
            </Pressable>
            <Text style={styles.title}>{isEditing ? 'Edit Contact' : 'Add Contact'}</Text>
          </View>
          <Text style={styles.companyName}>{company?.name}</Text>
        </View>

        <AuthCard style={styles.card}>
          <KeyboardAwareScrollView
            style={styles.form}
            contentContainerStyle={styles.formContent}
            showsVerticalScrollIndicator
            padForKeyboard={false}
          >
            <SelectInput
              label="Salutation"
              placeholder="Select salutation"
              value={salutation}
              options={SALUTATION_OPTIONS}
              onSelect={setSalutation}
            />
            <LoginInput
              label="First Name"
              placeholder="Enter first name"
              value={firstName}
              onChangeText={setFirstName}
              autoCapitalize="words"
            />
            <LoginInput
              label="Middle Name"
              placeholder="Enter middle name"
              value={middleName}
              onChangeText={setMiddleName}
              autoCapitalize="words"
            />
            <LoginInput
              label="Last Name"
              placeholder="Enter last name"
              value={lastName}
              onChangeText={setLastName}
              autoCapitalize="words"
            />
            <LoginInput
              label="Suffix"
              placeholder="Enter suffix"
              value={suffix}
              onChangeText={setSuffix}
              autoCapitalize="words"
            />
            <LoginInput
              label="Contact Owner"
              placeholder="Enter contact owner"
              value={contactOwner}
              onChangeText={setContactOwner}
              autoCapitalize="words"
            />
            <LoginInput
              label="Address"
              placeholder="Enter address"
              value={address}
              onChangeText={setAddress}
              autoCapitalize="words"
            />
            <LoginInput
              label="Phone"
              placeholder="Enter phone number"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
            />
            <LoginInput
              label="Email"
              placeholder="Enter email address"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </KeyboardAwareScrollView>

          <View style={styles.buttonRow}>
            <Pressable
              onPress={() => navigation.goBack()}
              style={({ pressed }) => [styles.cancelButton, pressed && styles.pressed]}
              accessibilityRole="button"
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </Pressable>
            <AuthPrimaryButton
              title={isSaving ? 'Saving...' : isEditing ? 'Update Contact' : 'Save Contact'}
              onPress={handleSave}
              disabled={isSaving}
              style={styles.saveButton}
            />
          </View>
        </AuthCard>
      </View>
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
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 24,
    gap: 12,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backButton: {
    transform: [{ rotate: '180deg' }],
  },
  title: {
    fontFamily: fontFamily.bold,
    fontWeight: '700',
    fontSize: 20,
    color: welcomeColors.textPrimary,
  },
  companyName: {
    fontFamily: fontFamily.regular,
    fontWeight: '600',
    fontSize: 13,
    color: welcomeColors.loginButton,
    marginTop: 4,
  },
  card: {
    flex: 1,
  },
  form: {
    flex: 1,
  },
  formContent: {
    paddingBottom: 4,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
  },
  cancelButton: {
    flex: 1,
    height: 48,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: welcomeColors.loginButton,
    backgroundColor: welcomeColors.cardBackground,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    fontFamily: fontFamily.semiBold,
    fontWeight: '600',
    fontSize: 15,
    lineHeight: 22.5,
    color: welcomeColors.loginButton,
  },
  pressed: {
    opacity: 0.85,
  },
  saveButton: {
    flex: 1,
  },
});
