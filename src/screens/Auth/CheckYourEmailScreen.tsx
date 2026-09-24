import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AuthCard } from '../../components/AuthCard';
import { AuthCardHeader } from '../../components/AuthCardHeader';
import { AuthHeader } from '../../components/AuthHeader';
import { AuthPrimaryButton } from '../../components/AuthPrimaryButton';
import { AuthScreenLayout } from '../../components/AuthScreenLayout';
import { MailIcon } from '../../assets/icons';
import { fontFamily, radius, welcomeColors } from '../../theme';
import { AuthStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<AuthStackParamList, 'CheckYourEmail'>;

export function CheckYourEmailScreen({ navigation }: Props): React.JSX.Element {
  const handleReturnToLogin = (): void => {
    // Unwind back to the existing login screen instead of stacking a new one.
    navigation.popTo('SubcontractorLogin');
  };

  return (
    <AuthScreenLayout>
      <AuthHeader />

      <AuthCard>
        <AuthCardHeader
          icon={<MailIcon size={16} color={welcomeColors.accent} />}
          title="Check Your Email"
          subtitle="Password reset instructions sent."
        />

        <View style={styles.messageBox}>
          <Text style={styles.messageText}>
            We've sent you an email with a link to finish resetting your password.
          </Text>
        </View>

        <AuthPrimaryButton title="Return to Login" onPress={handleReturnToLogin} />
      </AuthCard>
    </AuthScreenLayout>
  );
}

const styles = StyleSheet.create({
  messageBox: {
    backgroundColor: '#F8F5F2',
    borderWidth: 1,
    borderColor: welcomeColors.cardBorder,
    borderRadius: radius.md,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  messageText: {
    fontFamily: fontFamily.regular,
    fontWeight: '400',
    fontSize: 12,
    lineHeight: 20,
    color: welcomeColors.textSecondary,
    textAlign: 'center',
  },
});
