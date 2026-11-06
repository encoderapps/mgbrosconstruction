import React, { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { pick, types, isErrorWithCode, errorCodes } from '@react-native-documents/picker';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AuthCard } from '../components/AuthCard';
import { AuthCardHeader } from '../components/AuthCardHeader';
import { AuthPrimaryButton } from '../components/AuthPrimaryButton';
import { DateInput } from '../components/DateInput';
import { HomeHeader } from '../components/HomeHeader';
import { ArrowLeftIcon, DocumentIcon, ShieldIcon, UploadIcon } from '../assets/icons';
import { fontFamily, radius, welcomeColors } from '../theme';
import { AuthStackParamList, RegistrationFile } from '../navigation/types';
import { COMPLIANCE_DOCUMENT_INFO } from '../constants/complianceDocuments';
import { useSubcontractorSession } from '../context/SubcontractorSessionContext';
import { useBlockBackWhile } from '../hooks/useBlockBackWhile';
import { uploadComplianceDocument } from '../services/complianceDocumentService';
import { isInsuranceCertificate } from '../utils/complianceDocument';
import { findMissingRequiredField } from '../utils/formValidation';
import { startOfToday, validateInsuranceDates } from '../utils/dateValidation';
import { isPdfFile } from '../utils/fileValidation';
import { fileToBase64 } from '../utils/fileToBase64';

type Props = NativeStackScreenProps<AuthStackParamList, 'AddComplianceDocument'>;

/**
 * Home → Documents → + on a W9, General Liability, Workers' Comp or Master
 * Subcontract Agreement: upload a new copy (PDF only), which becomes the
 * current copy. A W9 or MSA takes the date it was signed (today or earlier); a
 * certificate takes effective and expiration dates, with the same rules as the
 * registration's insurance dates.
 */
export function AddComplianceDocumentScreen({ navigation, route }: Props): React.JSX.Element {
  const { documentType } = route.params;
  const { label } = COMPLIANCE_DOCUMENT_INFO[documentType];
  const isCertificate = isInsuranceCertificate(documentType);
  const accountId = useSubcontractorSession().company?.accountId;
  const [signedDate, setSignedDate] = useState('');
  const [effectiveDate, setEffectiveDate] = useState('');
  const [expirationDate, setExpirationDate] = useState('');
  const [pickedFile, setPickedFile] = useState<RegistrationFile | null>(null);
  const [isPicking, setIsPicking] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  useBlockBackWhile(isSaving);

  const Icon = isCertificate ? ShieldIcon : DocumentIcon;

  const handleUploadPress = async (): Promise<void> => {
    try {
      const [result] = await pick({
        type: [types.pdf],
      });
      if (!isPdfFile(result)) {
        Alert.alert('Invalid file', 'Please select a PDF file only.');
        return;
      }
      setIsPicking(true);
      const base64 = await fileToBase64(result.uri);
      setPickedFile({
        uri: result.uri,
        name: result.name ?? `${label}.pdf`,
        type: result.type ?? undefined,
        base64,
      });
    } catch (error) {
      if (isErrorWithCode(error) && error.code === errorCodes.OPERATION_CANCELED) {
        return;
      }
      Alert.alert('Unable to select file', 'Please try again.');
    } finally {
      setIsPicking(false);
    }
  };

  const handleSubmit = async (): Promise<void> => {
    if (!pickedFile) {
      Alert.alert('File required', `Please upload your ${label} as a PDF.`);
      return;
    }
    const missingField = findMissingRequiredField(
      isCertificate
        ? [
            { value: effectiveDate, title: 'Missing effective date', message: 'Please enter the effective date.' },
            { value: expirationDate, title: 'Missing expiration date', message: 'Please enter the expiration date.' },
          ]
        : [{ value: signedDate, title: 'Missing signed date', message: 'Please enter the signed date.' }],
    );
    if (missingField) {
      Alert.alert(missingField.title, missingField.message);
      return;
    }
    const dateError = isCertificate ? validateInsuranceDates(effectiveDate, expirationDate) : null;
    if (dateError) {
      Alert.alert(dateError.title, dateError.message);
      return;
    }
    if (!accountId) {
      Alert.alert('Unable to upload', 'Your session has expired. Please log in again.');
      return;
    }

    setIsSaving(true);
    try {
      const message = await uploadComplianceDocument({
        accountId,
        type: documentType,
        fileBase64: pickedFile.base64,
        dates: isCertificate ? { effectiveDate, expirationDate } : { signedDate },
      });
      // Documents reloads when it's shown again, picking up the new copy.
      Alert.alert(`${label} uploaded`, message, [{ text: 'OK', onPress: () => navigation.goBack() }]);
    } catch (error) {
      Alert.alert('Unable to upload', error instanceof Error ? error.message : 'Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const isBusy = isPicking || isSaving;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <HomeHeader />
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <Pressable
          onPress={() => navigation.goBack()}
          disabled={isSaving}
          hitSlop={10}
          style={styles.backButton}
          accessibilityRole="button"
          accessibilityLabel="Back"
        >
          <ArrowLeftIcon size={18} color={welcomeColors.textPrimary} />
          <Text style={styles.backText}>Documents</Text>
        </Pressable>

        <AuthCard>
          <AuthCardHeader
            icon={<Icon size={18} color={welcomeColors.accent} />}
            title={label}
            subtitle={`Upload your new ${label} and enter ${isCertificate ? 'its dates' : 'the date it was signed'}`}
          />

          <View style={styles.uploadSection}>
            <Text style={styles.uploadLabel}>Upload {label} (PDF)</Text>
            <View style={styles.uploadRow}>
              <Pressable style={styles.uploadButton} onPress={handleUploadPress} disabled={isBusy}>
                <UploadIcon size={14} color={welcomeColors.accent} />
                <Text style={styles.uploadButtonText}>{isPicking ? 'Uploading...' : 'Upload PDF'}</Text>
              </Pressable>
            </View>
            {!!pickedFile && <Text style={styles.selectedFileText}>{pickedFile.name}</Text>}
          </View>

          {isCertificate ? (
            <>
              <DateInput
                label="Effective Date"
                placeholder="Enter effective date"
                value={effectiveDate}
                onChange={setEffectiveDate}
                maximumDate={startOfToday()}
                disabled={isSaving}
              />

              <DateInput
                label="Expiration Date"
                placeholder="Enter expiration date"
                value={expirationDate}
                onChange={setExpirationDate}
                minimumDate={startOfToday()}
                disabled={isSaving}
              />
            </>
          ) : (
            <DateInput
              label="Signed Date"
              placeholder="Enter signed date"
              value={signedDate}
              onChange={setSignedDate}
              maximumDate={startOfToday()}
              disabled={isSaving}
            />
          )}

          <AuthPrimaryButton
            title={isSaving ? 'Submitting...' : 'Submit'}
            onPress={handleSubmit}
            disabled={isBusy}
            style={styles.submitButton}
          />
        </AuthCard>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: welcomeColors.background,
  },
  // Same page padding as the Home screen.
  container: {
    flexGrow: 1,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 24,
    gap: 12,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 8,
  },
  backText: {
    fontFamily: fontFamily.semiBold,
    fontWeight: '600',
    fontSize: 15,
    color: welcomeColors.textPrimary,
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
  selectedFileText: {
    fontFamily: fontFamily.regular,
    fontWeight: '400',
    fontSize: 11,
    color: welcomeColors.textSecondary,
    marginTop: 6,
  },
  submitButton: {
    marginTop: 4,
  },
});
