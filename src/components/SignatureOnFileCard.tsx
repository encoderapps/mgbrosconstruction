import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { fontFamily, radius, welcomeColors } from '../theme';
import { formatLongDate } from '../utils/formatDate';

type SignatureOnFileCardProps = {
  /** The signer's full name. */
  name: string;
  /** The signature image, as a base64 PNG. */
  imageBase64: string;
  /** YYYY-MM-DD. */
  date: string;
};

/** A signature the API has on file: the signature image, then the signer's full name and the date. */
export function SignatureOnFileCard({ name, imageBase64, date }: SignatureOnFileCardProps): React.JSX.Element {
  return (
    <View style={styles.card}>
      <Image
        source={{ uri: `data:image/png;base64,${imageBase64}` }}
        style={styles.image}
        resizeMode="contain"
        accessibilityLabel={`Signature of ${name}`}
      />
      <View style={styles.details}>
        <Text style={styles.name}>{name}</Text>
        <Text style={styles.date}>Date: {formatLongDate(date)}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderColor: welcomeColors.cardBorder,
    borderRadius: radius.md,
    backgroundColor: welcomeColors.cardBackground,
    padding: 12,
    gap: 8,
  },
  image: {
    width: '100%',
    height: 80,
  },
  details: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: welcomeColors.cardBorder,
    paddingTop: 8,
    gap: 12,
  },
  name: {
    flex: 1,
    fontFamily: fontFamily.semiBold,
    fontWeight: '600',
    fontSize: 13,
    color: welcomeColors.textPrimary,
  },
  date: {
    fontFamily: fontFamily.regular,
    fontWeight: '400',
    fontSize: 12,
    color: welcomeColors.textSecondary,
  },
});
