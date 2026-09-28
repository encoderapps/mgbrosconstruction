import React, { useState } from 'react';
import { Alert, StyleSheet } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AuthCard } from '../components/AuthCard';
import { AuthCardHeader } from '../components/AuthCardHeader';
import { AuthHeader } from '../components/AuthHeader';
import { AuthPrimaryButton } from '../components/AuthPrimaryButton';
import { AuthScreenLayout } from '../components/AuthScreenLayout';
import { LoginInput } from '../components/LoginInput';
import { AddressInput } from '../components/AddressInput';
import { MultiSelectInput } from '../components/MultiSelectInput';
import { RegistrationProgress } from '../components/RegistrationProgress';
import { BriefcaseIcon } from '../assets/icons';
import { welcomeColors } from '../theme';
import { Address, AuthStackParamList } from '../navigation/types';
import { findMissingRequiredField } from '../utils/formValidation';
import { isValidPincode } from '../utils/address';
import { SERVICE_OPTIONS } from '../constants/serviceOptions';

type Props = NativeStackScreenProps<AuthStackParamList, 'CompanyDetails'>;

const TOTAL_STEPS = 6;
const EMPTY_ADDRESS: Address = { address1: '', address2: '', city: '', state: '', country: '', pincode: '' };

export function CompanyDetailsScreen({ navigation, route }: Props): React.JSX.Element {
  const [company, setCompany] = useState('');
  const [companyAddress, setCompanyAddress] = useState<Address>(EMPTY_ADDRESS);
  const [isAddressExpanded, setIsAddressExpanded] = useState(false);
  const [services, setServices] = useState<string[]>([]);
  const [yearsOfExperience, setYearsOfExperience] = useState('');
  const [numberOfEmployees, setNumberOfEmployees] = useState('');

  const handleAddressChange = (field: keyof Address, value: string): void => {
    setCompanyAddress((current) => ({ ...current, [field]: value }));
  };

  const handleContinue = (): void => {
    if (!company.trim()) {
      Alert.alert('Missing company name', 'Please enter your company name.');
      return;
    }

    const missingAddressField = findMissingRequiredField([
      { value: companyAddress.address1, title: 'Missing address', message: 'Please enter address 1.' },
      { value: companyAddress.city, title: 'Missing city', message: 'Please enter the city.' },
      { value: companyAddress.state, title: 'Missing state', message: 'Please enter the state.' },
      { value: companyAddress.country, title: 'Missing country', message: 'Please enter the country.' },
      { value: companyAddress.pincode, title: 'Missing pincode', message: 'Please enter the pincode.' },
    ]);
    if (missingAddressField) {
      // Open the address section so the user can see the field to fill in.
      setIsAddressExpanded(true);
      Alert.alert(missingAddressField.title, missingAddressField.message);
      return;
    }
    if (!isValidPincode(companyAddress.pincode)) {
      setIsAddressExpanded(true);
      Alert.alert('Invalid pincode', 'Please enter a valid pincode.');
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
        companyAddress: {
          address1: companyAddress.address1.trim(),
          address2: companyAddress.address2.trim(),
          city: companyAddress.city.trim(),
          state: companyAddress.state.trim(),
          country: companyAddress.country.trim(),
          pincode: companyAddress.pincode.trim(),
        },
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

        <AddressInput
          label="Company Address"
          value={companyAddress}
          onChange={handleAddressChange}
          isExpanded={isAddressExpanded}
          onToggle={() => setIsAddressExpanded((current) => !current)}
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
