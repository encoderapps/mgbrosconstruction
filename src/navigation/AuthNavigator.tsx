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
import { LoginScreen } from '../screens/Auth/LoginScreen';
import { RegisterScreen } from '../screens/Auth/RegisterScreen';
import { ForgotPasswordScreen } from '../screens/Auth/ForgotPasswordScreen';

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
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
      <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
    </Stack.Navigator>
  );
}
