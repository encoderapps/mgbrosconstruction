import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { LocationIcon, MailIcon, PhoneIcon } from '../assets/icons';
import { fontFamily, welcomeColors } from '../theme';
import { EMPTY_VALUE } from '../constants/display';
import { useSubcontractorSession } from '../context/SubcontractorSessionContext';
import { formatPhoneNumber } from '../utils/formatPhoneNumber';
import { AuthCard } from './AuthCard';

/** The logged-in company's name, address, email and phone, at the top of the Home and Documents screens. */
export function CompanyCard(): React.JSX.Element {
  const { company } = useSubcontractorSession();

  return (
    <AuthCard style={styles.card}>
      <Text style={styles.name}>{company?.name || EMPTY_VALUE}</Text>

      <View style={styles.infoRow}>
        <View style={styles.infoColumn}>
          <View style={styles.infoLine}>
            <LocationIcon size={14} color={welcomeColors.link} />
            <Text style={styles.infoText}>{company?.address || EMPTY_VALUE}</Text>
          </View>
        </View>

        <View style={styles.infoColumn}>
          <View style={styles.infoLine}>
            <MailIcon size={13} color={welcomeColors.link} />
            <Text style={styles.infoText}>{company?.email || EMPTY_VALUE}</Text>
          </View>
          <View style={styles.infoLine}>
            <PhoneIcon size={13} color={welcomeColors.link} />
            <Text style={styles.infoText}>{company?.phone ? formatPhoneNumber(company.phone) : EMPTY_VALUE}</Text>
          </View>
        </View>
      </View>
    </AuthCard>
  );
}

const styles = StyleSheet.create({
  card: {
    alignItems: 'stretch',
  },
  name: {
    fontFamily: fontFamily.bold,
    fontWeight: '700',
    fontSize: 16,
    color: welcomeColors.textPrimary,
    textAlign: 'center',
    marginBottom: 10,
  },
  infoRow: {
    flexDirection: 'row',
    gap: 12,
  },
  infoColumn: {
    flex: 1,
    gap: 6,
  },
  infoLine: {
    flexDirection: 'row',
    gap: 6,
  },
  infoText: {
    flex: 1,
    fontFamily: fontFamily.regular,
    fontWeight: '400',
    fontSize: 11,
    lineHeight: 16,
    color: welcomeColors.link,
  },
});
