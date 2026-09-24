import React, { useState } from 'react';
import { Alert, StyleSheet } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AuthCard } from '../components/AuthCard';
import { AuthCardHeader } from '../components/AuthCardHeader';
import { AuthHeader } from '../components/AuthHeader';
import { AuthPrimaryButton } from '../components/AuthPrimaryButton';
import { AuthScreenLayout } from '../components/AuthScreenLayout';
import { LoginInput } from '../components/LoginInput';
import { SelectInput } from '../components/SelectInput';
import { RegistrationProgress } from '../components/RegistrationProgress';
import { BriefcaseIcon } from '../assets/icons';
import { welcomeColors } from '../theme';
import { AuthStackParamList } from '../navigation/types';
import { findMissingRequiredField } from '../utils/formValidation';
import { SERVICE_OPTIONS } from '../constants/serviceOptions';

type Props = NativeStackScreenProps<AuthStackParamList, 'CompanyDetails'>;

const TOTAL_STEPS = 6;

export function CompanyDetailsScreen({ navigation, route }: Props): React.JSX.Element {
  const [company, setCompany] = useState('');
  const [companyAddress, setCompanyAddress] = useState('');
  const [service, setService] = useState('');
  const [yearsOfExperience, setYearsOfExperience] = useState('');
  const [numberOfEmployees, setNumberOfEmployees] = useState('');

  const handleContinue = (): void => {
    const missingField = findMissingRequiredField([
      { value: company, title: 'Missing company name', message: 'Please enter your company name.' },
      {
        value: companyAddress,
        title: 'Missing company address',
        message: 'Please enter your company address.',
      },
      { value: service, title: 'Missing service', message: 'Please select the service you provide.' },
      {
        value: yearsOfExperience,
        title: 'Missing years of experience',
        message: 'Please enter your years of experience.',
      },
      {
        value: numberOfEmployees,
        title: 'Missing number of employees',
        message: 'Please enter your number of employees.',
      },
    ]);
    if (missingField) {
      Alert.alert(missingField.title, missingField.message);
      return;
    }

    navigation.navigate('W9', {
      identity: route.params.identity,
      company: {
        company: company.trim(),
        companyAddress: companyAddress.trim(),
        service,
        yearsOfExperience: yearsOfExperience.trim(),
        numberOfEmployees,
      },
    });
  };

  return (
    <AuthScreenLayout withKeyboardAvoiding>
      <AuthHeader />

      <RegistrationProgress totalSteps={TOTAL_STEPS} currentStep={2} />

      <AuthCard>
        <AuthCardHeader
          icon={<BriefcaseIcon size={18} color={welcomeColors.accent} />}
          title="Company Details"
          subtitle="Fill in your company details."
        />

        <LoginInput
          label="Company"
          placeholder="Enter company"
          value={company}
          onChangeText={setCompany}
          autoCapitalize="words"
        />

        <LoginInput
          label="Company Address"
          placeholder="Enter company address"
          value={companyAddress}
          onChangeText={setCompanyAddress}
          autoCapitalize="words"
        />

        <SelectInput
          label="Service"
          placeholder="Select service"
          value={service}
          options={SERVICE_OPTIONS}
          onSelect={setService}
        />

        <LoginInput
          label="Years of Experience"
          placeholder="Enter years of experience"
          value={yearsOfExperience}
          onChangeText={setYearsOfExperience}
          keyboardType="numeric"
        />

        <LoginInput
          label="Number of Employees"
          placeholder="Enter number of employees"
          value={numberOfEmployees}
          onChangeText={setNumberOfEmployees}
          keyboardType="numeric"
        />

        <AuthPrimaryButton title="Continue" onPress={handleContinue} style={styles.continueButton} />
      </AuthCard>
    </AuthScreenLayout>
  );
}

const styles = StyleSheet.create({
  continueButton: {
    marginTop: 4,
  },
});
