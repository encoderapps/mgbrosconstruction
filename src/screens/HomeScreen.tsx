import React, { useCallback, useMemo, useState } from 'react';
import { BackHandler, LayoutAnimation, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AuthCard } from '../components/AuthCard';
import { BidsTable } from '../components/BidsTable';
import { CompanyCard } from '../components/CompanyCard';
import { ContactsSection } from '../components/ContactsSection';
import { DocumentStatusMessage } from '../components/DocumentStatusMessage';
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
import { useComplianceDocuments } from '../hooks/useComplianceDocuments';
import { useLogout } from '../hooks/useLogout';
import { useRefreshOnReturn } from '../hooks/useRefreshOnReturn';
import { fetchBids } from '../services/bidService';
import { Bid } from '../types/bid';
import { fetchInvoices } from '../services/invoiceService';
import { fetchPurchaseOrders } from '../services/purchaseOrderService';
import { fetchSubcontractorProjects } from '../services/subcontractorProjectService';
import { describeDocumentsToUpload, getDocumentsToUpload } from '../utils/complianceDocument';

type Props = NativeStackScreenProps<AuthStackParamList, 'Home'>;

type MenuItem = {
  key: string;
  label: string;
  icon: React.ReactNode;
  /** The screen the row opens; rows without one aren't built yet. */
  screen?: 'Documents' | 'PaymentSettings';
  /** Can't be opened while a document is expired. */
  lockable?: boolean;
};

// Contacts, Purchase Orders, Bids, Projects and Invoices are rendered
// separately since they expand in place; these are the plain menu rows after them.
const MENU_ITEMS_AFTER_INVOICES: MenuItem[] = [
  {
    key: 'documents',
    label: 'Documents',
    icon: <FolderIcon size={18} color={welcomeColors.accent} />,
    screen: 'Documents',
  },
  {
    key: 'paymentSettings',
    label: 'Payment Settings',
    icon: <CardIcon size={18} color={welcomeColors.accent} />,
    screen: 'PaymentSettings',
    lockable: true,
  },
];

type ExpandableSection = 'contacts' | 'purchaseOrders' | 'bids' | 'projects' | 'invoices';

const LOCKED_SECTIONS = 'Purchase Orders, Bids, Projects, Invoices and Payment Settings';

