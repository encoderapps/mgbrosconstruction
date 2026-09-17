import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RoleCard } from '../components/RoleCard';
import { BarricadeIcon, BriefcaseIcon, UserIcon } from '../assets/icons';
import MgBrosConsLogo from '../assets/images/MGLogo.svg';
import { fontFamily, radius, shadows, welcomeColors } from '../theme';
import { AuthStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<AuthStackParamList, 'Welcome'>;

export function WelcomeScreen({ navigation }: Props): React.JSX.Element {
  const handleSubcontractor = (): void => {
    navigation.navigate('SubcontractorLogin');
  };

  const handleCustomer = (): void => {
    // TODO: navigate to the Customer flow once it exists
    console.log('TODO: navigate to Customer flow');
  };

  const handleEmployee = (): void => {
    // TODO: navigate to the Employee flow once it exists
    console.log('TODO: navigate to Employee flow');
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <MgBrosConsLogo style={styles.logo} />
        </View>

        <View style={styles.welcomeCard}>
          <Text style={styles.welcomeHeading}>Welcome</Text>
          <Text style={styles.welcomeSubtitle}>Please select how you want to continue</Text>
        </View>

        <View style={styles.dividerRow}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerLabel}>I am a:</Text>
          <View style={styles.dividerLine} />
        </View>

        <View style={styles.cardsGroup}>
          <RoleCard
            title="Subcontractor"
            description="Manage bids, purchase orders, projects and communicate with MG Bros. Construction."
            icon={<BarricadeIcon size={32} color={welcomeColors.accent} />}
            onPress={handleSubcontractor}
          />

          <RoleCard
            title="Customer"
            description="View projects, invoices, payments and communicate with MG Bros. Construction."
            icon={<UserIcon size={32} color={welcomeColors.accent} />}
            onPress={handleCustomer}
          />

          <RoleCard
            title="Employee"
            description="View schedules, timesheets, tasks and communicate with MG Bros. Construction."
            icon={<BriefcaseIcon size={32} color={welcomeColors.accent} />}
            onPress={handleEmployee}
          />
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
  container: {
    flexGrow: 1,
    width: '100%',
    paddingTop: 40,
    paddingHorizontal: 24,
    paddingBottom: 20,
    gap: 24,
  },
  header: {
    alignItems: 'center',
  },
  logo: {
    width: '62%',
    height: undefined,
    aspectRatio: 311 / 88,
  },
  welcomeCard: {
    backgroundColor: welcomeColors.cardBackground,
    borderRadius: radius.lg,
    paddingVertical: 20,
    paddingHorizontal: 16,
    alignItems: 'center',
    ...shadows.sm,
  },
  welcomeHeading: {
    fontFamily: fontFamily.bold,
    fontWeight: '700',
    fontSize: 32,
    lineHeight: 32,
    color: welcomeColors.textPrimary,
    textAlign: 'center',
    marginBottom: 8,
  },
  welcomeSubtitle: {
    fontFamily: fontFamily.medium,
    fontWeight: '500',
    fontSize: 14,
    lineHeight: 14,
    color: welcomeColors.textSecondary,
    textAlign: 'center',
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: welcomeColors.divider,
  },
  dividerLabel: {
    fontFamily: fontFamily.semiBold,
    fontWeight: '600',
    fontSize: 14,
    lineHeight: 14,
    color: welcomeColors.textPrimary,
    textAlign: 'center',
    marginHorizontal: 12,
  },
  cardsGroup: {
    width: '100%',
    gap: 12,
  },
});
