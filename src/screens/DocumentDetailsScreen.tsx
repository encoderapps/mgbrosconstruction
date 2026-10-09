import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AuthCard } from '../components/AuthCard';
import { CurrentDocumentCard } from '../components/CurrentDocumentCard';
import { DocumentStatusMessage } from '../components/DocumentStatusMessage';
import { HomeHeader } from '../components/HomeHeader';
import { InfoNote } from '../components/InfoNote';
import { LoadStateMessage } from '../components/LoadStateMessage';
import { PreviousVersionsCard } from '../components/PreviousVersionsCard';
import { ArrowLeftIcon } from '../assets/icons';
import { fontFamily, welcomeColors } from '../theme';
import { AuthStackParamList } from '../navigation/types';
import { COMPLIANCE_DOCUMENT_INFO } from '../constants/complianceDocuments';
import { useSubcontractorSession } from '../context/SubcontractorSessionContext';
import { useComplianceDocuments } from '../hooks/useComplianceDocuments';
import { useDocumentFileActions } from '../hooks/useDocumentFileActions';
import { getDocumentStatus, isInsuranceCertificate } from '../utils/complianceDocument';

type Props = NativeStackScreenProps<AuthStackParamList, 'DocumentDetails'>;

/** Home → Documents → one document: its current copy, status and previous versions. */
export function DocumentDetailsScreen({ navigation, route }: Props): React.JSX.Element {
  const { documentType } = route.params;
  const companyName = useSubcontractorSession().company?.name;
  const { data: documents, status, reload } = useComplianceDocuments();
  const document = documents?.find((item) => item.type === documentType);

  const pageTitle = [COMPLIANCE_DOCUMENT_INFO[documentType].label, companyName].filter(Boolean).join(' - ');

  const { busyFileId, openFile, downloadFile } = useDocumentFileActions();

  const renderBody = (): React.JSX.Element => {
    if (status === 'error') {
      return <LoadStateMessage state="error" message="Unable to load this document." onRetry={reload} />;
    }
    if (!documents) {
      return <LoadStateMessage state="loading" />;
    }
    if (!document) {
      return <Text style={styles.notFound}>This document could not be found.</Text>;
    }

    const isCertificate = isInsuranceCertificate(documentType);
    return (
      <>
        {document.current ? (
          <CurrentDocumentCard
            type={documentType}
            file={document.current}
            isBusy={busyFileId === document.current.id}
            isDisabled={busyFileId !== null}
            onOpen={openFile}
            onDownload={downloadFile}
          />
        ) : (
          <AuthCard>
            <DocumentStatusMessage status={getDocumentStatus(documentType, null)} />
          </AuthCard>
        )}
        {document.previousVersions.length > 0 && (
          <PreviousVersionsCard
            versions={document.previousVersions}
            busyFileId={busyFileId}
            onOpen={openFile}
            onDownload={downloadFile}
          />
        )}
        <InfoNote>
          {isCertificate
            ? 'When a new certificate is added, the previous one is moved to history.'
            : `A new ${COMPLIANCE_DOCUMENT_INFO[documentType].label} replaces the previous version but history is always kept.`}
        </InfoNote>
      </>
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
          <ArrowLeftIcon size={18} color={welcomeColors.accent} />
          <Text style={styles.backText} numberOfLines={1}>
            {pageTitle}
          </Text>
        </Pressable>
        {renderBody()}
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
    gap: 8,
  },
  backText: {
    flexShrink: 1,
    fontFamily: fontFamily.semiBold,
    fontWeight: '600',
    fontSize: 16,
    color: welcomeColors.accent,
  },
  notFound: {
    fontFamily: fontFamily.regular,
    fontWeight: '400',
    fontSize: 13,
    color: welcomeColors.textSecondary,
    textAlign: 'center',
    marginTop: 24,
  },
});
