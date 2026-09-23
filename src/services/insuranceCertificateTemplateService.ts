import { PDFDocument, PDFFont, PDFPage, StandardFonts, rgb } from 'pdf-lib';
import RNFS from 'react-native-fs';

export interface InsuranceTemplateFields {
  insuranceCompanyName: string;
  policyNumber: string;
  /** YYYY-MM-DD, as produced by the form's DateInput. */
  effectiveDate: string;
  /** YYYY-MM-DD, as produced by the form's DateInput. */
  expirationDate: string;
}

export interface InsuranceCertificateFieldConfig {
  /** Whiteout box drawn first, to cover any existing sample value in that cell. */
  rect: { x: number; y: number; width: number; height: number };
  /** Baseline position for the new value, drawn after the whiteout. */
  text: { x: number; y: number; fontSize: number; maxWidth: number };
}

export interface InsuranceCertificateFieldMap {
  insuranceCompanyName: InsuranceCertificateFieldConfig;
  policyNumber: InsuranceCertificateFieldConfig;
  effectiveDate: InsuranceCertificateFieldConfig;
  expirationDate: InsuranceCertificateFieldConfig;
}

const MIN_FONT_SIZE = 6;

function formatDateForPdf(isoDate: string): string {
  const [year, month, day] = isoDate.split('-');
  return `${month}/${day}/${year}`;
}

/** Shrinks font size (and truncates as a last resort) so `value` fits within `maxWidth`. */
function fitText(
  font: PDFFont,
  value: string,
  baseFontSize: number,
  maxWidth: number,
): { text: string; fontSize: number } {
  let fontSize = baseFontSize;
  while (fontSize > MIN_FONT_SIZE && font.widthOfTextAtSize(value, fontSize) > maxWidth) {
    fontSize -= 0.5;
  }

  let text = value;
  while (text.length > 1 && font.widthOfTextAtSize(text, fontSize) > maxWidth) {
    text = text.slice(0, -1);
  }
  if (text !== value) {
    text = `${text.slice(0, -1)}…`;
  }

  return { text, fontSize };
}

function drawField(page: PDFPage, font: PDFFont, config: InsuranceCertificateFieldConfig, value: string): void {
  const { rect, text } = config;
  page.drawRectangle({ x: rect.x, y: rect.y, width: rect.width, height: rect.height, color: rgb(1, 1, 1) });

  const fitted = fitText(font, value, text.fontSize, text.maxWidth);
  page.drawText(fitted.text, {
    x: text.x,
    y: text.y,
    size: fitted.fontSize,
    font,
    color: rgb(0, 0, 0),
  });
}

/**
 * Loads an ACORD-style certificate PDF (base64), overlays the 4 insurance
 * fields at the given coordinates (covering any existing sample value
 * first), and writes the result to a new local PDF file. Shared by the
 * General Liability and Workers Comp template generators — only the
 * template bytes, field coordinates, and output filename differ per coverage
 * type.
 */
export async function generateInsuranceCertificateTemplate(
  templateBase64: string,
  fieldMap: InsuranceCertificateFieldMap,
  fields: InsuranceTemplateFields,
  outputFileName: string,
): Promise<string> {
  const pdfDoc = await PDFDocument.load(templateBase64);
  const page = pdfDoc.getPages()[0];
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

  drawField(page, font, fieldMap.insuranceCompanyName, fields.insuranceCompanyName);
  drawField(page, font, fieldMap.policyNumber, fields.policyNumber);
  drawField(page, font, fieldMap.effectiveDate, formatDateForPdf(fields.effectiveDate));
  drawField(page, font, fieldMap.expirationDate, formatDateForPdf(fields.expirationDate));

  const base64Pdf = await pdfDoc.saveAsBase64();
  const outputPath = `${RNFS.CachesDirectoryPath}/${outputFileName}`;
  await RNFS.writeFile(outputPath, base64Pdf, 'base64');

  return outputPath;
}
