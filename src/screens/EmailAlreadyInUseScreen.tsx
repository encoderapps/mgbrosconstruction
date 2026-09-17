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

type Props = NativeStackScreenProps<AuthStackParamList, 'EmailAlreadyInUse'>;

export function EmailAlreadyInUseScreen({ navigation }: Props): React.JSX.Element {
  const handleReturnToLogin = (): void => {
    navigation.navigate('SubcontractorLogin');
  };

  return (
    <AuthScreenLayout>
      <AuthHeader />

      <AuthCard>
        <AuthCardHeader
          icon={<AlertCircleIcon size={18} color={colors.error} />}
          title="Email Already in Use"
          subtitle="This account already exists."
          iconBackgroundColor="rgba(229, 72, 77, 0.12)"
        />

        <View style={styles.errorBox}>
          <Text style={styles.errorText}>
            An account with this email already exists. Please sign in instead.
          </Text>
        </View>

        <AuthPrimaryButton title="Return to Login" onPress={handleReturnToLogin} />
      </AuthCard>
    </AuthScreenLayout>
  );
}

const styles = StyleSheet.create({
  errorBox: {
    backgroundColor: 'rgba(229, 72, 77, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(229, 72, 77, 0.3)',
    borderRadius: radius.md,
    padding: 12,
    marginBottom: 16,
  },
  errorText: {
    fontFamily: fontFamily.regular,
    fontWeight: '400',
    fontSize: 12,
    lineHeight: 17,
    color: colors.error,
    textAlign: 'center',
  },
});
