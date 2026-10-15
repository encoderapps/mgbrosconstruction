import type { SignatureFontId } from '../constants/signatureFonts';

/** The signature made when registering, used to sign after logging in. */
export interface UserSignature {
  /** The signer's full name. */
  name: string;
  initials: string;
  /** The name drawn in the signature style, as a base64 PNG. */
  imageBase64: string;
  /** The initials drawn in the signature style, as a base64 PNG. */
  initialsImageBase64: string;
  /** The style chosen; null when the signature came from the API, which doesn't say. */
  fontId: SignatureFontId | null;
}
