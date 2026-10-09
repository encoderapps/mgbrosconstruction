import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { DownloadIcon, EyeIcon } from '../assets/icons';
import { fontFamily, toneColors, welcomeColors } from '../theme';
import { COMPLIANCE_DOCUMENT_INFO } from '../constants/complianceDocuments';
import { EMPTY_VALUE } from '../constants/display';
import { ComplianceDocumentFile, ComplianceDocumentType } from '../types/document';
import { getDocumentStatus, isInsuranceCertificate } from '../utils/complianceDocument';
import { formatShortDate } from '../utils/formatDate';
import { formatFileSize } from '../utils/formatFileSize';
import { AuthCard } from './AuthCard';
import { DocumentStatusMessage } from './DocumentStatusMessage';
import { DocumentThumbnail } from './DocumentThumbnail';
import { InfoNote } from './InfoNote';

type CurrentDocumentCardProps = {
  type: ComplianceDocumentType;
  /** The copy used for compliance. */
  file: ComplianceDocumentFile;
  /** This file is being opened or saved. */
  isBusy: boolean;
  /** Another file is being opened or saved, so this one waits. */
  isDisabled: boolean;
  onOpen: (file: ComplianceDocumentFile) => void;
  onDownload: (file: ComplianceDocumentFile) => void;
};

function toShortDate(isoDate: string | null): string {
  return isoDate ? formatShortDate(isoDate) : EMPTY_VALUE;
}

/**
 * The copy of a document used for compliance: preview, upload details, its
 * dates and status. An insurance certificate gets a heading with its record
 * ID; a W9 has its title beside the preview instead.
 */
export function CurrentDocumentCard({
  type,
  file,
  isBusy,
  isDisabled,
  onOpen,
  onDownload,
}: CurrentDocumentCardProps): React.JSX.Element {
  const { title } = COMPLIANCE_DOCUMENT_INFO[type];
  const hasFile = !!file.contentBase64;
  const isCertificate = isInsuranceCertificate(type);
  const status = getDocumentStatus(type, file);

  return (
    <AuthCard style={styles.card}>
      {isCertificate && (
        <View style={styles.header}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.referenceId}>ID: {file.recordName}</Text>
        </View>
      )}

      <View style={styles.body}>
        <Pressable
          onPress={() => onOpen(file)}
          disabled={!hasFile || isDisabled}
          style={({ pressed }) => pressed && styles.pressed}
          accessibilityRole={hasFile ? 'button' : undefined}
          accessibilityLabel={hasFile ? `Open ${file.fileName}` : undefined}
        >
          <DocumentThumbnail />
        </Pressable>
        <View style={styles.details}>
          {!isCertificate && <Text style={styles.title}>{title}</Text>}
          <View>
            <Text style={styles.detail}>
              Uploaded on: <Text style={styles.value}>{toShortDate(file.uploadedOn)}</Text>
            </Text>
            {!!file.uploadedBy && (
              <Text style={styles.uploadedBy}>
                by <Text style={!isCertificate && styles.value}>{file.uploadedBy}</Text>
              </Text>
            )}
          </View>
          {isCertificate ? (
            <>
              <Text style={styles.detail}>
                Effective: <Text style={styles.value}>{toShortDate(file.effectiveDate)}</Text>
              </Text>
              <Text style={[styles.expires, { color: toneColors[status.tone].foreground }]}>
                Expires: {toShortDate(file.expirationDate)}
              </Text>
            </>
          ) : (
            <Text style={styles.detail}>
              Signed on: <Text style={styles.value}>{toShortDate(file.signedDate)}</Text>
            </Text>
          )}
          <Text style={styles.fileSize}>
            {hasFile
              ? `File size: ${file.fileSizeBytes === null ? EMPTY_VALUE : formatFileSize(file.fileSizeBytes)}`
              : 'No file attached'}
          </Text>
          {hasFile && (
            <View style={styles.fileActions}>
              <Pressable
                onPress={() => onOpen(file)}
                disabled={isDisabled}
                hitSlop={6}
                style={({ pressed }) => [styles.fileAction, (pressed || isDisabled) && styles.pressed]}
                accessibilityRole="button"
                accessibilityLabel={`View ${file.fileName}`}
              >
                <EyeIcon width={16} height={11} color={welcomeColors.link} visible />
                <Text style={styles.fileActionText}>View</Text>
              </Pressable>
              <Pressable
                onPress={() => onDownload(file)}
                disabled={isDisabled}
                hitSlop={6}
                style={({ pressed }) => [styles.fileAction, (pressed || isDisabled) && styles.pressed]}
                accessibilityRole="button"
                accessibilityLabel={`Download ${file.fileName}`}
                accessibilityState={{ disabled: isDisabled, busy: isBusy }}
              >
                {isBusy ? (
                  <ActivityIndicator size="small" color={welcomeColors.link} />
                ) : (
                  <DownloadIcon size={14} color={welcomeColors.link} />
                )}
                <Text style={styles.fileActionText}>Download</Text>
              </Pressable>
            </View>
          )}
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
  fileActions: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 2,
  },
  fileAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  fileActionText: {
    fontFamily: fontFamily.semiBold,
    fontWeight: '600',
    fontSize: 12,
    color: welcomeColors.link,
  },
  pressed: {
    opacity: 0.6,
  },
  // A W9's status sits under a divider, as there's no heading above the preview.
  divided: {
    borderTopWidth: 1,
    borderTopColor: welcomeColors.cardBorder,
    paddingTop: 12,
  },
});
