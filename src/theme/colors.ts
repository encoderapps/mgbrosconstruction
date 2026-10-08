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

// Signed-in screens (header, lists, statuses), in the same warm palette.
export const portalColors = {
  headerBorder: '#E8E0D8',
  unreadBackground: '#F7F3EE',
  danger: '#D32F2F',
  /** Stand-in document preview: the grey backdrop and the page's text lines. */
  thumbnailBackground: '#E4E1DD',
  thumbnailLine: '#CFCAC4',
} as const;

/** Foreground / background / border for status badges and notification icons. */
export const toneColors = {
  success: { foreground: '#2E7D32', background: '#E8F5E9', border: '#C3E6C3' },
  info: { foreground: '#3B6FD4', background: '#E8EFFB', border: '#C5D6F5' },
  warning: { foreground: '#E69500', background: '#FFF6E5', border: '#FFD89A' },
  danger: { foreground: '#E5484D', background: '#FDECEC', border: '#F5C2C3' },
  /** Not good or bad yet, e.g. a draft. */
  neutral: { foreground: '#5F5852', background: '#F1EEEA', border: '#E0DAD3' },
} as const;

export type Tone = keyof typeof toneColors;
