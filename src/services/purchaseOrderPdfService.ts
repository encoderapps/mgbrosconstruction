import { PDFDocument, PDFFont, PDFPage, RGB, StandardFonts, rgb } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
import RNFS from 'react-native-fs';
import { MG_BROS_LOGO_PNG_BASE64 } from '../assets/pdf/mgBrosLogoPng';
import { EMPTY_VALUE } from '../constants/display';
import {
  GENERAL_CONTRACTOR,
  PO_SCOPE_HEADING,
  PO_SPECIAL_INSTRUCTIONS,
  PO_STANDARD_TERMS,
} from '../constants/purchaseOrderDocument';
import { PurchaseOrderDetail, PurchaseOrderSignature } from '../types/purchaseOrder';
import { formatCurrency } from '../utils/formatCurrency';
import { formatUsDate } from '../utils/formatDate';
import { formatPercentage } from '../utils/paymentTerms';
import { groupLineItemsByCategory } from '../utils/purchaseOrderLineItems';
import { readSignatureFontBase64 } from '../utils/signatureFontFile';

/*
 * Builds the selected purchase order as a real PDF, laid out like MG Bros'
 * printed PO, for the signing screen's PDF viewer. Positions are measured from
 * the top of the page (`top`) and flipped to pdf-lib's bottom-up y when drawn.
 */

/** The subcontractor the PO is issued to. */
export interface PurchaseOrderVendor {
  name: string;
  address: string;
}


// US Letter, in points.
const PAGE_WIDTH = 612;
const PAGE_HEIGHT = 792;
const MARGIN = 40;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;

const FONT_SIZE = 9;
const SMALL_FONT_SIZE = 8;
const LINE_HEIGHT_RATIO = 1.3;
const CELL_PADDING = 4;

const LOGO_WIDTH = 220;
const COLUMN_GAP = 12;
const TABLE_ITEM_WIDTH = 110;
const TABLE_AMOUNT_WIDTH = 90;
const TABLE_DESCRIPTION_WIDTH = CONTENT_WIDTH - TABLE_ITEM_WIDTH - TABLE_AMOUNT_WIDTH;
const TERM_PERCENT_WIDTH = 44;
const CONTRACT_AMOUNT_WIDTH = 140;

const SIGNATURE_LINE_WIDTH = 280;
const SIGNATURE_MAX_FONT_SIZE = 24;
const DATE_LINE_WIDTH = 100;
/** Enough room to keep "accepted by" and both signature blocks on one page. */
const ACCEPTANCE_HEIGHT = 150;

const OUTPUT_FILE_PREFIX = 'MG-Bros-Purchase-Order';

function hexColor(hex: string): RGB {
  const channel = (start: number): number => parseInt(hex.slice(start, start + 2), 16) / 255;
  return rgb(channel(1), channel(3), channel(5));
}

// Print palette, matching MG Bros' purchase order template.
const COLORS = {
  ink: hexColor('#1F1F1F'),
  brand: hexColor('#84726C'),
  muted: hexColor('#757575'),
  rule: hexColor('#9E9E9E'),
  tableHeader: hexColor('#7FA5A7'),
  sectionHeader: hexColor('#D9E7E8'),
  noticeBackground: hexColor('#FCE9E4'),
  noticeText: hexColor('#C62828'),
  amountBackground: hexColor('#EEEEEE'),
  link: hexColor('#1A57C6'),
  white: rgb(1, 1, 1),
  signatureInk: rgb(0.05, 0.1, 0.35), // like a pen signature
};

const lineHeight = (size: number): number => size * LINE_HEIGHT_RATIO;

type TextOptions = {
  font?: PDFFont;
  size?: number;
  color?: RGB;
  align?: 'left' | 'center' | 'right';
  /** The box `align` is relative to (from `x`). */
  width?: number;
};

const characterSets = new WeakMap<PDFFont, Set<number>>();

/**
 * Replaces characters the font can't encode (the standard PDF fonts only cover
 * WinAnsi) so free text from Salesforce can't make pdf-lib throw.
 */
