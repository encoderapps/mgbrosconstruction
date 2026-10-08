import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { fontFamily, welcomeColors } from '../theme';
import { BidDetail } from '../types/bid';
import { bidStatusTone } from '../utils/bidStatus';
import { formatShortDate } from '../utils/formatDate';
import { AuthCard } from './AuthCard';
import { StatusPill } from './StatusPill';

type FieldProps = {
  label: string;
  children: React.ReactNode;
};

/** A small grey label over its value, one half of a row. */
function Field({ label, children }: FieldProps): React.JSX.Element {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      {children}
    </View>
  );
}

/** The top of Bid Details: bid number and date, then the project and the bid's status. */
export function BidOverviewCard({ bid }: { bid: BidDetail }): React.JSX.Element {
  return (
    <AuthCard style={styles.card}>
      <View style={styles.row}>
        <Field label="Bid Number">
          <Text style={styles.primaryValue}>{bid.bidNumber}</Text>
        </Field>
        <Field label="Bid Date">
          <Text style={styles.value}>{formatShortDate(bid.bidDate)}</Text>
        </Field>
      </View>

      <View style={[styles.row, styles.divided]}>
        <Field label="Project">
          <Text style={styles.primaryValue}>{bid.projectNumber}</Text>
          <Text style={styles.secondaryValue}>{bid.projectName}</Text>
        </Field>
        <Field label="Status">
          <View style={styles.pill}>
            <StatusPill label={bid.status} tone={bidStatusTone(bid.status)} />
          </View>
        </Field>
      </View>
    </AuthCard>
  );
}

const styles = StyleSheet.create({
  card: {
    paddingVertical: 12,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  divided: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: welcomeColors.cardBorder,
  },
  field: {
    flex: 1,
    gap: 2,
  },
  label: {
    fontFamily: fontFamily.regular,
    fontWeight: '400',
    fontSize: 11,
    color: welcomeColors.textSecondary,
  },
  primaryValue: {
    fontFamily: fontFamily.bold,
    fontWeight: '700',
    fontSize: 16,
    color: welcomeColors.textPrimary,
  },
  value: {
    fontFamily: fontFamily.medium,
    fontWeight: '500',
    fontSize: 13,
    color: welcomeColors.textPrimary,
  },
  secondaryValue: {
    fontFamily: fontFamily.regular,
    fontWeight: '400',
    fontSize: 11,
    color: welcomeColors.textSecondary,
  },
  pill: {
    alignItems: 'flex-start',
    marginTop: 2,
  },
});
