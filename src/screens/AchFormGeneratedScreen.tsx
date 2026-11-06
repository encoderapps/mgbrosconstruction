import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AuthCard } from '../components/AuthCard';
import { HomeHeader } from '../components/HomeHeader';
import { ScreenTitleBar } from '../components/ScreenTitleBar';
import { ArrowLeftIcon, CheckCircleIcon } from '../assets/icons';
import { fontFamily, toneColors, welcomeColors } from '../theme';
import { AuthStackParamList } from '../navigation/types';
import { EMPTY_VALUE } from '../constants/display';
import { maskBankNumber } from '../utils/bankAccount';
import { formatDateTime } from '../utils/formatDate';

type Props = NativeStackScreenProps<AuthStackParamList, 'AchFormGenerated'>;

/** After Save & Generate ACH Form: what was saved (account numbers masked). */
export function AchFormGeneratedScreen({ navigation, route }: Props): React.JSX.Element {
  const { ach } = route.params;

  const summary: [string, string][] = [
    ['Bank Name', ach.bankName],
    ['Account Type', ach.accountType],
    ['Account Number', maskBankNumber(ach.accountNumber)],
    ['Routing Number', maskBankNumber(ach.routingNumber)],
    ['Generated On', ach.generatedAt ? formatDateTime(ach.generatedAt) : EMPTY_VALUE],
  ];

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <HomeHeader />
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <ScreenTitleBar title="ACH Form Generated" onBackPress={() => navigation.goBack()} />

        <View style={styles.hero}>
          <View style={styles.iconHalo}>
            <CheckCircleIcon size={44} color={toneColors.success.foreground} />
          </View>
          <Text style={styles.title} accessibilityRole="header">
            ACH Form Generated Successfully!
          </Text>
          <Text style={styles.subtitle}>Your ACH form has been created using the information provided.</Text>
        </View>

        <AuthCard style={styles.summaryCard}>
          {summary.map(([label, value], index) => (
            <View key={label} style={[styles.summaryRow, index > 0 && styles.summaryDivider]}>
              <Text style={styles.summaryLabel}>{label}</Text>
              <Text style={styles.summaryValue}>{value}</Text>
            </View>
          ))}
        </AuthCard>

        {/* View and Download ACH Form are hidden for now. */}

        <Pressable
          onPress={() => navigation.goBack()}
          hitSlop={8}
          style={({ pressed }) => [styles.backLink, pressed && styles.pressed]}
          accessibilityRole="button"
        >
          <ArrowLeftIcon size={14} color={welcomeColors.accent} />
          <Text style={styles.backLinkText}>Back to Payment Settings</Text>
        </Pressable>
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
  hero: {
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
  },
  iconHalo: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: toneColors.success.background,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  title: {
    fontFamily: fontFamily.bold,
    fontWeight: '700',
    fontSize: 17,
    color: welcomeColors.accent,
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: fontFamily.regular,
    fontWeight: '400',
    fontSize: 13,
    lineHeight: 19,
    color: welcomeColors.textSecondary,
    textAlign: 'center',
  },
  summaryCard: {
    paddingVertical: 6,
  },
  summaryRow: {
    flexDirection: 'row',
    paddingVertical: 9,
    gap: 12,
  },
  summaryDivider: {
    borderTopWidth: 1,
    borderTopColor: welcomeColors.cardBorder,
  },
  summaryLabel: {
    flex: 1,
    fontFamily: fontFamily.regular,
    fontWeight: '400',
    fontSize: 12,
    color: welcomeColors.textSecondary,
  },
  summaryValue: {
    flex: 1.3,
    fontFamily: fontFamily.medium,
    fontWeight: '500',
    fontSize: 12,
    color: welcomeColors.textPrimary,
  },
  backLink: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    gap: 6,
    paddingVertical: 4,
  },
  backLinkText: {
    fontFamily: fontFamily.medium,
    fontWeight: '500',
    fontSize: 13,
    color: welcomeColors.accent,
  },
  pressed: {
    opacity: 0.7,
  },
});
