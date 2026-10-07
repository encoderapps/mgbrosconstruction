import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AuthCard } from '../components/AuthCard';
import { CompanyCard } from '../components/CompanyCard';
import { ComplianceDocumentSection } from '../components/ComplianceDocumentSection';
import { HomeHeader } from '../components/HomeHeader';
import { LoadStateMessage } from '../components/LoadStateMessage';
import { ArrowLeftIcon, FolderIcon } from '../assets/icons';
import { fontFamily, welcomeColors } from '../theme';
import { AuthStackParamList } from '../navigation/types';
import { COMPLIANCE_DOCUMENT_INFO } from '../constants/complianceDocuments';
import { useComplianceDocuments } from '../hooks/useComplianceDocuments';
import { ComplianceDocument } from '../types/document';
import { showComingSoon } from '../utils/comingSoon';

type Props = NativeStackScreenProps<AuthStackParamList, 'Documents'>;

/** Home → Documents: the company's W9, General Liability and Workers' Comp, each opening its own screen. */
export function DocumentsScreen({ navigation }: Props): React.JSX.Element {
  const { data: documents, status, reload } = useComplianceDocuments();

  const openDocument = (document: ComplianceDocument): void => {
    navigation.navigate('DocumentDetails', { documentType: document.type });
  };

  const addDocument = (document: ComplianceDocument): void => {
    showComingSoon(`Add ${COMPLIANCE_DOCUMENT_INFO[document.type].label}`);
  };

  const renderDocuments = (): React.JSX.Element => {
    if (status === 'error') {
      return <LoadStateMessage state="error" message="Unable to load your documents." onRetry={reload} />;
    }
    if (!documents) {
      return <LoadStateMessage state="loading" />;
    }
    return (
      <AuthCard style={styles.documentsCard}>
        <View style={styles.documentsHeader}>
          <View style={styles.documentsIconWrapper}>
            <FolderIcon size={20} color={welcomeColors.accent} />
          </View>
          <Text style={styles.documentsTitle}>Documents</Text>
        </View>
        {documents.map((document, index) => (
          <ComplianceDocumentSection
            key={document.type}
            document={document}
            showDivider={index > 0}
            onOpen={openDocument}
            onAdd={addDocument}
          />
        ))}
      </AuthCard>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <HomeHeader />
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <Pressable
          onPress={() => navigation.goBack()}
          hitSlop={10}
          style={styles.backButton}
          accessibilityRole="button"
          accessibilityLabel="Back"
        >
          <ArrowLeftIcon size={18} color={welcomeColors.textPrimary} />
          <Text style={styles.backText}>Home</Text>
        </Pressable>

        <CompanyCard />
        {renderDocuments()}
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
    gap: 12,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 8,
  },
  backText: {
    fontFamily: fontFamily.semiBold,
    fontWeight: '600',
    fontSize: 15,
    color: welcomeColors.textPrimary,
  },
  // The sections run edge to edge, split by full-width dividers.
  documentsCard: {
    padding: 0,
    overflow: 'hidden',
  },
  documentsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: welcomeColors.cardBorder,
  },
  documentsIconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: welcomeColors.iconWrapperBackground,
    alignItems: 'center',
    justifyContent: 'center',
  },
  documentsTitle: {
    fontFamily: fontFamily.semiBold,
    fontWeight: '600',
    fontSize: 15,
    color: welcomeColors.textPrimary,
  },
});