export function HomeScreen({ navigation }: Props): React.JSX.Element {
  const contactList = useContacts();
  // Each section expands independently, so several can be open at once.
  const [expandedSections, setExpandedSections] = useState<ReadonlySet<ExpandableSection>>(new Set());

  // While a W9, GL, Workers' Comp or MSA is past its expiration date or not on file at all, everything but
  // Contacts and Documents is locked until it's uploaded. Nothing is locked while the documents load, or if
  // they fail to.
  const documents = useComplianceDocuments();
  // Coming back from Documents picks up a newly uploaded copy.
  useRefreshOnReturn(documents.refresh);
  const toUpload = useMemo(() => (documents.data ? getDocumentsToUpload(documents.data) : null), [documents.data]);
  const isLocked = !!toUpload && (toUpload.expired.length > 0 || toUpload.missing.length > 0);
  const lockedMessage = toUpload ? describeDocumentsToUpload(toUpload, LOCKED_SECTIONS) : '';
  const isOpen = (section: ExpandableSection): boolean =>
    expandedSections.has(section) && (section === 'contacts' || !isLocked);

  // Each card loads its latest 5 when it's expanded (the APIs' home/recent views; Projects trims the full list).
  const recentPurchaseOrders = useAccountList(fetchPurchaseOrders, 'home', isOpen('purchaseOrders'));
  const recentBids = useAccountList(fetchBids, 'home', isOpen('bids'));
  const recentProjects = useAccountList(fetchSubcontractorProjects, 'home', isOpen('projects'));
  const recentInvoices = useAccountList(fetchInvoices, 'recent', isOpen('invoices'));
  // A PO opened from here may have been signed or changed since; a bid may have a new total or be completed.
  useRefreshOnReturn(recentPurchaseOrders.refresh);
  useRefreshOnReturn(recentBids.refresh);
  const openBid = useCallback((bid: Bid) => navigation.navigate('BidDetails', { bidId: bid.id }), [navigation]);

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

  const renderMenuItem = ({ key, label, icon, screen, lockable }: MenuItem): React.JSX.Element => {
    const locked = isLocked && !!lockable;
    return (
      <Pressable
        key={key}
        hitSlop={4}
        onPress={screen && (() => navigation.navigate(screen))}
        disabled={locked}
        accessibilityRole="button"
        accessibilityState={{ disabled: locked }}
      >
        <AuthCard style={[styles.menuCard, locked && styles.locked]}>
          <View style={styles.menuIconWrapper}>{icon}</View>
          <Text style={styles.menuLabel}>{label}</Text>
          <ChevronRightIcon size={16} color={welcomeColors.chevron} />
        </AuthCard>
      </Pressable>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <HomeHeader />
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <CompanyCard />

        {isLocked && <DocumentStatusMessage status={{ tone: 'danger', message: lockedMessage }} />}

        <ContactsSection
          contacts={contactList.contacts}
          status={contactList.status}
          onRetry={contactList.reload}
          isExpanded={isOpen('contacts')}
          onToggle={() => {
            // Opening the card picks up contacts added or changed elsewhere since they were loaded.
            if (!expandedSections.has('contacts')) {
              contactList.refresh();
            }
            toggleSection('contacts');
          }}
          onAddPress={() => navigation.navigate('AddContact')}
          onContactPress={(contact) => navigation.navigate('ContactDetails', { contactId: contact.id })}
        />

        <ExpandableTableSection
          title="Purchase Orders"
          icon={<BagIcon size={18} color={welcomeColors.accent} />}
          count={recentPurchaseOrders.count ?? undefined}
          isExpanded={isOpen('purchaseOrders')}
          onToggle={() => toggleSection('purchaseOrders')}
          locked={isLocked}
          onViewAllPress={() => navigation.navigate('PurchaseOrders')}
        >
          <PurchaseOrdersTable
            orders={recentPurchaseOrders.items}
            status={recentPurchaseOrders.status}
            onRetry={recentPurchaseOrders.reload}
            onOrderPress={(order) => navigation.navigate('PurchaseOrderDetails', { poId: order.id, poDate: order.createdDate ?? undefined })}
          />
        </ExpandableTableSection>

        <ExpandableTableSection
          title="Bids"
          icon={<ClipboardCheckIcon size={18} color={welcomeColors.accent} />}
          count={recentBids.count ?? undefined}
          isExpanded={isOpen('bids')}
          onToggle={() => toggleSection('bids')}
          locked={isLocked}
          onViewAllPress={() => navigation.navigate('Bids')}
        >
          <BidsTable
            bids={recentBids.items}
            status={recentBids.status}
            onRetry={recentBids.reload}
            variant="preview"
            onBidPress={openBid}
          />
        </ExpandableTableSection>

        <ExpandableTableSection
          title="Projects"
          icon={<BriefcaseIcon size={18} color={welcomeColors.accent} />}
          count={recentProjects.count ?? undefined}
          isExpanded={isOpen('projects')}
          onToggle={() => toggleSection('projects')}
          locked={isLocked}
          onViewAllPress={() => navigation.navigate('Projects')}
        >
          <ProjectsTable
            projects={recentProjects.items}
            status={recentProjects.status}
            onRetry={recentProjects.reload}
            // TODO: pass onProjectPress once the project screen is designed; until then the rows can't be tapped.
          />
        </ExpandableTableSection>

        <ExpandableTableSection
          title="Invoices"
          icon={<DocumentIcon size={18} color={welcomeColors.accent} />}
          count={recentInvoices.count ?? undefined}
          isExpanded={isOpen('invoices')}
          onToggle={() => toggleSection('invoices')}
          locked={isLocked}
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
  locked: {
    opacity: 0.5,
  },
  menuLabel: {
    flex: 1,
    fontFamily: fontFamily.semiBold,
    fontWeight: '600',
    fontSize: 13,
    color: welcomeColors.textPrimary,
  },
});
