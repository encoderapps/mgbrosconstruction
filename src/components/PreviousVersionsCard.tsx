import React, { useState } from 'react';
import { ActivityIndicator, LayoutAnimation, Pressable, StyleSheet, Text, View } from 'react-native';
import { ChevronRightIcon, DocumentIcon, DownloadIcon } from '../assets/icons';
import { fontFamily, portalColors, radius, welcomeColors } from '../theme';
import { ComplianceDocumentFile } from '../types/document';
import { formatShortDate } from '../utils/formatDate';
import { formatFileSize } from '../utils/formatFileSize';
import { AuthCard } from './AuthCard';

type FileHandlers = {
  /** The file being opened or saved; every file's buttons wait for it. */
  busyFileId: string | null;
  onOpen: (version: ComplianceDocumentFile) => void;
  onDownload: (version: ComplianceDocumentFile) => void;
};

type PreviousVersionsCardProps = FileHandlers & {
  versions: ComplianceDocumentFile[];
};

/**
 * A document's older copies, newest first, in a card that collapses to its
 * header. Tapping a copy opens its PDF; its download button saves it.
 */
export function PreviousVersionsCard({ versions, ...handlers }: PreviousVersionsCardProps): React.JSX.Element {
  const [isExpanded, setIsExpanded] = useState(true);

  const toggle = (): void => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setIsExpanded((current) => !current);
  };

  return (
    <AuthCard style={styles.card}>
      <Pressable
        onPress={toggle}
        style={styles.header}
        accessibilityRole="button"
        accessibilityState={{ expanded: isExpanded }}
      >
        <Text style={styles.title}>Previous Versions ({versions.length})</Text>
        <View style={isExpanded && styles.chevronExpanded}>
          <ChevronRightIcon size={16} color={welcomeColors.accent} />
        </View>
      </Pressable>

      {isExpanded &&
        versions.map((version) => <VersionRow key={version.id} version={version} {...handlers} />)}
    </AuthCard>
  );
}

type VersionRowProps = FileHandlers & {
  version: ComplianceDocumentFile;
};

function VersionRow({ version, busyFileId, onOpen, onDownload }: VersionRowProps): React.JSX.Element {
  const hasFile = !!version.contentBase64;
  const isBusy = busyFileId === version.id;
  const isDisabled = busyFileId !== null;

  return (
    <Pressable
      onPress={() => onOpen(version)}
      disabled={!hasFile || isDisabled}
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}
      accessibilityRole={hasFile ? 'button' : undefined}
      accessibilityLabel={hasFile ? `Open ${version.fileName}` : undefined}
    >
      <View style={styles.iconWrapper}>
        <DocumentIcon size={20} color={welcomeColors.accent} />
      </View>
      <View style={styles.info}>
        <Text style={styles.fileName}>{version.fileName}</Text>
        {!!version.uploadedOn && (
          <Text style={styles.detail}>
            Uploaded on: <Text style={styles.value}>{formatShortDate(version.uploadedOn)}</Text>
          </Text>
        )}
        {!!version.expirationDate && (
          <Text style={styles.detail}>
            Expires: <Text style={styles.value}>{formatShortDate(version.expirationDate)}</Text>
          </Text>
        )}
        {hasFile ? (
          version.fileSizeBytes !== null && (
            <Text style={styles.detail}>
              File size: <Text style={styles.value}>{formatFileSize(version.fileSizeBytes)}</Text>
            </Text>
          )
        ) : (
          <Text style={styles.detail}>No file attached</Text>
        )}
      </View>
      {hasFile && (
        <Pressable
          onPress={() => onDownload(version)}
          disabled={isDisabled}
          hitSlop={10}
          style={({ pressed }) => [styles.downloadButton, (pressed || (isDisabled && !isBusy)) && styles.pressed]}
          accessibilityRole="button"
          accessibilityLabel={`Download ${version.fileName}`}
          accessibilityState={{ disabled: isDisabled, busy: isBusy }}
        >
          {isBusy ? (
            <ActivityIndicator size="small" color={welcomeColors.accent} />
          ) : (
            <DownloadIcon size={20} color={welcomeColors.accent} />
          )}
        </Pressable>
      )}
    </Pressable>
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
    borderWidth: 1,
    borderColor: welcomeColors.cardBorder,
    borderRadius: radius.sm,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  title: {
    fontFamily: fontFamily.semiBold,
    fontWeight: '600',
    fontSize: 14,
    color: welcomeColors.textPrimary,
  },
  chevronExpanded: {
    transform: [{ rotate: '90deg' }],
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: welcomeColors.cardBorder,
    borderRadius: radius.sm,
    padding: 12,
  },
  iconWrapper: {
    width: 40,
    height: 40,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: welcomeColors.cardBorder,
    backgroundColor: portalColors.unreadBackground,
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: {
    flex: 1,
    gap: 2,
  },
  fileName: {
    fontFamily: fontFamily.semiBold,
    fontWeight: '600',
    fontSize: 13,
    color: welcomeColors.textPrimary,
    marginBottom: 2,
  },
  detail: {
    fontFamily: fontFamily.regular,
    fontWeight: '400',
    fontSize: 12,
    color: welcomeColors.textSecondary,
  },
  value: {
    fontFamily: fontFamily.semiBold,
    fontWeight: '600',
    color: welcomeColors.textPrimary,
  },
  downloadButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.6,
  },
});
