import React, { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { pick, types, isErrorWithCode, errorCodes } from '@react-native-documents/picker';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AuthCard } from '../components/AuthCard';
import { AuthCardHeader } from '../components/AuthCardHeader';
import { AuthHeader } from '../components/AuthHeader';
import { AuthPrimaryButton } from '../components/AuthPrimaryButton';
import { AuthScreenLayout } from '../components/AuthScreenLayout';
import { LoginInput } from '../components/LoginInput';
import { DateInput } from '../components/DateInput';
import { RegistrationProgress } from '../components/RegistrationProgress';
import { DocumentIcon, UploadIcon } from '../assets/icons';
import { fontFamily, radius, welcomeColors } from '../theme';
import { AuthStackParamList, RegistrationFile } from '../navigation/types';
import { findMissingRequiredField } from '../utils/formValidation';
import { isPdfFile } from '../utils/fileValidation';
import { fileToBase64 } from '../utils/fileToBase64';

type Props = NativeStackScreenProps<AuthStackParamList, 'W9'>;

const TOTAL_STEPS = 6;

export function W9Screen({ navigation, route }: Props): React.JSX.Element {
  const [federalTaxClassification, setFederalTaxClassification] = useState('');
  const [taxIdentificationNumber, setTaxIdentificationNumber] = useState('');
  const [w9SignedDate, setW9SignedDate] = useState('');
  const [uploadedW9, setUploadedW9] = useState<RegistrationFile | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleUploadPress = async (): Promise<void> => {
    try {
      const [result] = await pick({
        type: [types.pdf],
      });
      if (!isPdfFile(result)) {
        Alert.alert('Invalid file', 'Please select a PDF file only.');
        return;
      }
      setIsUploading(true);
      const base64 = await fileToBase64(result.uri);
      setUploadedW9({
        uri: result.uri,
        name: result.name ?? 'W9 document',
        type: result.type ?? undefined,
        base64,
      });
    } catch (error) {
      if (isErrorWithCode(error) && error.code === errorCodes.OPERATION_CANCELED) {
        return;
      }
      Alert.alert('Unable to select file', 'Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleContinue = (): void => {
    const missingField = findMissingRequiredField([
      {
        value: federalTaxClassification,
        title: 'Missing federal tax classification',
        message: 'Please enter your federal tax classification.',
      },
      {
        value: taxIdentificationNumber,
        title: 'Missing tax identification number',
        message: 'Please enter your tax identification number.',
      },
      { value: w9SignedDate, title: 'Missing W9 signed date', message: 'Please enter the W9 signed date.' },
    ]);
    if (missingField) {
      Alert.alert(missingField.title, missingField.message);
      return;
    }
    if (!uploadedW9) {
      Alert.alert('W9 required', 'Please upload your signed W9 document.');
      return;
    }

    navigation.navigate('GeneralLiability', {
      identity: route.params.identity,
      company: route.params.company,
      w9: {
        federalTaxClassification: federalTaxClassification.trim(),
        taxIdentificationNumber: taxIdentificationNumber.trim(),
        w9SignedDate: w9SignedDate.trim(),
        w9File: uploadedW9,
      },
    });
  };

  return (
    <AuthScreenLayout withKeyboardAvoiding>
      <AuthHeader />

      <RegistrationProgress totalSteps={TOTAL_STEPS} currentStep={3} />

      <AuthCard>
        <AuthCardHeader
          icon={<DocumentIcon size={18} color={welcomeColors.accent} />}
          title="W9"
          subtitle="Fill in your company tax details and upload W9"
        />

        <LoginInput
          label="Federal Tax Classification"
          placeholder="Enter federal tax classification"
          value={federalTaxClassification}
          onChangeText={setFederalTaxClassification}
          autoCapitalize="words"
        />

        <LoginInput
          label="Tax Identification Number"
          placeholder="Enter tax identification number"
          value={taxIdentificationNumber}
          onChangeText={setTaxIdentificationNumber}
        />

        <DateInput
          label="W9 Signed Date"
          placeholder="Enter W9 signed date"
          value={w9SignedDate}
          onChange={setW9SignedDate}
        />

        <View style={styles.uploadSection}>
          <Text style={styles.uploadLabel}>Upload W9</Text>
          <View style={styles.uploadRow}>
            <Pressable style={styles.uploadButton} onPress={handleUploadPress} disabled={isUploading}>
              <UploadIcon size={14} color={welcomeColors.accent} />
              <Text style={styles.uploadButtonText}>{isUploading ? 'Uploading...' : 'Upload Files'}</Text>
            </Pressable>
            <Text style={styles.dropFilesText}>Or drop files</Text>
          </View>
          {!!uploadedW9 && <Text style={styles.selectedFileText}>{uploadedW9.name}</Text>}
        </View>

        <AuthPrimaryButton title="Continue" onPress={handleContinue} style={styles.continueButton} />
      </AuthCard>
    </AuthScreenLayout>
  );
}

const styles = StyleSheet.create({
  uploadSection: {
    marginBottom: 14,
  },
  uploadLabel: {
    fontFamily: fontFamily.semiBold,
    fontWeight: '600',
    fontSize: 11,
    lineHeight: 16.5,
    color: welcomeColors.textPrimary,
    marginBottom: 6,
  },
  uploadRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: welcomeColors.inputBorder,
    borderRadius: radius.pill,
    paddingHorizontal: 14,
    height: 36,
  },
  uploadButtonText: {
    fontFamily: fontFamily.semiBold,
    fontWeight: '600',
    fontSize: 11,
    color: welcomeColors.textPrimary,
  },
  dropFilesText: {
    fontFamily: fontFamily.regular,
    fontWeight: '400',
    fontSize: 11,
    color: welcomeColors.textSecondary,
  },
  selectedFileText: {
    fontFamily: fontFamily.regular,
    fontWeight: '400',
    fontSize: 11,
    color: welcomeColors.textSecondary,
    marginTop: 6,
  },
  continueButton: {
    marginTop: 4,
  },
});