function toEncodable(font: PDFFont, text: string): string {
  let characterSet = characterSets.get(font);
  if (!characterSet) {
    characterSet = new Set(font.getCharacterSet());
    characterSets.set(font, characterSet);
  }
  const supported = characterSet;
  return (
    Array.from(text.replace(/[\t\r]/g, ' '))
      // Line breaks are kept for wrapText to split on.
      .map((character) => (character === '\n' || supported.has(character.codePointAt(0) ?? 0) ? character : '?'))
      .join('')
  );
}

/** Splits text into lines no wider than `maxWidth`, honouring line breaks and breaking over-long words. */
export function wrapText(font: PDFFont, text: string, size: number, maxWidth: number): string[] {
  const fits = (value: string): boolean => font.widthOfTextAtSize(value, size) <= maxWidth;
  const lines: string[] = [];

  toEncodable(font, text)
    .split('\n')
    .forEach((paragraph) => {
      let line = '';
      paragraph
        .split(' ')
        .filter(Boolean)
        .forEach((word) => {
          const candidate = line ? `${line} ${word}` : word;
          if (fits(candidate)) {
            line = candidate;
            return;
          }
          if (line) {
            lines.push(line);
          }
          // A word wider than the whole line is broken by character.
          line = '';
          for (const character of Array.from(word)) {
            if (line && !fits(line + character)) {
              lines.push(line);
              line = '';
            }
            line += character;
          }
        });
      lines.push(line);
    });

  return lines;
}

/** Largest size, up to `maxSize`, at which `text` fits in `maxWidth`. */
function fitFontSize(font: PDFFont, text: string, maxSize: number, maxWidth: number): number {
  const width = font.widthOfTextAtSize(text, maxSize);
  return width <= maxWidth ? maxSize : Math.max(8, (maxSize * maxWidth) / width);
}

interface PurchaseOrderFonts {
  regular: PDFFont;
  bold: PDFFont;
  boldItalic: PDFFont;
}

/** Draws top-down on the current page and starts a new page when content doesn't fit. */
class PageWriter {
  private page: PDFPage;
  /** Distance from the top of the page to the next free space. */
  top = MARGIN;

  constructor(private readonly doc: PDFDocument, readonly fonts: PurchaseOrderFonts) {
    this.page = doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  }

  get currentPage(): PDFPage {
    return this.page;
  }

  /** Starts a new page if `height` doesn't fit on this one; returns whether it did. */
  ensureSpace(height: number): boolean {
    if (this.top + height <= PAGE_HEIGHT - MARGIN) {
      return false;
    }
    this.page = this.doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
    this.top = MARGIN;
    return true;
  }

  /** One line of text whose top is at `top`. */
  text(value: string, x: number, top: number, options: TextOptions = {}): void {
    const { font = this.fonts.regular, size = FONT_SIZE, color = COLORS.ink, align = 'left', width = 0 } = options;
    const text = toEncodable(font, value);
    const textWidth = font.widthOfTextAtSize(text, size);
    const left = align === 'right' ? x + width - textWidth : align === 'center' ? x + (width - textWidth) / 2 : x;
    // The baseline sits about 0.8 em below the top of the line.
    this.page.drawText(text, { x: left, y: PAGE_HEIGHT - top - size * 0.8, size, font, color });
  }

  /** Several lines, one under the other, starting at `top`; returns their height. */
  lines(lines: string[], x: number, top: number, options: TextOptions = {}): number {
    const size = options.size ?? FONT_SIZE;
    lines.forEach((line, index) => this.text(line, x, top + index * lineHeight(size), options));
    return lines.length * lineHeight(size);
  }

  rect(x: number, top: number, width: number, height: number, fill?: RGB, border?: RGB): void {
    this.page.drawRectangle({
      x,
      y: PAGE_HEIGHT - top - height,
      width,
      height,
      color: fill,
      borderColor: border,
      borderWidth: border ? 0.5 : 0,
    });
  }

  rule(x: number, width: number, top: number, color = COLORS.rule, thickness = 0.5): void {
    const y = PAGE_HEIGHT - top;
    this.page.drawLine({ start: { x, y }, end: { x: x + width, y }, thickness, color });
  }
}

