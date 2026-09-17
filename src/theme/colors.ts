export const colors = {
  primary: '#1A4D8F',
  primaryDark: '#0F3566',
  primaryLight: '#4A7CB5',
  secondary: '#F5A623',

  background: '#F5F6F8',
  surface: '#FFFFFF',

  textPrimary: '#1B1F27',
  textSecondary: '#6B7280',
  textInverse: '#FFFFFF',
  placeholder: '#9CA3AF',

  border: '#E2E5EA',
  divider: '#EDEFF2',

  success: '#22A45D',
  warning: '#F5A623',
  error: '#E5484D',
  info: '#2E90FA',

  statusPlanned: '#6B7280',
  statusInProgress: '#2E90FA',
  statusCompleted: '#22A45D',
  statusOnHold: '#F5A623',
  statusDelayed: '#E5484D',

  priorityLow: '#22A45D',
  priorityMedium: '#F5A623',
  priorityHigh: '#E5484D',

  overlay: 'rgba(15, 23, 42, 0.45)',
  white: '#FFFFFF',
  black: '#000000',
} as const;

export type ColorKey = keyof typeof colors;

// Palette for the role-selection Welcome screen, sampled from the MG Bros
// Construction logo (warm taupe/brown) rather than the app's primary blue theme.
export const welcomeColors = {
  background: '#F6F1E6',
  cardBackground: '#FFFFFF',
  cardBorder: '#EDE6DA',
  iconWrapperBackground: '#F0E8DF',
  accent: '#84726C',
  chevron: '#B5ACA3',
  divider: '#E3DCD0',
  textPrimary: '#211D1A',
  textSecondary: '#6B625B',
  inputBackground: '#FAFAFA',
  inputBorder: '#DDDDDD',
  inputPlaceholder: '#BBBBBB',
  loginButton: '#84726A',
  registerGreen: '#2E7D32',
  benefitTextColor: '#444444',
  securityText: '#333333',
  link: '#3B6FD4',
} as const;
