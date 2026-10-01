export type SignatureFontId = 'SignatureFont1' | 'SignatureFont2' | 'SignatureFont3';

export interface SignatureFont {
  id: SignatureFontId;
  label: string;
  /** React Native font family — the font file's name (= its PostScript name, so it works on iOS too). */
  fontFamily: string;
  /** Bundled font file (src/assets/fonts, linked into the native apps), also embedded into the agreement PDF. */
  fileName: string;
}

// Handwriting-style fonts from Google Fonts, bundled locally (SIL Open Font
// License 1.1 — see the *-OFL.txt files next to them in src/assets/fonts).
export const SIGNATURE_FONTS: SignatureFont[] = [
  { id: 'SignatureFont1', label: 'Signature Style 1', fontFamily: 'GreatVibes-Regular', fileName: 'GreatVibes-Regular.ttf' },
  { id: 'SignatureFont2', label: 'Signature Style 2', fontFamily: 'AlexBrush-Regular', fileName: 'AlexBrush-Regular.ttf' },
  { id: 'SignatureFont3', label: 'Signature Style 3', fontFamily: 'Allura-Regular', fileName: 'Allura-Regular.ttf' },
];

export function getSignatureFont(id: SignatureFontId): SignatureFont {
  return SIGNATURE_FONTS.find((font) => font.id === id) ?? SIGNATURE_FONTS[0];
}