async function drawHeader(writer: PageWriter, doc: PDFDocument, purchaseOrder: PurchaseOrderDetail): Promise<void> {
  const logo = await doc.embedPng(MG_BROS_LOGO_PNG_BASE64);
  const logoHeight = (logo.height / logo.width) * LOGO_WIDTH;
  writer.currentPage.drawImage(logo, {
    x: (PAGE_WIDTH - LOGO_WIDTH) / 2,
    y: PAGE_HEIGHT - writer.top - logoHeight,
    width: LOGO_WIDTH,
    height: logoHeight,
  });
  writer.top += logoHeight + 4;
  writer.text('PURCHASE ORDER', MARGIN, writer.top, {
    size: 16,
    color: COLORS.brand,
    align: 'center',
    width: CONTENT_WIDTH,
  });
  writer.top += 24;

  // "Date : [08/21/2026]" over "Job-PO # : [Job-PO#0001115]", right-aligned. An unknown date
  // leaves its box empty, like an unfilled form.
  drawLabelledBox(writer, 'Date :', purchaseOrder.poDate ? formatUsDate(purchaseOrder.poDate) : '');
  writer.top += 16;
  drawLabelledBox(writer, 'Job-PO # :', purchaseOrder.name || EMPTY_VALUE);
  writer.top += 26;
}

/** A right-aligned "Label : [value]" box, as in the printed PO's top-right corner. */
function drawLabelledBox(writer: PageWriter, label: string, value: string): void {
  const boxWidth = 110;
  const boxLeft = PAGE_WIDTH - MARGIN - boxWidth;
  writer.text(label, MARGIN, writer.top + 2, {
    font: writer.fonts.bold,
    align: 'right',
    width: boxLeft - MARGIN - 6,
  });
  writer.rect(boxLeft, writer.top, boxWidth, 14, undefined, COLORS.rule);
  writer.text(value, boxLeft, writer.top + 2, { align: 'center', width: boxWidth });
}

function drawParties(writer: PageWriter, purchaseOrder: PurchaseOrderDetail, vendor: PurchaseOrderVendor): void {
  const columnWidth = (CONTENT_WIDTH - COLUMN_GAP * 2) / 3;
  const { regular, bold } = writer.fonts;
  const wrap = (lines: string[]): string[] =>
    lines.flatMap((line) => wrapText(regular, line, FONT_SIZE, columnWidth));

  const columns: { title: string; lines: string[]; link?: string }[] = [
    { title: 'Job Address:', lines: wrap([purchaseOrder.projectAddress || EMPTY_VALUE]) },
    { title: 'Vendor:', lines: wrap([vendor.name || EMPTY_VALUE, vendor.address].filter(Boolean)) },
    {
      title: 'General Contractor:',
      lines: wrap([GENERAL_CONTRACTOR.name, ...GENERAL_CONTRACTOR.addressLines, GENERAL_CONTRACTOR.phone]),
      link: GENERAL_CONTRACTOR.website,
    },
  ];

  let tallest = 0;
  columns.forEach((column, index) => {
    const x = MARGIN + index * (columnWidth + COLUMN_GAP);
    let top = writer.top;
    writer.text(column.title, x, top, { font: bold });
    top += lineHeight(FONT_SIZE);
    top += writer.lines(column.lines, x, top);
    if (column.link) {
      writer.text(column.link, x, top, { color: COLORS.link });
      top += lineHeight(FONT_SIZE);
    }
    tallest = Math.max(tallest, top - writer.top);
  });
  writer.top += tallest + 14;
}

function drawLineItemsHeader(writer: PageWriter): void {
  const height = 15;
  writer.rect(MARGIN, writer.top, CONTENT_WIDTH, height, COLORS.tableHeader);
  const headerText = { font: writer.fonts.bold, size: SMALL_FONT_SIZE, color: COLORS.white, align: 'center' as const };
  writer.text('ITEM', MARGIN, writer.top + 4, { ...headerText, width: TABLE_ITEM_WIDTH });
  writer.text('DESCRIPTION', MARGIN + TABLE_ITEM_WIDTH, writer.top + 4, {
    ...headerText,
    width: TABLE_DESCRIPTION_WIDTH,
  });
  writer.text('AMOUNT', MARGIN + TABLE_ITEM_WIDTH + TABLE_DESCRIPTION_WIDTH, writer.top + 4, {
    ...headerText,
    width: TABLE_AMOUNT_WIDTH,
  });
  writer.top += height;
}

