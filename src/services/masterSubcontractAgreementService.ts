import { Platform } from 'react-native';
import { PDFDocument, PDFFont, PDFPage, StandardFonts, rgb } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
import RNFS from 'react-native-fs';
import { MASTER_SUBCONTRACT_AGREEMENT_PDF_BASE64 } from '../assets/pdf/masterSubcontractAgreementPdf';
import { SignatureFontId, getSignatureFont } from '../constants/signatureFonts';

/*
 * The agreement PDF is shown exactly as provided, except for the highlighted
 * sample subcontractor name ("Valshu Corporation Inc"), which is replaced with
 * the company name entered in Step 2. Coordinates below were measured from the
 * PDF with PyMuPDF (page size 612 x 792 pt). They're given in top-left page
 * coordinates, as measured, and flipped for pdf-lib (bottom-left origin).
 * Re-measure them if the agreement PDF is ever replaced.
 *
 * Arial is the agreement's font; Helvetica (a PDF standard font) has identical
 * character widths, so the replaced text matches the surrounding layout.
 */

const PAGE_HEIGHT = 792;
const FONT_SIZE = 11.04;
const MIN_FONT_SIZE = 7;
const WORD_SPACE_MAX_STRETCH = 3; // pt added per gap at most, so a short name isn't over-justified

/**
 * Page 1, 3rd line of the opening paragraph — a justified line:
 *   "“Contractor”) and [Valshu Corporation Inc] (the “Subcontractor,” and together with Contractor, the"
 * A different-length name shifts everything after it, so the line is redrawn
 * from the name to the right margin and re-justified.
 */
const PAGE_1_NAME_LINE = {
  pageIndex: 0,
  startX: 159.38,
  rightMargin: 542.91,
  top: 122.62, // just below the previous line (ends at 122.58)
  bottom: 135.5, // just above the next line (starts at 135.59)
  baseline: 132.98,
  trailingText: '(the “Subcontractor,” and together with Contractor, the',
};

/** Page 10 signature block: "The Subcontractor:" / [Valshu Corporation Inc] (bold). */
const PAGE_10_SIGNATURE_NAME = {
  pageIndex: 9,
  x: 306.05,
  maxWidth: 540 - 306.05, // up to the 1" right margin
  top: 302.9, // the highlight starts at 303.53; the line above ends at 303.57 with no descenders
  bottom: 316.4,
  baseline: 313.85,
};

/**
 * "Initials: ____" in the bottom-right corner of every page. The body text ends
 * by ~710pt and the centred page number sits at ~730-743pt, so this corner is free.
 */
const PAGE_INITIALS = {
  labelX: 432,
  lineStartX: 470,
  lineEndX: 540, // the 1" right margin
  baseline: 741, // shares the page number's baseline
  labelFontSize: 9,
  initialsFontSize: 18,
};

/** Page 10, Subcontractor column: "By: ______" (signature) and "Dated: ______" (signing date). */
const PAGE_10_SIGNATURE_LINES = {
  pageIndex: 9,
  signature: { startX: 325.12, endX: 520.92, baseline: 350.5, fontSize: 22 },
  date: { x: 346, baseline: 388.4 },
};

const INK_BLUE = rgb(0.05, 0.1, 0.35); // like a pen signature

const OUTPUT_FILE_PREFIX = 'MG-Bros-Master-Subcontract-Agreement';

export interface AgreementSignature {
  /** The signer's full name, drawn on the "By:" line. */
  name: string;
  /** Drawn at the bottom of every page. */
  initials: string;
  fontId: SignatureFontId;
  /** Signing date as YYYY-MM-DD, shown on the "Dated:" line as MM/DD/YYYY. */
  date: string;
}

function formatDateForAgreement(isoDate: string): string {
  const [year, month, day] = isoDate.split('-');
  return `${month}/${day}/${year}`;
}

