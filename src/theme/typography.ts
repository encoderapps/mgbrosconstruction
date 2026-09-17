import { TextStyle } from 'react-native';

export const fontFamily = {
  regular: 'Inter-Regular',
  medium: 'Inter-Medium',
  semiBold: 'Inter-SemiBold',
  bold: 'Inter-Bold',
} as const;

export const fontSize = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 18,
  xl: 22,
  xxl: 28,
  xxxl: 34,
} as const;

export const typography: Record<string, TextStyle> = {
  h1: { fontSize: fontSize.xxxl, fontWeight: '700' },
  h2: { fontSize: fontSize.xxl, fontWeight: '700' },
  h3: { fontSize: fontSize.xl, fontWeight: '600' },
  subtitle: { fontSize: fontSize.lg, fontWeight: '600' },
  body: { fontSize: fontSize.md, fontWeight: '400' },
  bodyMedium: { fontSize: fontSize.md, fontWeight: '600' },
  caption: { fontSize: fontSize.sm, fontWeight: '400' },
  small: { fontSize: fontSize.xs, fontWeight: '400' },
};