function drawLineItems(writer: PageWriter, purchaseOrder: PurchaseOrderDetail): void {
  const { regular, bold } = writer.fonts;
  const descriptionX = MARGIN + TABLE_ITEM_WIDTH;
  const amountX = descriptionX + TABLE_DESCRIPTION_WIDTH;

  writer.ensureSpace(60);
  writer.rect(MARGIN, writer.top, CONTENT_WIDTH, 6, COLORS.tableHeader);
  writer.top += 9;
  writer.text(PO_SCOPE_HEADING, MARGIN, writer.top, { size: SMALL_FONT_SIZE, align: 'center', width: CONTENT_WIDTH });
  writer.top += 13;
  drawLineItemsHeader(writer);

  const drawRow = (item: string[], description: string[], amount: string, descriptionColor = COLORS.ink): void => {
    const height = Math.max(item.length, description.length, 1) * lineHeight(FONT_SIZE) + CELL_PADDING;
    if (writer.ensureSpace(height)) {
      // Repeat the column headings at the top of a new page.
      drawLineItemsHeader(writer);
    }
    const top = writer.top + CELL_PADDING / 2;
    writer.lines(item, MARGIN + CELL_PADDING, top);
    writer.lines(description, descriptionX + CELL_PADDING, top, { color: descriptionColor });
    writer.text(amount, amountX, top, { align: 'right', width: TABLE_AMOUNT_WIDTH - CELL_PADDING });
    writer.top += height;
    writer.rule(MARGIN, CONTENT_WIDTH, writer.top);
  };

  if (purchaseOrder.lineItems.length === 0) {
    drawRow([EMPTY_VALUE], ['No line items listed'], '', COLORS.muted);
  } else {
    const descriptionWidth = TABLE_DESCRIPTION_WIDTH - CELL_PADDING * 2;
    groupLineItemsByCategory(purchaseOrder.lineItems).forEach((group) => {
      group.items.forEach((item, index) => {
        // Like the printed PO, the category (ITEM) is shown once, beside its first line.
        const category =
          index === 0 ? wrapText(regular, group.category || 'Other', FONT_SIZE, TABLE_ITEM_WIDTH - CELL_PADDING * 2) : [];
        drawRow(
          category,
          wrapText(regular, item.description || EMPTY_VALUE, FONT_SIZE, descriptionWidth),
          formatCurrency(item.amount, true),
        );
      });
    });
  }

  writer.ensureSpace(18);
  writer.text('TOTAL', descriptionX, writer.top + 4, {
    font: bold,
    align: 'right',
    width: TABLE_DESCRIPTION_WIDTH - CELL_PADDING,
  });
  writer.text(formatCurrency(purchaseOrder.totalAmount, true), amountX, writer.top + 4, {
    font: bold,
    align: 'right',
    width: TABLE_AMOUNT_WIDTH - CELL_PADDING,
  });
  writer.top += 22;
}

function drawPaymentTerms(writer: PageWriter, purchaseOrder: PurchaseOrderDetail): void {
  const { regular, bold } = writer.fonts;
  const percentX = MARGIN + 12;
  const descriptionX = percentX + TERM_PERCENT_WIDTH;
  const amountX = MARGIN + CONTENT_WIDTH - TABLE_AMOUNT_WIDTH;
  const descriptionWidth = amountX - descriptionX - CELL_PADDING;

  writer.ensureSpace(40);
  writer.rect(MARGIN, writer.top, CONTENT_WIDTH, 14, COLORS.sectionHeader);
  writer.text('PAYMENT TERMS', MARGIN + CELL_PADDING, writer.top + 3, { font: bold, size: SMALL_FONT_SIZE });
  writer.top += 18;

  if (purchaseOrder.paymentTerms.length === 0) {
    writer.text('No payment terms listed', percentX, writer.top, { color: COLORS.muted });
    writer.top += lineHeight(FONT_SIZE);
  }
  purchaseOrder.paymentTerms.forEach((term) => {
    const description = wrapText(regular, term.description || EMPTY_VALUE, FONT_SIZE, descriptionWidth);
    const height = description.length * lineHeight(FONT_SIZE);
    writer.ensureSpace(height);
    writer.text(term.percentage === null ? EMPTY_VALUE : formatPercentage(term.percentage), percentX, writer.top);
    writer.lines(description, descriptionX, writer.top);
    writer.text(term.amount === null ? EMPTY_VALUE : formatCurrency(term.amount, true), amountX, writer.top, {
      align: 'right',
      width: TABLE_AMOUNT_WIDTH - CELL_PADDING,
    });
    writer.top += height + 2;
  });
  writer.top += 12;
}

