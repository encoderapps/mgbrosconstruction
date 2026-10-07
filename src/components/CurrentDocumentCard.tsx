import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { fontFamily, toneColors, welcomeColors } from '../theme';
import { COMPLIANCE_DOCUMENT_INFO } from '../constants/complianceDocuments';
import { ComplianceDocument } from '../types/document';
import { getDocumentStatus, isInsuranceCertificate } from '../utils/complianceDocument';
import { formatShortDate } from '../utils/formatDate';
import { AuthCard } from './AuthCard';
import { DocumentStatusMessage } from './DocumentStatusMessage';
import { DocumentThumbnail } from './DocumentThumbnail';
import { InfoNote } from './InfoNote';

/**
 * The copy of a document used for compliance: preview, upload details, the
 * effective/expiry dates and its status. An insurance certificate gets a
 * heading with its ID; a W9 has its title beside the preview instead.
 */
export function CurrentDocumentCard({ document }: { document: ComplianceDocument }): React.JSX.Element {
  const { current } = document;
  const { title } = COMPLIANCE_DOCUMENT_INFO[document.type];
  const isCertificate = isInsuranceCertificate(document);
  const status = getDocumentStatus(document);

  return (
    <AuthCard style={styles.card}>
      {isCertificate && (
        <View style={styles.header}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.referenceId}>ID: {document.referenceId}</Text>
        </View>
      )}

      <View style={styles.body}>
        <DocumentThumbnail />
        <View style={styles.details}>
          {!isCertificate && <Text style={styles.title}>{title}</Text>}
          <View>
            <Text style={styles.detail}>
              Uploaded on: <Text style={styles.value}>{formatShortDate(current.uploadedOn)}</Text>
            </Text>
            {!!current.uploadedBy && (
              <Text style={styles.uploadedBy}>
                by <Text style={!isCertificate && styles.value}>{current.uploadedBy}</Text>
              </Text>
            )}
          </View>
          {isCertificate ? (
            <>
              <Text style={styles.detail}>
                Effective: <Text style={styles.value}>{formatShortDate(document.effectiveDate)}</Text>
              </Text>
              <Text style={[styles.expires, { color: toneColors[status.tone].foreground }]}>
                Expires: {formatShortDate(document.expirationDate)}
              </Text>
            </>
          ) : (
            <Text style={styles.detail}>
              Effective from: <Text style={styles.value}>{formatShortDate(document.signedDate)}</Text>
            </Text>
          )}
          <Text style={styles.fileSize}>File size: {current.fileSizeKb} KB</Text>
        </View>
      </View>

      <View style={!isCertificate && styles.divided}>
        <DocumentStatusMessage status={status} />
      </View>

      <InfoNote>
        Only the most recent {isCertificate ? 'certificate' : 'document'} is used for compliance and records.
      </InfoNote>
    </AuthCard>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: 14,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  title: {
    fontFamily: fontFamily.semiBold,
    fontWeight: '600',
    fontSize: 17,
    color: welcomeColors.textPrimary,
  },
  referenceId: {
    fontFamily: fontFamily.regular,
    fontWeight: '400',
    fontSize: 13,
    color: welcomeColors.textSecondary,
  },
  body: {
    flexDirection: 'row',
    gap: 14,
  },
  details: {
    flex: 1,
    gap: 6,
  },
  detail: {
    fontFamily: fontFamily.regular,
    fontWeight: '400',
    fontSize: 13,
    lineHeight: 19,
    color: welcomeColors.textSecondary,
  },
  value: {
    fontFamily: fontFamily.semiBold,
    fontWeight: '600',
    color: welcomeColors.textPrimary,
  },
  uploadedBy: {
    fontFamily: fontFamily.regular,
    fontWeight: '400',
    fontSize: 11,
    color: welcomeColors.textSecondary,
  },
  expires: {
    fontFamily: fontFamily.semiBold,
    fontWeight: '600',
    fontSize: 13,
  },
  fileSize: {
    fontFamily: fontFamily.regular,
    fontWeight: '400',
    fontSize: 12,
    color: welcomeColors.textSecondary,
  },
  // A W9's status sits under a divider, as there's no heading above the preview.
  divided: {
    borderTopWidth: 1,
    borderTopColor: welcomeColors.cardBorder,
    paddingTop: 12,
  },
});
