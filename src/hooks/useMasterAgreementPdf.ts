import { useEffect, useMemo, useRef, useState } from 'react';
import { Alert } from 'react-native';
import { SignatureFontId } from '../constants/signatureFonts';
import {
  deleteMasterSubcontractAgreement,
  generateMasterSubcontractAgreement,
} from '../services/masterSubcontractAgreementService';
import { todayDateString } from '../utils/dateValidation';
import { getInitials } from '../utils/signature';

const SIGNATURE_DEBOUNCE_MS = 600;

export interface MasterAgreementPdf {
  /** The PDF to show and the page to open it at; null until the first one is ready. */
  pdf: { path: string; page: number } | null;
  /** react-native-pdf's source for `pdf`, kept stable between renders. */
  pdfSource: { uri: string } | null;
  /** The agreement couldn't be prepared or shown. */
  hasError: boolean;
  setHasError: (hasError: boolean) => void;
  /** The page being shown; update it from the viewer's onPageChanged. */
  currentPageRef: React.MutableRefObject<number>;
}

/**
 * The Master Subcontract Agreement for `companyName` as a PDF file to show,
 * regenerated (keeping the page the user is on) once they have typed a name
 * and chosen a signature style: their initials on every page and their
 * signature dated today on page 10. Old files are deleted as they're replaced.
 */
export function useMasterAgreementPdf(
  companyName: string,
  signatureName: string,
  signatureFont: SignatureFontId | null,
): MasterAgreementPdf {
  // The PDF and the page to open it at change together, only when a new PDF is
  // generated. react-native-pdf reloads the whole document on any prop change,
  // so the page shown while scrolling is tracked in a ref, not passed back as a
  // prop — reloading mid-scroll crashes its native renderer.
  const [pdf, setPdf] = useState<{ path: string; page: number } | null>(null);
  const currentPageRef = useRef(1);
  const [hasError, setHasError] = useState(false);
  const hasPdfRef = useRef(false);

  // The signature on the "By:" line changes with every keystroke, so wait for
  // the user to pause typing before regenerating the PDF with it.
  const [debouncedName, setDebouncedName] = useState(signatureName);
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedName(signatureName), SIGNATURE_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [signatureName]);

  // The PDF only carries a signature once there's both a name and a style, so
  // typing a name before choosing a style (or vice versa) doesn't regenerate it.
  const signedName = signatureFont ? debouncedName : '';
  const signedFont = debouncedName ? signatureFont : null;

  useEffect(() => {
    let isCancelled = false;
    const signature =
      signedName && signedFont
        ? { name: signedName, initials: getInitials(signedName), fontId: signedFont, date: todayDateString() }
        : undefined;
    generateMasterSubcontractAgreement(companyName, signature)
      .then((path) => {
        if (isCancelled) {
          // Superseded by a newer request, or the screen has closed.
          deleteMasterSubcontractAgreement(path);
          return;
        }
        // Keep the user's place when the PDF is regenerated with new initials.
        hasPdfRef.current = true;
        setHasError(false);
        setPdf({ path, page: currentPageRef.current });
      })
      .catch((error) => {
        console.error('Failed to prepare Master Subcontract Agreement:', error);
        if (isCancelled) {
          return;
        }
        if (hasPdfRef.current) {
          // Only re-signing failed: keep showing the agreement already loaded.
          Alert.alert('Unable to add signature', 'Your signature could not be added to the agreement preview.');
        } else {
          setHasError(true);
        }
      });
    return () => {
      isCancelled = true;
    };
  }, [companyName, signedName, signedFont]);

  // Delete each generated file once the viewer has moved on to a newer one (or the screen closes).
  const pdfPath = pdf?.path;
  useEffect(() => {
    return () => {
      if (pdfPath) {
        deleteMasterSubcontractAgreement(pdfPath);
      }
    };
  }, [pdfPath]);

  const pdfSource = useMemo(() => (pdfPath ? { uri: `file://${pdfPath}` } : null), [pdfPath]);

  return { pdf, pdfSource, hasError, setHasError, currentPageRef };
}
