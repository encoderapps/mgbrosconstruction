import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { DocumentIcon, PlusIcon, ShieldIcon } from '../assets/icons';
import { fontFamily, portalColors, radius, welcomeColors } from '../theme';
import { COMPLIANCE_DOCUMENT_INFO } from '../constants/complianceDocuments';
import { ComplianceDocument, ComplianceDocumentFile } from '../types/document';
import { getDocumentSummary, isInsuranceCertificate } from '../utils/complianceDocument';

type ComplianceDocumentSectionProps = {
  document: ComplianceDocument;
  /** Draws a divider above the section (all but the first). */
  showDivider: boolean;
  onOpen: (document: ComplianceDocument) => void;
  /** Saves the latest file onto the device. */
  onDownload: (file: ComplianceDocumentFile) => void;
  /** The file being saved, if any (one at a time across the list). */
  busyFileId: string | null;
  /** Left out while adding isn't available yet: the + is shown dimmed and can't be tapped. */
  onAdd?: (document: ComplianceDocument) => void;
};

/**
 * One document in the Documents list: its name, key facts and latest file.
 * The name and facts open the document's own screen (to view or download any
 * version); the file link downloads the latest file straight away.
 */
export function ComplianceDocumentSection({
  document,
  showDivider,
  onOpen,
  onDownload,
  busyFileId,
  onAdd,
}: ComplianceDocumentSectionProps): React.JSX.Element {
  const { label } = COMPLIANCE_DOCUMENT_INFO[document.type];
  const Icon = isInsuranceCertificate(document.type) ? ShieldIcon : DocumentIcon;
  // Only the latest: the current copy, else the newest previous version.
  const latestFile = document.current ?? document.previousVersions[0] ?? null;
  const isBusy = !!latestFile && busyFileId === latestFile.id;
  const summary = getDocumentSummary(document.type, document.current);
  const open = (): void => onOpen(document);

  return (
    <View style={[styles.section, showDivider && styles.divider]}>
      <View style={styles.header}>
        <Pressable
          onPress={open}
          hitSlop={4}
          style={({ pressed }) => [styles.titleButton, pressed && styles.pressed]}
          accessibilityRole="button"
          accessibilityLabel={`Open ${label}`}
        >
          <View style={styles.iconWrapper}>
            <Icon size={16} color={welcomeColors.accent} />
          </View>
          <Text style={styles.title}>{label}</Text>
        </Pressable>
        <Pressable
          onPress={onAdd && (() => onAdd(document))}
          disabled={!onAdd}
          hitSlop={8}
          style={({ pressed }) => [styles.addButton, pressed && styles.pressed, !onAdd && styles.disabled]}
          accessibilityRole="button"
          accessibilityLabel={`Add ${label}`}
          accessibilityState={{ disabled: !onAdd }}
        >
          <PlusIcon size={14} />
        </Pressable>
      </View>

      <Pressable
        onPress={open}
        style={({ pressed }) => [styles.summary, pressed && styles.pressed]}
        accessibilityRole="button"
        accessibilityHint={`Opens ${label}`}
      >
        {summary.length > 0 ? (
          summary.map((row) => (
            <Text key={row.label} style={styles.summaryText}>
              <Text style={styles.summaryLabel}>{row.label}: </Text>
              {row.value}
            </Text>
          ))
        ) : (
          <Text style={styles.summaryText}>No {label} on file.</Text>
        )}
      </Pressable>

      {latestFile && (
        <Pressable
          onPress={() => onDownload(latestFile)}
          disabled={busyFileId !== null}
          hitSlop={4}
          style={({ pressed }) => [styles.fileLink, pressed && styles.pressed]}
          accessibilityRole="button"
          accessibilityLabel={`Download ${latestFile.fileName}`}
          accessibilityState={{ disabled: busyFileId !== null, busy: isBusy }}
        >
          {isBusy ? (
            <ActivityIndicator size="small" color={welcomeColors.link} />
          ) : (
            <DocumentIcon size={14} color={welcomeColors.link} />
          )}
          <Text style={styles.fileLinkText} numberOfLines={1}>
            {latestFile.fileName}
          </Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 10,
  },
  divider: {
    borderTopWidth: 1,
    borderTopColor: welcomeColors.cardBorder,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  titleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconWrapper: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: welcomeColors.iconWrapperBackground,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontFamily: fontFamily.semiBold,
    fontWeight: '600',
    fontSize: 14,
    color: welcomeColors.textPrimary,
  },
  addButton: {
    width: 24,
    height: 24,
    borderRadius: radius.pill,
    backgroundColor: welcomeColors.chevron,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summary: {
    backgroundColor: portalColors.unreadBackground,
    borderWidth: 1,
    borderColor: welcomeColors.cardBorder,
    borderRadius: radius.sm,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 6,
  },
  summaryText: {
    fontFamily: fontFamily.regular,
    fontWeight: '400',
    fontSize: 11,
    lineHeight: 16,
    color: welcomeColors.textPrimary,
  },
  summaryLabel: {
    fontFamily: fontFamily.semiBold,
    fontWeight: '600',
  },
  fileLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  fileLinkText: {
    flex: 1,
    fontFamily: fontFamily.regular,
    fontWeight: '400',
    fontSize: 11,
    color: welcomeColors.link,
  },
  pressed: {
    opacity: 0.7,
  },
  disabled: {
    opacity: 0.45,
  },
});
