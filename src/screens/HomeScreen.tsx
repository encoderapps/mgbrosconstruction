import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import MgBrosSubcontractorLogo from '../assets/images/mg-bros-subcontractor-logo.svg';
import { AuthCard } from '../components/AuthCard';
import {
  BagIcon,
  BellIcon,
  CardIcon,
  ChatIcon,
  CheckCircleIcon,
  ChevronRightIcon,
  ClipboardCheckIcon,
  BriefcaseIcon,
  DocumentIcon,
  FolderIcon,
  LocationIcon,
  MailIcon,
  PhoneIcon,
  UserIcon,
} from '../assets/icons';
import { fontFamily, radius, welcomeColors } from '../theme';
import { AuthStackParamList } from '../navigation/types';
import { MOCK_SUBCONTRACTOR_COMPANY } from '../constants/mockData';

type Props = NativeStackScreenProps<AuthStackParamList, 'Home'>;

type MenuItem = {
  key: string;
  label: string;
  icon: React.ReactNode;
};

const MENU_ITEMS: MenuItem[] = [
  { key: 'contacts', label: 'Contacts', icon: <UserIcon size={18} color={welcomeColors.accent} /> },
  { key: 'purchaseOrders', label: 'Purchase Orders', icon: <BagIcon size={18} color={welcomeColors.accent} /> },
  { key: 'bids', label: 'Bids', icon: <ClipboardCheckIcon size={18} color={welcomeColors.accent} /> },
  { key: 'projects', label: 'Projects', icon: <BriefcaseIcon size={18} color={welcomeColors.accent} /> },
  { key: 'invoices', label: 'Invoices', icon: <DocumentIcon size={18} color={welcomeColors.accent} /> },
  { key: 'documents', label: 'Documents', icon: <FolderIcon size={18} color={welcomeColors.accent} /> },
  { key: 'paymentSettings', label: 'Payment Settings', icon: <CardIcon size={18} color={welcomeColors.accent} /> },
];

export function HomeScreen(_props: Props): React.JSX.Element {
  const company = MOCK_SUBCONTRACTOR_COMPANY;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <MgBrosSubcontractorLogo style={styles.logo} />

          <View style={styles.documentsPill}>
            <Text style={styles.documentsPillText}>Documents:</Text>
            <CheckCircleIcon size={14} />
          </View>

          <View style={styles.headerIcons}>
            <View style={styles.headerIconWrapper}>
              <BellIcon size={16} color={welcomeColors.accent} />
            </View>
            <View style={styles.headerIconWrapper}>
              <ChatIcon size={16} color={welcomeColors.accent} />
            </View>
            <View style={styles.headerIconWrapper}>
              <UserIcon size={16} color={welcomeColors.accent} />
            </View>
          </View>
        </View>

        <AuthCard style={styles.companyCard}>
          <Text style={styles.companyName}>{company.name}</Text>

          <View style={styles.companyInfoRow}>
            <View style={styles.companyInfoColumn}>
              <View style={styles.companyInfoLine}>
                <LocationIcon size={14} color={welcomeColors.link} />
                <Text style={styles.companyInfoText}>{company.addressLines.join('\n')}</Text>
              </View>
            </View>

            <View style={styles.companyInfoColumn}>
              <View style={styles.companyInfoLine}>
                <MailIcon size={13} color={welcomeColors.link} />
                <Text style={styles.companyInfoText}>{company.email}</Text>
              </View>
              <View style={styles.companyInfoLine}>
                <PhoneIcon size={13} color={welcomeColors.link} />
                <Text style={styles.companyInfoText}>{company.phone}</Text>
              </View>
            </View>
          </View>
        </AuthCard>

        {MENU_ITEMS.map((item) => (
          <Pressable key={item.key} hitSlop={4}>
            <AuthCard style={styles.menuCard}>
              <View style={styles.menuIconWrapper}>{item.icon}</View>
              <Text style={styles.menuLabel}>{item.label}</Text>
              <ChevronRightIcon size={16} color={welcomeColors.chevron} />
            </AuthCard>
          </Pressable>
        ))}
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
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 24,
    gap: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  logo: {
    width: 24,
    height: undefined,
    aspectRatio: 311 / 116,
  },
  documentsPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: 'rgba(46, 125, 50, 0.1)',
    borderWidth: 1,
    borderColor: welcomeColors.registerGreen,
    borderRadius: radius.pill,
    paddingVertical: 6,
  },
  documentsPillText: {
    fontFamily: fontFamily.semiBold,
    fontWeight: '600',
    fontSize: 12,
    color: welcomeColors.registerGreen,
  },
  headerIcons: {
    flexDirection: 'row',
    gap: 6,
  },
  headerIconWrapper: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: welcomeColors.cardBackground,
    borderWidth: 1,
    borderColor: welcomeColors.cardBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  companyCard: {
    alignItems: 'stretch',
  },
  companyName: {
    fontFamily: fontFamily.bold,
    fontWeight: '700',
    fontSize: 16,
    color: welcomeColors.textPrimary,
    textAlign: 'center',
    marginBottom: 10,
  },
  companyInfoRow: {
    flexDirection: 'row',
    gap: 12,
  },
  companyInfoColumn: {
    flex: 1,
    gap: 6,
  },
  companyInfoLine: {
    flexDirection: 'row',
    gap: 6,
  },
  companyInfoText: {
    flex: 1,
    fontFamily: fontFamily.regular,
    fontWeight: '400',
    fontSize: 11,
    lineHeight: 16,
    color: welcomeColors.link,
  },
  menuCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
  },
  menuIconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: welcomeColors.iconWrapperBackground,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuLabel: {
    flex: 1,
    fontFamily: fontFamily.semiBold,
    fontWeight: '600',
    fontSize: 13,
    color: welcomeColors.textPrimary,
  },
});
