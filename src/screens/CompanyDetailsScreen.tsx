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
import { MultiSelectInput } from '../components/MultiSelectInput';
import { RegistrationProgress } from '../components/RegistrationProgress';
import { BriefcaseIcon } from '../assets/icons';
import { welcomeColors } from '../theme';
import { AuthStackParamList } from '../navigation/types';
import { findMissingRequiredField } from '../utils/formValidation';
import { isValidZipCode } from '../utils/address';
import { US_STATE_CODES, formatUsStateOption } from '../constants/usStates';
import { SERVICE_OPTIONS } from '../constants/serviceOptions';

type Props = NativeStackScreenProps<AuthStackParamList, 'CompanyDetails'>;

const TOTAL_STEPS = 6;

export function CompanyDetailsScreen({ navigation, route }: Props): React.JSX.Element {
  const [company, setCompany] = useState('');
  const [companyStreetAddress, setCompanyStreetAddress] = useState('');
  const [companyCity, setCompanyCity] = useState('');
  const [companyState, setCompanyState] = useState('');
  const [companyZipCode, setCompanyZipCode] = useState('');
  const [services, setServices] = useState<string[]>([]);
  const [yearsOfExperience, setYearsOfExperience] = useState('');
  const [numberOfEmployees, setNumberOfEmployees] = useState('');

  const handleContinue = (): void => {
    if (!company.trim()) {
      Alert.alert('Missing company name', 'Please enter your company name.');
      return;
    }

    const missingAddressField = findMissingRequiredField([
      {
        value: companyStreetAddress,
        title: 'Missing company street address',
        message: 'Please enter your company street address.',
      },
      { value: companyCity, title: 'Missing city', message: 'Please enter the city.' },
      { value: companyState, title: 'Missing state', message: 'Please select the state.' },
      { value: companyZipCode, title: 'Missing zip code', message: 'Please enter the zip code.' },
    ]);
    if (missingAddressField) {
      Alert.alert(missingAddressField.title, missingAddressField.message);
      return;
    }
    if (!isValidZipCode(companyZipCode)) {
      Alert.alert('Invalid zip code', 'Please enter a valid 5-digit zip code.');
      return;
    }

    const missingField = findMissingRequiredField([
      { value: services.join(', '), title: 'Missing service', message: 'Please select at least one service.' },
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
        companyStreetAddress: companyStreetAddress.trim(),
        companyCity: companyCity.trim(),
        companyState,
        companyZipCode: companyZipCode.trim(),
        service: services,
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
          label="Company Street Address"
          placeholder="Enter company street address"
          value={companyStreetAddress}
          onChangeText={setCompanyStreetAddress}
          autoCapitalize="words"
        />

        <LoginInput
          label="City"
          placeholder="Enter city"
          value={companyCity}
          onChangeText={setCompanyCity}
          autoCapitalize="words"
        />

        <SelectInput
          label="State"
          placeholder="Select state"
          value={companyState}
          options={US_STATE_CODES}
          formatOption={formatUsStateOption}
          onSelect={setCompanyState}
        />

        <LoginInput
          label="Zip Code"
          placeholder="Enter zip code"
          value={companyZipCode}
          onChangeText={(text) => setCompanyZipCode(text.replace(/\D/g, ''))}
          keyboardType="number-pad"
          maxLength={5}
        />

        <MultiSelectInput
          label="Service"
          placeholder="Select services"
          values={services}
          options={SERVICE_OPTIONS}
          onChange={setServices}
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
