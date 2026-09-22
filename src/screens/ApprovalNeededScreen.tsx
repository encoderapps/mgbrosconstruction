import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AuthCard } from '../components/AuthCard';
import { AuthCardHeader } from '../components/AuthCardHeader';
import { AuthHeader } from '../components/AuthHeader';
import { AuthPrimaryButton } from '../components/AuthPrimaryButton';
import { AuthScreenLayout } from '../components/AuthScreenLayout';
import { AlertCircleIcon } from '../assets/icons';
import { colors, fontFamily, radius } from '../theme';
import { AuthStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<AuthStackParamList, 'ApprovalNeeded'>;

export function ApprovalNeededScreen({ navigation }: Props): React.JSX.Element {
  const handleReturnToLogin = (): void => {
    navigation.navigate('SubcontractorLogin');
  };

  return (
    <AuthScreenLayout>
      <AuthHeader />

      <AuthCard>
        <AuthCardHeader
          icon={<AlertCircleIcon size={18} color={colors.warning} />}
          title="Approval Needed"
          subtitle="Your account is pending review."
          iconBackgroundColor="rgba(245, 166, 35, 0.12)"
        />

        <View style={styles.noticeBox}>
          <Text style={styles.noticeText}>
            Your request is pending approval. Once it will be approved you will receive an email
            confirmation.
          </Text>
        </View>

        <AuthPrimaryButton title="Return to Login" onPress={handleReturnToLogin} />
      </AuthCard>
    </AuthScreenLayout>
  );
}

const styles = StyleSheet.create({
  noticeBox: {
    backgroundColor: 'rgba(245, 166, 35, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(245, 166, 35, 0.3)',
    borderRadius: radius.md,
    padding: 12,
    marginBottom: 16,
  },
  noticeText: {
    fontFamily: fontFamily.regular,
    fontWeight: '400',
    fontSize: 12,
    lineHeight: 17,
    color: colors.warning,
    textAlign: 'center',
  },
});
