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

type Props = NativeStackScreenProps<AuthStackParamList, 'CompanyDetails'>;

const TOTAL_STEPS = 6;
const EMPLOYEE_COUNT_OPTIONS = ['1-5', '6-10', '11-25', '26-50', '51-100', '100+'];

export function CompanyDetailsScreen(_props: Props): React.JSX.Element {
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
      { value: service, title: 'Missing service', message: 'Please enter the service you provide.' },
      {
        value: yearsOfExperience,
        title: 'Missing years of experience',
        message: 'Please enter your years of experience.',
      },
      {
        value: numberOfEmployees,
        title: 'Missing number of employees',
        message: 'Please select your number of employees.',
      },
    ]);
    if (missingField) {
      Alert.alert(missingField.title, missingField.message);
      return;
    }

    // TODO: navigate to the next registration step once it exists
    console.log('TODO: navigate to next registration step');
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

        <LoginInput
          label="Service"
          placeholder="Enter service"
          value={service}
          onChangeText={setService}
          autoCapitalize="words"
        />

        <LoginInput
          label="Years of Experience"
          placeholder="Enter years of experience"
          value={yearsOfExperience}
          onChangeText={setYearsOfExperience}
          keyboardType="numeric"
        />

        <SelectInput
          label="Number of Employees"
          placeholder="Enter number of employees"
          value={numberOfEmployees}
          options={EMPLOYEE_COUNT_OPTIONS}
          onSelect={setNumberOfEmployees}
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