/** Reads a bundled signature font (linked into the native app's assets) as base64. */
async function readSignatureFont(fontId: SignatureFontId): Promise<string> {
  const { fileName } = getSignatureFont(fontId);
  return Platform.OS === 'android'
    ? RNFS.readFileAssets(`fonts/${fileName}`, 'base64')
    : RNFS.readFile(`${RNFS.MainBundlePath}/${fileName}`, 'base64');
}

function drawPageInitials(page: PDFPage, labelFont: PDFFont, signatureFont: PDFFont, initials: string): void {
  const layout = PAGE_INITIALS;
  const y = PAGE_HEIGHT - layout.baseline;
  page.drawText('Initials:', { x: layout.labelX, y, size: layout.labelFontSize, font: labelFont, color: rgb(0, 0, 0) });
  page.drawLine({
    start: { x: layout.lineStartX, y: y - 2 },
    end: { x: layout.lineEndX, y: y - 2 },
    thickness: 0.5,
    color: rgb(0, 0, 0),
  });
  const lineWidth = layout.lineEndX - layout.lineStartX;
  const initialsWidth = signatureFont.widthOfTextAtSize(initials, layout.initialsFontSize);
  page.drawText(initials, {
    x: layout.lineStartX + Math.max(0, (lineWidth - initialsWidth) / 2),
    y,
    size: layout.initialsFontSize,
    font: signatureFont,
    color: INK_BLUE,
  });
}

function coverArea(page: PDFPage, left: number, right: number, top: number, bottom: number): void {
  page.drawRectangle({
    x: left,
    y: PAGE_HEIGHT - bottom,
    width: right - left,
    height: bottom - top,
    color: rgb(1, 1, 1),
  });
}

/** Largest font size (<= FONT_SIZE) at which `text` fits in `maxWidth`. */
function fitFontSize(font: PDFFont, text: string, maxWidth: number): number {
  const width = font.widthOfTextAtSize(text, FONT_SIZE);
  return width <= maxWidth ? FONT_SIZE : Math.max(MIN_FONT_SIZE, (FONT_SIZE * maxWidth) / width);
}

/**
 * Shortens `name` with an ellipsis until `name + suffix` fits in `maxWidth` at
 * MIN_FONT_SIZE — only reached for extremely long names that can't fit even
 * after shrinking the font.
 */
function truncateToFit(font: PDFFont, name: string, suffix: string, maxWidth: number): string {
  const fits = (text: string): boolean => font.widthOfTextAtSize(text + suffix, MIN_FONT_SIZE) <= maxWidth;
  if (fits(name)) {
    return name;
  }
  let shortened = name;
  while (shortened.length > 1 && !fits(`${shortened}…`)) {
    shortened = shortened.slice(0, -1).trimEnd();
  }
  return `${shortened}…`;
}

function drawNameLine(page: PDFPage, font: PDFFont, companyName: string): void {
  const line = PAGE_1_NAME_LINE;
  const availableWidth = line.rightMargin - line.startX;
  const name = truncateToFit(font, companyName, ` ${line.trailingText}`, availableWidth);
  const words = [...name.split(' '), ...line.trailingText.split(' ')];

  const fontSize = fitFontSize(font, words.join(' '), availableWidth);
  const wordWidths = words.map((word) => font.widthOfTextAtSize(word, fontSize));
  const spaceWidth = font.widthOfTextAtSize(' ', fontSize);
  const naturalWidth = wordWidths.reduce((sum, width) => sum + width, 0) + spaceWidth * (words.length - 1);
  // Justify like the surrounding paragraph lines by widening the word gaps.
  const extraPerGap = Math.min(
    WORD_SPACE_MAX_STRETCH,
    Math.max(0, (availableWidth - naturalWidth) / (words.length - 1)),
  );

  coverArea(page, line.startX - 1, line.rightMargin + 1, line.top, line.bottom);

  let x = line.startX;
  words.forEach((word, index) => {
    page.drawText(word, { x, y: PAGE_HEIGHT - line.baseline, size: fontSize, font, color: rgb(0, 0, 0) });
    x += wordWidths[index] + spaceWidth + extraPerGap;
  });
}