function drawSpecialInstructions(writer: PageWriter, purchaseOrder: PurchaseOrderDetail): void {
  const { bold } = writer.fonts;
  const noticeWidth = CONTENT_WIDTH - CONTRACT_AMOUNT_WIDTH - COLUMN_GAP;
  const noticeLines = wrapText(bold, PO_SPECIAL_INSTRUCTIONS, SMALL_FONT_SIZE, noticeWidth - 12);
  const noticeHeight = noticeLines.length * lineHeight(SMALL_FONT_SIZE) + 10;

  writer.ensureSpace(noticeHeight + 24);
  writer.text('Other Comments or Special Instructions', MARGIN, writer.top, { font: bold, size: SMALL_FONT_SIZE });
  writer.top += 12;
  writer.rule(MARGIN, CONTENT_WIDTH, writer.top);
  writer.top += 6;

  writer.rect(MARGIN, writer.top, noticeWidth, noticeHeight, COLORS.noticeBackground, COLORS.noticeText);
  writer.lines(noticeLines, MARGIN, writer.top + 5, {
    font: bold,
    size: SMALL_FONT_SIZE,
    color: COLORS.noticeText,
    align: 'center',
    width: noticeWidth,
  });

  const amountX = MARGIN + noticeWidth + COLUMN_GAP;
  const amountTop = writer.top + noticeHeight / 2 - 14;
  writer.text('CONTRACT AMOUNT', amountX, amountTop, {
    font: bold,
    size: SMALL_FONT_SIZE,
    align: 'right',
    width: CONTRACT_AMOUNT_WIDTH,
  });
  writer.rect(amountX, amountTop + 13, CONTRACT_AMOUNT_WIDTH, 15, COLORS.amountBackground, COLORS.rule);
  writer.text(formatCurrency(purchaseOrder.totalAmount, true), amountX, amountTop + 16, {
    font: bold,
    align: 'right',
    width: CONTRACT_AMOUNT_WIDTH - CELL_PADDING,
  });
  writer.top += noticeHeight + 14;
}

function drawStandardTerms(writer: PageWriter): void {
  PO_STANDARD_TERMS.forEach((term) => {
    wrapText(writer.fonts.regular, term, SMALL_FONT_SIZE, CONTENT_WIDTH).forEach((line) => {
      writer.ensureSpace(lineHeight(SMALL_FONT_SIZE));
      writer.text(line, MARGIN, writer.top, { size: SMALL_FONT_SIZE });
      writer.top += lineHeight(SMALL_FONT_SIZE);
    });
  });
  writer.top += 14;
}

function drawSignatureBlock(
  writer: PageWriter,
  label: string,
  signerName?: string,
  signature?: { text: string; font: PDFFont; date: string },
): void {
  const lineX = MARGIN + 12;
  const dateLabelX = lineX + SIGNATURE_LINE_WIDTH + 30;
  const dateLineX = dateLabelX + 28;

  writer.top += 34; // room for the handwritten signature above the line
  if (signature) {
    const size = fitFontSize(signature.font, signature.text, SIGNATURE_MAX_FONT_SIZE, SIGNATURE_LINE_WIDTH - 16);
    writer.currentPage.drawText(signature.text, {
      x: lineX + 8,
      y: PAGE_HEIGHT - writer.top + 4,
      size,
      font: signature.font,
      color: COLORS.signatureInk,
    });
    writer.text(signature.date, dateLineX, writer.top - 13, { align: 'center', width: DATE_LINE_WIDTH });
  }
  writer.rule(lineX, SIGNATURE_LINE_WIDTH, writer.top, COLORS.ink);
  writer.text('Date', dateLabelX, writer.top - 9);
  writer.rule(dateLineX, DATE_LINE_WIDTH, writer.top, COLORS.ink);
  writer.top += 4;
  writer.text(label, lineX, writer.top);
  writer.top += lineHeight(FONT_SIZE);
  if (signerName) {
    writer.top += 4;
    writer.text(signerName, lineX, writer.top);
    writer.top += lineHeight(FONT_SIZE);
  }
}

