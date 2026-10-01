import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ChevronRightIcon, PlusIcon, UserIcon } from '../assets/icons';
import { fontFamily, welcomeColors } from '../theme';
import { Contact } from '../types/contact';
import { EMPTY_VALUE } from '../constants/display';
import { formatPhoneNumber } from '../utils/formatPhoneNumber';
import { getInitials } from '../utils/signature';
import { AuthCard } from './AuthCard';

type ContactsSectionProps = {
  contacts: Contact[];
  isExpanded: boolean;
  onToggle: () => void;
  onAddPress: () => void;
  onContactPress: (contact: Contact) => void;
};

export function getContactDisplayName(contact: Contact): string {
  return [contact.firstName, contact.lastName].filter(Boolean).join(' ');
}

/** Home screen Contacts card: collapsed it's a menu row; expanded it shows the contacts table. */
export function ContactsSection({
  contacts,
  isExpanded,
  onToggle,
  onAddPress,
  onContactPress,
}: ContactsSectionProps): React.JSX.Element {
  return (
    <AuthCard style={[styles.card, isExpanded && styles.cardExpanded]}>
      <Pressable
        onPress={onToggle}
        hitSlop={4}
        style={styles.header}
        accessibilityRole="button"
        accessibilityState={{ expanded: isExpanded }}
        accessibilityLabel="Contacts"
      >
        <View style={styles.iconWrapper}>
          <UserIcon size={18} color={welcomeColors.accent} />
        </View>
        <Text style={styles.title}>Contacts</Text>
        {isExpanded && (
          <Pressable
            onPress={onAddPress}
            hitSlop={8}
            style={styles.addButton}
            accessibilityRole="button"
            accessibilityLabel="Add contact"
          >
            <PlusIcon size={14} color={welcomeColors.cardBackground} />
          </Pressable>
        )}
        <View style={isExpanded ? styles.chevronExpanded : undefined}>
          <ChevronRightIcon size={16} color={welcomeColors.chevron} />
        </View>
      </Pressable>

      {isExpanded && <ContactList contacts={contacts} onContactPress={onContactPress} />}
    </AuthCard>
  );
}

function ContactList({
  contacts,
  onContactPress,
}: {
  contacts: Contact[];
  onContactPress: (contact: Contact) => void;
}): React.JSX.Element {
  return (
    <View style={styles.table}>
      <View style={[styles.row, styles.headerRow]}>
        <Text style={[styles.headerCell, styles.nameColumn]}>Name</Text>
        <Text style={[styles.headerCell, styles.phoneColumn]}>Phone</Text>
        <Text style={[styles.headerCell, styles.emailColumn]}>Email</Text>
        <Text style={[styles.headerCell, styles.roleColumn]}>Role</Text>
      </View>

      {contacts.length === 0 ? (
        <Text style={styles.emptyText}>No contacts yet. Tap + to add one.</Text>
      ) : (
        contacts.map((contact, index) => {
          const name = getContactDisplayName(contact);
          return (
            <View key={contact.id} style={[styles.row, index > 0 && styles.rowDivider]}>
              <Pressable
                onPress={() => onContactPress(contact)}
                hitSlop={4}
                style={[styles.nameColumn, styles.nameCell]}
                accessibilityRole="link"
                accessibilityLabel={`${name}, view contact details`}
              >
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{getInitials(name)}</Text>
                </View>
                <Text style={styles.nameText} numberOfLines={2}>
                  {name}
                </Text>
              </Pressable>
              <Text style={[styles.cellText, styles.phoneColumn]} numberOfLines={2}>
                {contact.phone ? formatPhoneNumber(contact.phone) : EMPTY_VALUE}
              </Text>
              <Text style={[styles.cellText, styles.emailColumn]} numberOfLines={2}>
                {contact.email || EMPTY_VALUE}
              </Text>
              <Text style={[styles.cellText, styles.roleColumn, styles.roleText]} numberOfLines={2}>
                {contact.role || EMPTY_VALUE}
              </Text>
            </View>
          );
        })
      )}
    </View>
  );
}

const CARD_PADDING = 16;

const styles = StyleSheet.create({
  // Matches the Home screen's menu cards when collapsed.
  card: {
    paddingVertical: 12,
  },
  cardExpanded: {
    paddingBottom: 0,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
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
    fontSize: 13,
    color: welcomeColors.textPrimary,
  },
  addButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: welcomeColors.chevron,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chevronExpanded: {
    transform: [{ rotate: '90deg' }],
  },
  // The table runs edge to edge inside the card, like the reference.
  table: {
    marginTop: 12,
    marginHorizontal: -CARD_PADDING,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 10,
    gap: 6,
  },
  headerRow: {
    backgroundColor: welcomeColors.loginButton,
    paddingVertical: 8,
  },
  rowDivider: {
    borderTopWidth: 1,
    borderTopColor: welcomeColors.cardBorder,
  },
  headerCell: {
    fontFamily: fontFamily.semiBold,
    fontWeight: '600',
    fontSize: 11,
    color: welcomeColors.cardBackground,
  },
  // Flexible column widths so rows never overflow on narrow screens.
  nameColumn: {
    flex: 1.35,
  },
  phoneColumn: {
    flex: 1.35,
  },
  emailColumn: {
    flex: 1.5,
  },
  roleColumn: {
    flex: 1,
  },
  nameCell: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  avatar: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: welcomeColors.iconWrapperBackground,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontFamily: fontFamily.semiBold,
    fontWeight: '600',
    fontSize: 9,
    color: welcomeColors.accent,
  },
  nameText: {
    flex: 1,
    fontFamily: fontFamily.medium,
    fontWeight: '500',
    fontSize: 11,
    lineHeight: 15,
    color: welcomeColors.link,
  },
  cellText: {
    fontFamily: fontFamily.regular,
    fontWeight: '400',
    fontSize: 11,
    lineHeight: 15,
    color: welcomeColors.textPrimary,
  },
  roleText: {
    color: welcomeColors.textSecondary,
  },
  emptyText: {
    fontFamily: fontFamily.regular,
    fontWeight: '400',
    fontSize: 11,
    color: welcomeColors.textSecondary,
    textAlign: 'center',
    paddingVertical: 14,
  },
});
