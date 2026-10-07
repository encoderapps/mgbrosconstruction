import React, { useCallback, useState } from 'react';
import { BackHandler, LayoutAnimation, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AuthCard } from '../components/AuthCard';
import { CompanyCard } from '../components/CompanyCard';
import { ContactsSection } from '../components/ContactsSection';
import { HomeHeader } from '../components/HomeHeader';
import { ExpandableTableSection } from '../components/ExpandableTableSection';
import { InvoicesTable } from '../components/InvoicesTable';
import { ProjectsTable } from '../components/ProjectsTable';
import { PurchaseOrdersTable } from '../components/PurchaseOrdersTable';
import {
  BagIcon,
  CardIcon,
  ChevronRightIcon,
  ClipboardCheckIcon,
  BriefcaseIcon,
  DocumentIcon,
  FolderIcon,
} from '../assets/icons';
import { fontFamily, welcomeColors } from '../theme';
import { AuthStackParamList } from '../navigation/types';
import { useContacts } from '../context/ContactsContext';
import { useAccountList } from '../hooks/useAccountList';
import { useLogout } from '../hooks/useLogout';
import { useRefreshOnReturn } from '../hooks/useRefreshOnReturn';
import { fetchInvoices } from '../services/invoiceService';
import { fetchPurchaseOrders } from '../services/purchaseOrderService';
import { fetchSubcontractorProjects } from '../services/subcontractorProjectService';
import { showComingSoon } from '../utils/comingSoon';

type Props = NativeStackScreenProps<AuthStackParamList, 'Home'>;

type MenuItem = {
  key: string;
  label: string;
  icon: React.ReactNode;
  /** The screen the row opens; rows without one aren't built yet. */
  screen?: 'Documents';
};

// Contacts, Purchase Orders, Projects and Invoices are rendered separately
// since they expand in place; these are the plain menu rows around them.
const MENU_ITEMS_BEFORE_PROJECTS: MenuItem[] = [
  { key: 'bids', label: 'Bids', icon: <ClipboardCheckIcon size={18} color={welcomeColors.accent} /> },
];
const MENU_ITEMS_AFTER_INVOICES: MenuItem[] = [
  {
    key: 'documents',
    label: 'Documents',
    icon: <FolderIcon size={18} color={welcomeColors.accent} />,
    screen: 'Documents',
  },
  { key: 'paymentSettings', label: 'Payment Settings', icon: <CardIcon size={18} color={welcomeColors.accent} /> },
];

type ExpandableSection = 'contacts' | 'purchaseOrders' | 'projects' | 'invoices';

export function HomeScreen({ navigation }: Props): React.JSX.Element {
  const { contacts } = useContacts();
  // Each section expands independently, so several can be open at once.
  const [expandedSections, setExpandedSections] = useState<ReadonlySet<ExpandableSection>>(new Set());

  // Each card loads its latest 5 when it's expanded (the APIs' home/recent views; Projects trims the full list).
  const recentPurchaseOrders = useAccountList(fetchPurchaseOrders, 'home', expandedSections.has('purchaseOrders'));
  const recentProjects = useAccountList(fetchSubcontractorProjects, 'home', expandedSections.has('projects'));
  const recentInvoices = useAccountList(fetchInvoices, 'recent', expandedSections.has('invoices'));
  // A PO opened from here may have been signed or changed since.
  useRefreshOnReturn(recentPurchaseOrders.refresh);

  // Home is the first screen after login (the login screens are gone from the
  // stack), so Android's back button would close the app: offer to log out instead.
  const { confirmLogout } = useLogout();
  useFocusEffect(
    useCallback(() => {
      const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
        confirmLogout('Going back will end your session. Do you want to log out?');
        return true;
      });
      return () => subscription.remove();
    }, [confirmLogout]),
  );

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

  const renderMenuItem = ({ key, label, icon, screen }: MenuItem): React.JSX.Element => (
    <Pressable
      key={key}
      hitSlop={4}
      onPress={screen && (() => navigation.navigate(screen))}
      accessibilityRole="button"
    >
      <AuthCard style={styles.menuCard}>
        <View style={styles.menuIconWrapper}>{icon}</View>
        <Text style={styles.menuLabel}>{label}</Text>
        <ChevronRightIcon size={16} color={welcomeColors.chevron} />
      </AuthCard>
    </Pressable>
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <HomeHeader />
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <CompanyCard />

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
            onOrderPress={(order) => navigation.navigate('PurchaseOrderDetails', { poId: order.id, poDate: order.createdDate ?? undefined })}
          />
        </ExpandableTableSection>

        {MENU_ITEMS_BEFORE_PROJECTS.map(renderMenuItem)}

        <ExpandableTableSection
          title="Projects"
          icon={<BriefcaseIcon size={18} color={welcomeColors.accent} />}
          count={recentProjects.count ?? undefined}
          isExpanded={expandedSections.has('projects')}
          onToggle={() => toggleSection('projects')}
          onViewAllPress={() => navigation.navigate('Projects')}
        >
          <ProjectsTable
            projects={recentProjects.items}
            status={recentProjects.status}
            onRetry={recentProjects.reload}
            // TODO: open the project once its screen is designed.
            onProjectPress={(project) => showComingSoon(project.name)}
          />
        </ExpandableTableSection>

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