function drawPageNumbers(doc: PDFDocument, font: PDFFont): void {
  const pages = doc.getPages();
  pages.forEach((page, index) => {
    const label = `Page ${index + 1} of ${pages.length}`;
    page.drawText(label, {
      x: (PAGE_WIDTH - font.widthOfTextAtSize(label, 7)) / 2,
      y: MARGIN / 2,
      size: 7,
      font,
      color: COLORS.muted,
    });
  });
}

/**
 * Writes the purchase order as a PDF in the cache directory and returns its
 * path. With `signature`, the vendor's signature and signing date are filled
 * in. Each call writes a new file (the viewer can't have its open file
 * replaced), so delete old ones with deletePurchaseOrderPdf.
 */
export async function generatePurchaseOrderPdf(
  purchaseOrder: PurchaseOrderDetail,
  vendor: PurchaseOrderVendor,
  signature?: PurchaseOrderSignature,
): Promise<string> {
  const doc = await PDFDocument.create();
  doc.setTitle(`Purchase Order ${purchaseOrder.name}`);
  doc.setAuthor(GENERAL_CONTRACTOR.name);
  const fonts: PurchaseOrderFonts = {
    regular: await doc.embedFont(StandardFonts.Helvetica),
    bold: await doc.embedFont(StandardFonts.HelveticaBold),
    boldItalic: await doc.embedFont(StandardFonts.HelveticaBoldOblique),
  };
  let vendorSignature: { text: string; font: PDFFont; date: string } | undefined;
  if (signature?.name) {
    doc.registerFontkit(fontkit);
    const font = await doc.embedFont(await readSignatureFontBase64(signature.fontId), { subset: true });
    vendorSignature = { text: toEncodable(font, signature.name), font, date: formatUsDate(signature.date) };
  }

  const writer = new PageWriter(doc, fonts);
  await drawHeader(writer, doc, purchaseOrder);
  drawParties(writer, purchaseOrder, vendor);
  drawLineItems(writer, purchaseOrder);
  drawPaymentTerms(writer, purchaseOrder);
  drawSpecialInstructions(writer, purchaseOrder);
  drawStandardTerms(writer);

  writer.ensureSpace(ACCEPTANCE_HEIGHT);
  writer.text('This Purchase Order is accepted by:', MARGIN, writer.top);
  writer.top += lineHeight(FONT_SIZE);
  drawSignatureBlock(writer, 'Vendor:', undefined, vendorSignature);
  drawSignatureBlock(writer, 'General Contractor:', GENERAL_CONTRACTOR.name);
  writer.top += 18;
  writer.text('Thank You For Your Business!', MARGIN, writer.top, {
    font: fonts.boldItalic,
    align: 'center',
    width: CONTENT_WIDTH,
  });
  drawPageNumbers(doc, fonts.regular);

  // The PO name can contain "#", which would end a file:// URI, so keep the file name to safe characters.
  const safeName = purchaseOrder.name.replace(/[^A-Za-z0-9-]+/g, '-') || 'PO';
  const outputPath = `${RNFS.CachesDirectoryPath}/${OUTPUT_FILE_PREFIX}-${safeName}-${Date.now()}.pdf`;
  await RNFS.writeFile(outputPath, await doc.saveAsBase64(), 'base64');
  return outputPath;
}

export function deletePurchaseOrderPdf(path: string): void {
  RNFS.unlink(path).catch(() => undefined);
}
