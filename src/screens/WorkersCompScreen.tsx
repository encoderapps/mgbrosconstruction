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
import { DocumentIcon, ShieldIcon, UploadIcon } from '../assets/icons';
import { fontFamily, radius, welcomeColors } from '../theme';
import { AuthStackParamList, RegistrationFile } from '../navigation/types';
import { findMissingRequiredField } from '../utils/formValidation';
import { startOfToday, validateInsuranceDates } from '../utils/dateValidation';
import { isPdfFile } from '../utils/fileValidation';
import { fileToBase64 } from '../utils/fileToBase64';

type Props = NativeStackScreenProps<AuthStackParamList, 'WorkersComp'>;

const TOTAL_STEPS = 6;

export function WorkersCompScreen({ navigation, route }: Props): React.JSX.Element {
  const [insuranceCompanyName, setInsuranceCompanyName] = useState('');
  const [policyNumber, setPolicyNumber] = useState('');
  const [effectiveDate, setEffectiveDate] = useState('');
  const [expirationDate, setExpirationDate] = useState('');
  const [uploadedWorkersCompCOI, setUploadedWorkersCompCOI] = useState<RegistrationFile | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleWCTemplatePress = (): void => {
    navigation.navigate('TemplatePreview', { title: 'WC Template', template: 'wc', currentStep: 5 });
  };

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
      setUploadedWorkersCompCOI({
        uri: result.uri,
        name: result.name ?? 'Workers Comp COI',
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
        value: insuranceCompanyName,
        title: 'Missing insurance company name',
        message: 'Please enter the insurance company name.',
      },
      { value: policyNumber, title: 'Missing policy number', message: 'Please enter the policy number.' },
      { value: effectiveDate, title: 'Missing effective date', message: 'Please enter the effective date.' },
      { value: expirationDate, title: 'Missing expiration date', message: 'Please enter the expiration date.' },
    ]);
    if (missingField) {
      Alert.alert(missingField.title, missingField.message);
      return;
    }
    const dateError = validateInsuranceDates(effectiveDate, expirationDate);
    if (dateError) {
      Alert.alert(dateError.title, dateError.message);
      return;
    }
    if (!uploadedWorkersCompCOI) {
      Alert.alert('COI required', 'Please upload your Workers Comp COI.');
      return;
    }

    navigation.navigate('MasterSubcontractorAgreement', {
      identity: route.params.identity,
      company: route.params.company,
      w9: route.params.w9,
      generalLiability: route.params.generalLiability,
      workersComp: {
        insuranceCompanyName: insuranceCompanyName.trim(),
        policyNumber: policyNumber.trim(),
        effectiveDate: effectiveDate.trim(),
        expirationDate: expirationDate.trim(),
        coiFile: uploadedWorkersCompCOI,
      },
    });
  };

  return (
    <AuthScreenLayout withKeyboardAvoiding>
      <AuthHeader />

      <RegistrationProgress totalSteps={TOTAL_STEPS} currentStep={5} />

      <AuthCard>
        <AuthCardHeader
          icon={<ShieldIcon size={18} color={welcomeColors.accent} />}
          title="Workers Comp"
          subtitle="Fill in your company Workers Comp details and upload COI"
        />

        <LoginInput
          label="Insurance Company Name"
          placeholder="Enter Insurance Company Name"
          value={insuranceCompanyName}
          onChangeText={setInsuranceCompanyName}
          autoCapitalize="words"
        />

        <LoginInput
          label="Policy Number"
          placeholder="Enter policy number"
          value={policyNumber}
          onChangeText={setPolicyNumber}
        />

        <DateInput
          label="Effective Date"
          placeholder="Enter effective date"
          value={effectiveDate}
          onChange={setEffectiveDate}
          maximumDate={startOfToday()}
        />

        <DateInput
          label="Expiration Date"
          placeholder="Enter expiration date"
          value={expirationDate}
          onChange={setExpirationDate}
          minimumDate={startOfToday()}
        />

        <View style={styles.wcTemplateRow}>
          <Pressable onPress={handleWCTemplatePress} hitSlop={8} style={styles.wcTemplateLink}>
            <DocumentIcon size={14} color={welcomeColors.link} />
            <Text style={styles.wcTemplateText}>WC Template</Text>
          </Pressable>
        </View>

        <View style={styles.uploadSection}>
          <Text style={styles.uploadLabel}>Upload Workers Comp COI</Text>
          <View style={styles.uploadRow}>
            <Pressable style={styles.uploadButton} onPress={handleUploadPress} disabled={isUploading}>
              <UploadIcon size={14} color={welcomeColors.accent} />
              <Text style={styles.uploadButtonText}>{isUploading ? 'Uploading...' : 'Upload Files'}</Text>
            </Pressable>
            <Text style={styles.dropFilesText}>Or drop files</Text>
          </View>
          {!!uploadedWorkersCompCOI && (
            <Text style={styles.selectedFileText}>{uploadedWorkersCompCOI.name}</Text>
          )}
        </View>

        <AuthPrimaryButton title="Continue" onPress={handleContinue} style={styles.continueButton} />
      </AuthCard>
    </AuthScreenLayout>
  );
}

const styles = StyleSheet.create({
  wcTemplateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  wcTemplateLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  wcTemplateText: {
    fontFamily: fontFamily.semiBold,
    fontWeight: '600',
    fontSize: 11,
    color: welcomeColors.link,
    textDecorationLine: 'underline',
  },
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
