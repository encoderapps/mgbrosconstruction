import React, { useState } from 'react';
import { LayoutAnimation, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AuthCard } from '../components/AuthCard';
import { ContactsSection } from '../components/ContactsSection';
import { HomeHeader } from '../components/HomeHeader';
import { ExpandableTableSection } from '../components/ExpandableTableSection';
import { InvoicesTable } from '../components/InvoicesTable';
import { PurchaseOrdersTable } from '../components/PurchaseOrdersTable';
import {
  BagIcon,
  CardIcon,
  ChevronRightIcon,
  ClipboardCheckIcon,
  BriefcaseIcon,
  DocumentIcon,
  FolderIcon,
  LocationIcon,
  MailIcon,
  PhoneIcon,
} from '../assets/icons';
import { fontFamily, welcomeColors } from '../theme';
import { AuthStackParamList } from '../navigation/types';
import { EMPTY_VALUE } from '../constants/display';
import { useContacts } from '../context/ContactsContext';
import { useAccountList } from '../hooks/useAccountList';
import { fetchInvoices } from '../services/invoiceService';
import { fetchPurchaseOrders } from '../services/purchaseOrderService';
import { useSubcontractorSession } from '../context/SubcontractorSessionContext';
import { formatPhoneNumber } from '../utils/formatPhoneNumber';

type Props = NativeStackScreenProps<AuthStackParamList, 'Home'>;

type MenuItem = {
  key: string;
  label: string;
  icon: React.ReactNode;
};

// Contacts, Purchase Orders and Invoices are rendered separately since they
// expand in place; these are the plain menu rows around them.
const MENU_ITEMS_BEFORE_INVOICES: MenuItem[] = [
  { key: 'bids', label: 'Bids', icon: <ClipboardCheckIcon size={18} color={welcomeColors.accent} /> },
  { key: 'projects', label: 'Projects', icon: <BriefcaseIcon size={18} color={welcomeColors.accent} /> },
];
const MENU_ITEMS_AFTER_INVOICES: MenuItem[] = [
  { key: 'documents', label: 'Documents', icon: <FolderIcon size={18} color={welcomeColors.accent} /> },
  { key: 'paymentSettings', label: 'Payment Settings', icon: <CardIcon size={18} color={welcomeColors.accent} /> },
];

type ExpandableSection = 'contacts' | 'purchaseOrders' | 'invoices';

export function HomeScreen({ navigation }: Props): React.JSX.Element {
  const { company } = useSubcontractorSession();
  const { contacts } = useContacts();
  // Each section expands independently, so several can be open at once.
  const [expandedSections, setExpandedSections] = useState<ReadonlySet<ExpandableSection>>(new Set());

  // Each card fetches its latest 5 (the APIs' home/recent views) when it's expanded.
  const recentPurchaseOrders = useAccountList(fetchPurchaseOrders, 'home', expandedSections.has('purchaseOrders'));
  const recentInvoices = useAccountList(fetchInvoices, 'recent', expandedSections.has('invoices'));

  const toggleSection = (section: ExpandableSection): void => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedSections((current) => {
      const next = new Set(current);
      if (!next.delete(section)) {
        next.add(section);
      }
      return next;
    });
  };

  const renderMenuItem = (item: MenuItem): React.JSX.Element => (
    <Pressable key={item.key} hitSlop={4}>
      <AuthCard style={styles.menuCard}>
        <View style={styles.menuIconWrapper}>{item.icon}</View>
        <Text style={styles.menuLabel}>{item.label}</Text>
        <ChevronRightIcon size={16} color={welcomeColors.chevron} />
      </AuthCard>
    </Pressable>
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <HomeHeader />
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <AuthCard style={styles.companyCard}>
          <Text style={styles.companyName}>{company?.name || EMPTY_VALUE}</Text>

          <View style={styles.companyInfoRow}>
            <View style={styles.companyInfoColumn}>
              <View style={styles.companyInfoLine}>
                <LocationIcon size={14} color={welcomeColors.link} />
                <Text style={styles.companyInfoText}>{company?.address || EMPTY_VALUE}</Text>
              </View>
            </View>

            <View style={styles.companyInfoColumn}>
              <View style={styles.companyInfoLine}>
                <MailIcon size={13} color={welcomeColors.link} />
                <Text style={styles.companyInfoText}>{company?.email || EMPTY_VALUE}</Text>
              </View>
              <View style={styles.companyInfoLine}>
                <PhoneIcon size={13} color={welcomeColors.link} />
                <Text style={styles.companyInfoText}>
                  {company?.phone ? formatPhoneNumber(company.phone) : EMPTY_VALUE}
                </Text>
              </View>
            </View>
          </View>
        </AuthCard>

        <ContactsSection
          contacts={contacts}
          isExpanded={expandedSections.has('contacts')}
          onToggle={() => toggleSection('contacts')}
          onAddPress={() => navigation.navigate('AddContact')}
          onContactPress={(contact) => navigation.navigate('ContactDetails', { contactId: contact.id })}
        />

        <ExpandableTableSection
          title="Purchase Orders"
          icon={<BagIcon size={18} color={welcomeColors.accent} />}
          count={recentPurchaseOrders.count ?? undefined}
          isExpanded={expandedSections.has('purchaseOrders')}
          onToggle={() => toggleSection('purchaseOrders')}
          onViewAllPress={() => navigation.navigate('PurchaseOrders')}
        >
          <PurchaseOrdersTable
            orders={recentPurchaseOrders.items}
            status={recentPurchaseOrders.status}
            onRetry={recentPurchaseOrders.reload}
            onOrderPress={(order) => navigation.navigate('PurchaseOrderDetails', { poId: order.id })}
          />
        </ExpandableTableSection>

        {MENU_ITEMS_BEFORE_INVOICES.map(renderMenuItem)}

        <ExpandableTableSection
          title="Invoices"
          icon={<DocumentIcon size={18} color={welcomeColors.accent} />}
          count={recentInvoices.count ?? undefined}
          isExpanded={expandedSections.has('invoices')}
          onToggle={() => toggleSection('invoices')}
          onViewAllPress={() => navigation.navigate('Invoices')}
        >
          <InvoicesTable
            invoices={recentInvoices.items}
            status={recentInvoices.status}
            onRetry={recentInvoices.reload}
          />
        </ExpandableTableSection>

        {MENU_ITEMS_AFTER_INVOICES.map(renderMenuItem)}
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
