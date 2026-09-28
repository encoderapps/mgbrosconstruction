import RNFS from 'react-native-fs';
import { GL_TEMPLATE_PDF_BASE64 } from '../assets/pdf/glTemplatePdf';
import { WC_TEMPLATE_PDF_BASE64 } from '../assets/pdf/wcTemplatePdf';

export type CertificateTemplate = 'gl' | 'wc';

const TEMPLATES: Record<CertificateTemplate, { base64: string; fileName: string }> = {
  gl: { base64: GL_TEMPLATE_PDF_BASE64, fileName: 'MG-Bros-GL-Template.pdf' },
  wc: { base64: WC_TEMPLATE_PDF_BASE64, fileName: 'MG-Bros-WC-Template.pdf' },
};

/**
 * Writes the original, unmodified GL or WC template PDF to the cache directory
 * and returns its path. The templates are view-only, so no form values are
 * drawn onto them — the bytes are written exactly as bundled.
 */
export async function getCertificateTemplatePath(template: CertificateTemplate): Promise<string> {
  const { base64, fileName } = TEMPLATES[template];
  const outputPath = `${RNFS.CachesDirectoryPath}/${fileName}`;
  await RNFS.writeFile(outputPath, base64, 'base64');
  return outputPath;
}
