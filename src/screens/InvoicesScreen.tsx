import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AuthCard } from '../components/AuthCard';
import { HomeHeader } from '../components/HomeHeader';
import { InvoicesTable } from '../components/InvoicesTable';
import { ArrowLeftIcon } from '../assets/icons';
import { fontFamily, radius, welcomeColors } from '../theme';
import { AuthStackParamList } from '../navigation/types';
import { useAccountList } from '../hooks/useAccountList';
import { fetchInvoices } from '../services/invoiceService';

type Props = NativeStackScreenProps<AuthStackParamList, 'Invoices'>;

/** "View All" from the Home screen's Invoices card: every invoice. */
export function InvoicesScreen({ navigation }: Props): React.JSX.Element {
  const { items: invoices, count: totalInvoices, status, reload } = useAccountList(fetchInvoices, 'all');

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <HomeHeader />
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.titleRow}>
          <Pressable
            onPress={() => navigation.goBack()}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel="Back"
          >
            <ArrowLeftIcon size={20} color={welcomeColors.textPrimary} />
          </Pressable>
          <Text style={styles.title}>
            Invoices
            {totalInvoices !== null && <Text style={styles.count}> ({totalInvoices})</Text>}
          </Text>
          <Pressable
            onPress={() => navigation.navigate('PurchaseOrders')}
            hitSlop={6}
            style={({ pressed }) => [styles.viewPosButton, pressed && styles.pressed]}
            accessibilityRole="button"
          >
            <Text style={styles.viewPosText}>View POs</Text>
          </Pressable>
        </View>

        <AuthCard style={styles.tableCard}>
          <InvoicesTable invoices={invoices} status={status} onRetry={reload} />
        </AuthCard>
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
    gap: 14,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  title: {
    flex: 1,
    fontFamily: fontFamily.bold,
    fontWeight: '700',
    fontSize: 20,
    color: welcomeColors.textPrimary,
  },
  count: {
    fontFamily: fontFamily.regular,
    fontWeight: '400',
    fontSize: 16,
    color: welcomeColors.accent,
  },
  viewPosButton: {
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: welcomeColors.loginButton,
    backgroundColor: welcomeColors.cardBackground,
  },
  viewPosText: {
    fontFamily: fontFamily.medium,
    fontWeight: '500',
    fontSize: 12,
    color: welcomeColors.textPrimary,
  },
  pressed: {
    opacity: 0.85,
  },
  // The table fills the card edge to edge.
  tableCard: {
    padding: 0,
    overflow: 'hidden',
  },
});