function drawSignatureName(page: PDFPage, font: PDFFont, companyName: string): void {
  const block = PAGE_10_SIGNATURE_NAME;
  const name = truncateToFit(font, companyName, '', block.maxWidth);
  coverArea(page, block.x - 1, block.x + block.maxWidth, block.top, block.bottom);
  page.drawText(name, {
    x: block.x,
    y: PAGE_HEIGHT - block.baseline,
    size: fitFontSize(font, name, block.maxWidth),
    font,
    color: rgb(0, 0, 0),
  });
}

/** Signs page 10's Subcontractor block: the signature on "By:" and the date on "Dated:". */
function drawSignatureBlock(
  page: PDFPage,
  textFont: PDFFont,
  signatureFont: PDFFont,
  signature: AgreementSignature,
): void {
  const { signature: sigLine, date } = PAGE_10_SIGNATURE_LINES;
  const lineWidth = sigLine.endX - sigLine.startX - 8;
  const fullWidth = signatureFont.widthOfTextAtSize(signature.name, sigLine.fontSize);
  const fontSize = fullWidth <= lineWidth ? sigLine.fontSize : (sigLine.fontSize * lineWidth) / fullWidth;
  page.drawText(signature.name, {
    x: sigLine.startX + 6,
    y: PAGE_HEIGHT - sigLine.baseline,
    size: fontSize,
    font: signatureFont,
    color: INK_BLUE,
  });
  page.drawText(formatDateForAgreement(signature.date), {
    x: date.x,
    y: PAGE_HEIGHT - date.baseline,
    size: FONT_SIZE,
    font: textFont,
    color: rgb(0, 0, 0),
  });
}

/**
 * Writes the Master Subcontract Agreement, with the Step 2 company name filled
 * in on page 1 and in the page 10 signature block — plus, once the user has
 * signed, their initials at the bottom of every page and their signature and
 * the signing date on page 10 — to the cache directory and returns its path.
 * Nothing else on the agreement is changed.
 *
 * Each call writes a new file: the PDF viewer may still be reading the
 * previous one, and overwriting a file it has open crashes its native
 * renderer. Delete superseded files with deleteMasterSubcontractAgreement.
 */
export async function generateMasterSubcontractAgreement(
  companyName: string,
  signature?: AgreementSignature,
): Promise<string> {
  const pdfDoc = await PDFDocument.load(MASTER_SUBCONTRACT_AGREEMENT_PDF_BASE64);
  pdfDoc.registerFontkit(fontkit);
  const pages = pdfDoc.getPages();
  const regularFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const name = companyName.trim().replace(/\s+/g, ' ');

  drawNameLine(pages[PAGE_1_NAME_LINE.pageIndex], regularFont, name);
  drawSignatureName(pages[PAGE_10_SIGNATURE_NAME.pageIndex], boldFont, name);

  if (signature?.name && signature.initials) {
    const signatureFont = await pdfDoc.embedFont(await readSignatureFont(signature.fontId), { subset: true });
    pages.forEach((page) => drawPageInitials(page, regularFont, signatureFont, signature.initials));
    drawSignatureBlock(pages[PAGE_10_SIGNATURE_LINES.pageIndex], regularFont, signatureFont, signature);
  }

  const outputPath = `${RNFS.CachesDirectoryPath}/${OUTPUT_FILE_PREFIX}-${Date.now()}.pdf`;
  await RNFS.writeFile(outputPath, await pdfDoc.saveAsBase64(), 'base64');
  return outputPath;
}

/** Deletes a generated agreement file that's no longer shown; failures are ignored (it's only cache). */
export function deleteMasterSubcontractAgreement(path: string): void {
  RNFS.unlink(path).catch(() => undefined);
}
