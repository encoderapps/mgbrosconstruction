import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { HomeHeader } from '../components/HomeHeader';
import {
  AlertCircleIcon,
  CalendarIcon,
  CardIcon,
  CheckIcon,
  ChevronRightIcon,
  DocumentIcon,
  PlusIcon,
  UserIcon,
} from '../assets/icons';
import { Tone, fontFamily, portalColors, radius, toneColors, welcomeColors } from '../theme';
import { AuthStackParamList } from '../navigation/types';
import { MOCK_NOTIFICATIONS } from '../constants/mockData';
import { AppNotification, NotificationKind } from '../types/notification';

type Props = NativeStackScreenProps<AuthStackParamList, 'Notifications'>;

/** Tone and icon for each kind of notification. */
const KIND_STYLES: Record<NotificationKind, { tone: Tone; renderIcon: (color: string) => React.ReactNode }> = {
  bidAccepted: { tone: 'success', renderIcon: (color) => <CheckIcon size={14} color={color} /> },
  poUpdated: { tone: 'info', renderIcon: (color) => <DocumentIcon size={15} color={color} /> },
  invoiceReminder: { tone: 'warning', renderIcon: (color) => <AlertCircleIcon size={15} color={color} /> },
  documentExpiring: { tone: 'danger', renderIcon: (color) => <AlertCircleIcon size={15} color={color} /> },
  paymentReceived: { tone: 'success', renderIcon: (color) => <CardIcon size={15} color={color} /> },
  projectAssigned: { tone: 'info', renderIcon: (color) => <PlusIcon size={14} color={color} /> },
  bidDueSoon: { tone: 'warning', renderIcon: (color) => <CalendarIcon size={14} color={color} /> },
  contactAdded: { tone: 'info', renderIcon: (color) => <UserIcon size={15} color={color} /> },
};

/**
 * The bell in the header opens this. There's no notifications API yet, so it
 * shows sample notifications; tapping one marks it read.
 */
export function NotificationsScreen({ navigation }: Props): React.JSX.Element {
  const [notifications, setNotifications] = useState<AppNotification[]>(MOCK_NOTIFICATIONS);
  const unreadCount = notifications.filter((notification) => !notification.isRead).length;

  const markAsRead = (id: string): void => {
    setNotifications((current) =>
      current.map((notification) => (notification.id === id ? { ...notification, isRead: true } : notification)),
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <HomeHeader active="notifications" />
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
          <Text style={styles.title}>Notifications</Text>
          {unreadCount > 0 && (
            <View style={styles.newBadge}>
              <Text style={styles.newBadgeText}>{unreadCount} New</Text>
            </View>
          )}
        </View>

        {notifications.length === 0 ? (
          <Text style={styles.emptyText}>You have no notifications.</Text>
        ) : (
          notifications.map((notification) => {
            const { tone, renderIcon } = KIND_STYLES[notification.kind];
            const toneColor = toneColors[tone];
            return (
              <Pressable
                key={notification.id}
                onPress={() => markAsRead(notification.id)}
                style={({ pressed }) => [
                  styles.card,
                  !notification.isRead && styles.cardUnread,
                  pressed && styles.pressed,
                ]}
                accessibilityRole="button"
                accessibilityLabel={`${notification.isRead ? '' : 'Unread. '}${notification.title}. ${notification.message}`}
              >
                <View style={[styles.iconCircle, { backgroundColor: toneColor.background }]}>
                  {renderIcon(toneColor.foreground)}
                </View>
                <View style={styles.cardBody}>
                  <Text style={styles.cardTitle}>{notification.title}</Text>
                  <Text style={styles.cardMessage}>{notification.message}</Text>
                  <Text style={styles.cardTime}>{notification.timeAgo}</Text>
                </View>
                {!notification.isRead && <View style={styles.unreadDot} />}
              </Pressable>
            );
          })
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
    paddingTop: 16,
    paddingBottom: 24,
    gap: 10,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 4,
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
  newBadge: {
    backgroundColor: welcomeColors.loginButton,
    borderRadius: radius.pill,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  newBadgeText: {
    fontFamily: fontFamily.semiBold,
    fontWeight: '600',
    fontSize: 11,
    color: welcomeColors.cardBackground,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    padding: 12,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: welcomeColors.cardBorder,
    backgroundColor: welcomeColors.cardBackground,
  },
  cardUnread: {
    backgroundColor: portalColors.unreadBackground,
  },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardBody: {
    flex: 1,
    gap: 2,
  },
  cardTitle: {
    fontFamily: fontFamily.semiBold,
    fontWeight: '600',
    fontSize: 14,
    color: welcomeColors.textPrimary,
  },
  cardMessage: {
    fontFamily: fontFamily.regular,
    fontWeight: '400',
    fontSize: 12,
    lineHeight: 17,
    color: welcomeColors.textSecondary,
  },
  cardTime: {
    fontFamily: fontFamily.regular,
    fontWeight: '400',
    fontSize: 11,
    color: welcomeColors.chevron,
    marginTop: 2,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: toneColors.info.foreground,
    marginTop: 6,
  },
  emptyText: {
    fontFamily: fontFamily.regular,
    fontWeight: '400',
    fontSize: 13,
    color: welcomeColors.textSecondary,
    textAlign: 'center',
    marginTop: 24,
  },
  pressed: {
    opacity: 0.85,
  },
});
