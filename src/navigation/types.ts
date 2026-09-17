import { NavigatorScreenParams } from '@react-navigation/native';

export interface SubcontractorIdentityData {
  firstName: string;
  lastName: string;
  phoneNumber: string;
  email: string;
  homeAddress: string;
}

export type AuthStackParamList = {
  Welcome: undefined;
  SubcontractorLogin: undefined;
  Login: undefined;
  Register: undefined;
  RegisterSubcontractor: undefined;
  WhyVerifyIdentity: undefined;
  EmailAlreadyInUse: undefined;
  IdentityVerificationComplete: { identity: SubcontractorIdentityData };
  CompanyDetails: { identity: SubcontractorIdentityData };
  ForgotPassword: undefined;
};

export type ProjectsStackParamList = {
  ProjectsList: undefined;
  ProjectDetails: { projectId: string };
};

export type MainTabParamList = {
  Dashboard: undefined;
  Projects: NavigatorScreenParams<ProjectsStackParamList>;
  Tasks: undefined;
  Profile: undefined;
  Settings: undefined;
};

export type RootStackParamList = {
  Auth: NavigatorScreenParams<AuthStackParamList>;
  Main: NavigatorScreenParams<MainTabParamList>;
};
