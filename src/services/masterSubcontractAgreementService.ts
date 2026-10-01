import { PDFDocument, PDFFont, PDFPage, StandardFonts, rgb } from 'pdf-lib';
import RNFS from 'react-native-fs';
import { MASTER_SUBCONTRACT_AGREEMENT_PDF_BASE64 } from '../assets/pdf/masterSubcontractAgreementPdf';

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

const OUTPUT_FILE_NAME = 'MG-Bros-Master-Subcontract-Agreement.pdf';

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

/**
 * Writes the Master Subcontract Agreement, with the Step 2 company name filled
 * in on page 1 and in the page 10 signature block, to the cache directory and
 * returns its path. Nothing else on the agreement is changed.
 */
export async function generateMasterSubcontractAgreement(companyName: string): Promise<string> {
  const pdfDoc = await PDFDocument.load(MASTER_SUBCONTRACT_AGREEMENT_PDF_BASE64);
  const pages = pdfDoc.getPages();
  const regularFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const name = companyName.trim().replace(/\s+/g, ' ');

  drawNameLine(pages[PAGE_1_NAME_LINE.pageIndex], regularFont, name);
  drawSignatureName(pages[PAGE_10_SIGNATURE_NAME.pageIndex], boldFont, name);

  const outputPath = `${RNFS.CachesDirectoryPath}/${OUTPUT_FILE_NAME}`;
  await RNFS.writeFile(outputPath, await pdfDoc.saveAsBase64(), 'base64');
  return outputPath;
}
