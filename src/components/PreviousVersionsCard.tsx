import React, { useState } from 'react';
import { LayoutAnimation, Pressable, StyleSheet, Text, View } from 'react-native';
import { ChevronRightIcon, DocumentIcon, MoreVerticalIcon } from '../assets/icons';
import { fontFamily, portalColors, radius, welcomeColors } from '../theme';
import { ComplianceDocumentFile } from '../types/document';
import { formatShortDate } from '../utils/formatDate';
import { AuthCard } from './AuthCard';

type PreviousVersionsCardProps = {
  versions: ComplianceDocumentFile[];
  onVersionMenuPress: (version: ComplianceDocumentFile) => void;
};

/** A document's older copies, newest first, in a card that collapses to its header. */
export function PreviousVersionsCard({ versions, onVersionMenuPress }: PreviousVersionsCardProps): React.JSX.Element {
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
        versions.map((version) => (
          <VersionRow key={version.id} version={version} onMenuPress={onVersionMenuPress} />
        ))}
    </AuthCard>
  );
}

type VersionRowProps = {
  version: ComplianceDocumentFile;
  onMenuPress: (version: ComplianceDocumentFile) => void;
};

function VersionRow({ version, onMenuPress }: VersionRowProps): React.JSX.Element {
  return (
    <View style={styles.row}>
      <View style={styles.iconWrapper}>
        <DocumentIcon size={20} color={welcomeColors.accent} />
      </View>
      <View style={styles.info}>
        <Text style={styles.fileName}>{version.fileName}</Text>
        <Text style={styles.detail}>
          Uploaded on: <Text style={styles.value}>{formatShortDate(version.uploadedOn)}</Text>
        </Text>
        {!!version.expirationDate && (
          <Text style={styles.detail}>
            Expires: <Text style={styles.value}>{formatShortDate(version.expirationDate)}</Text>
          </Text>
        )}
        <Text style={styles.detail}>
          File size: <Text style={styles.value}>{version.fileSizeKb} KB</Text>
        </Text>
      </View>
      <Pressable
        onPress={() => onMenuPress(version)}
        hitSlop={10}
        style={({ pressed }) => pressed && styles.pressed}
        accessibilityRole="button"
        accessibilityLabel={`More options for ${version.fileName}`}
      >
        <MoreVerticalIcon size={20} color={welcomeColors.textSecondary} />
      </Pressable>
    </View>
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
  pressed: {
    opacity: 0.6,
  },
});
