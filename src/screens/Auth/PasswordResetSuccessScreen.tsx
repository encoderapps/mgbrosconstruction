import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AuthCard } from '../../components/AuthCard';
import { AuthCardHeader } from '../../components/AuthCardHeader';
import { AuthHeader } from '../../components/AuthHeader';
import { AuthPrimaryButton } from '../../components/AuthPrimaryButton';
import { AuthScreenLayout } from '../../components/AuthScreenLayout';
import { CheckCircleIcon } from '../../assets/icons';
import { fontFamily, radius, welcomeColors } from '../../theme';
import { AuthStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<AuthStackParamList, 'PasswordResetSuccess'>;

export function PasswordResetSuccessScreen({ navigation }: Props): React.JSX.Element {
  const handleReturnToLogin = (): void => {
    navigation.popTo('SubcontractorLogin');
  };

  return (
    <AuthScreenLayout>
      <AuthHeader />

      <AuthCard>
        <AuthCardHeader
          icon={<CheckCircleIcon size={18} />}
          iconBackgroundColor="rgba(46, 125, 50, 0.12)"
          title="Password Reset Successful"
          subtitle="Your password has been changed."
        />

        <View style={styles.successBox}>
          <Text style={styles.successText}>
            Your password has been successfully changed. Please return to the Login Page.
          </Text>
        </View>

        <AuthPrimaryButton title="Return to Login" onPress={handleReturnToLogin} />
      </AuthCard>
    </AuthScreenLayout>
  );
}

const styles = StyleSheet.create({
  successBox: {
    backgroundColor: 'rgba(46, 125, 50, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(46, 125, 50, 0.3)',
    borderRadius: radius.md,
    padding: 14,
    marginBottom: 16,
  },
  successText: {
    fontFamily: fontFamily.regular,
    fontWeight: '400',
    fontSize: 12,
    lineHeight: 18,
    color: welcomeColors.registerGreen,
    textAlign: 'center',
  },
});
