import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AuthStackParamList } from './types';
import { WelcomeScreen } from '../screens/WelcomeScreen';
import { SubcontractorLoginScreen } from '../screens/SubcontractorLoginScreen';
import { RegisterSubcontractorScreen } from '../screens/RegisterSubcontractorScreen';
import { WhyVerifyIdentityScreen } from '../screens/WhyVerifyIdentityScreen';
import { EmailAlreadyInUseScreen } from '../screens/EmailAlreadyInUseScreen';
import { IdentityVerificationCompleteScreen } from '../screens/IdentityVerificationCompleteScreen';
import { CompanyDetailsScreen } from '../screens/CompanyDetailsScreen';
import { W9Screen } from '../screens/W9Screen';
import { GeneralLiabilityScreen } from '../screens/GeneralLiabilityScreen';
import { WorkersCompScreen } from '../screens/WorkersCompScreen';
import { MasterSubcontractorAgreementScreen } from '../screens/MasterSubcontractorAgreementScreen';
import { AcceptPolicyTermsScreen } from '../screens/AcceptPolicyTermsScreen';
import { CreatePasswordScreen } from '../screens/CreatePasswordScreen';
import { RegistrationCompleteScreen } from '../screens/RegistrationCompleteScreen';
import { LoginScreen } from '../screens/Auth/LoginScreen';
import { RegisterScreen } from '../screens/Auth/RegisterScreen';
import { ForgotPasswordScreen } from '../screens/Auth/ForgotPasswordScreen';
import { HomeScreen } from '../screens/HomeScreen';
import { ApprovalNeededScreen } from '../screens/ApprovalNeededScreen';

const Stack = createNativeStackNavigator<AuthStackParamList>();

export function AuthNavigator(): React.JSX.Element {
  return (
    <Stack.Navigator initialRouteName="Welcome" screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Welcome" component={WelcomeScreen} />
      <Stack.Screen name="SubcontractorLogin" component={SubcontractorLoginScreen} />
      <Stack.Screen name="RegisterSubcontractor" component={RegisterSubcontractorScreen} />
      <Stack.Screen name="WhyVerifyIdentity" component={WhyVerifyIdentityScreen} />
      <Stack.Screen name="EmailAlreadyInUse" component={EmailAlreadyInUseScreen} />
      <Stack.Screen name="IdentityVerificationComplete" component={IdentityVerificationCompleteScreen} />
      <Stack.Screen name="CompanyDetails" component={CompanyDetailsScreen} />
      <Stack.Screen name="W9" component={W9Screen} />
      <Stack.Screen name="GeneralLiability" component={GeneralLiabilityScreen} />
      <Stack.Screen name="WorkersComp" component={WorkersCompScreen} />
      <Stack.Screen name="MasterSubcontractorAgreement" component={MasterSubcontractorAgreementScreen} />
      <Stack.Screen name="AcceptPolicyTerms" component={AcceptPolicyTermsScreen} />
      <Stack.Screen name="CreatePassword" component={CreatePasswordScreen} />
      <Stack.Screen name="RegistrationComplete" component={RegistrationCompleteScreen} />
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
      <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
      <Stack.Screen name="Home" component={HomeScreen} />
      <Stack.Screen name="ApprovalNeeded" component={ApprovalNeededScreen} />
    </Stack.Navigator>
  );
}
