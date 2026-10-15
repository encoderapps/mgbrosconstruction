import { PDFDocument, PDFFont, PDFPage, StandardFonts, rgb } from 'pdf-lib';
import { EMPTY_VALUE } from '../constants/display';
import { GENERAL_CONTRACTOR } from '../constants/purchaseOrderDocument';
import { SubcontractorCompanyProfile } from '../types/company';
import { AchInfo } from '../types/paymentSettings';
import { formatDateTime } from '../utils/formatDate';
import { formatPhoneNumber } from '../utils/formatPhoneNumber';
import { wrapText } from './purchaseOrderPdfService';

// US Letter, in points.
const PAGE_WIDTH = 612;
const PAGE_HEIGHT = 792;
const MARGIN = 54;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;
const LABEL_WIDTH = 150;
const TEXT_SIZE = 10;
const LINE_GAP = 6;
const TEXT_COLOR = rgb(0.13, 0.11, 0.1);
const MUTED_COLOR = rgb(0.42, 0.38, 0.36);
const RULE_COLOR = rgb(0.8, 0.77, 0.73);

/** Draws top-down: `top` is the distance from the top of the page. */
class AchPageWriter {
  top = MARGIN;

  constructor(
    private readonly page: PDFPage,
    private readonly regular: PDFFont,
    private readonly bold: PDFFont,
  ) {}

  text(text: string, x: number, options: { font?: PDFFont; size?: number; color?: typeof TEXT_COLOR } = {}): void {
    const size = options.size ?? TEXT_SIZE;
    this.page.drawText(text, {
      x,
      y: PAGE_HEIGHT - this.top - size,
      size,
      font: options.font ?? this.regular,
      color: options.color ?? TEXT_COLOR,
    });
  }

  centered(text: string, size: number): void {
    const width = this.bold.widthOfTextAtSize(text, size);
    this.text(text, (PAGE_WIDTH - width) / 2, { font: this.bold, size });
    this.top += size + LINE_GAP;
  }

  rule(fromX = MARGIN, width = CONTENT_WIDTH): void {
    const y = PAGE_HEIGHT - this.top;
    this.page.drawLine({ start: { x: fromX, y }, end: { x: fromX + width, y }, thickness: 0.75, color: RULE_COLOR });
  }

  section(title: string): void {
    this.top += 14;
    this.text(title, MARGIN, { font: this.bold, size: 11 });
    this.top += 11 + 4;
    this.rule();
    this.top += 8;
  }

  /** A label and its value, the value wrapping under itself if long. */
  row(label: string, value: string): void {
    this.text(`${label}:`, MARGIN, { color: MUTED_COLOR });
    const lines = wrapText(this.regular, value || EMPTY_VALUE, TEXT_SIZE, CONTENT_WIDTH - LABEL_WIDTH);
    lines.forEach((line, index) => {
      if (index > 0) {
        this.top += TEXT_SIZE + 2;
      }
      this.text(line, MARGIN + LABEL_WIDTH);
    });
    this.top += TEXT_SIZE + LINE_GAP;
  }

  paragraph(text: string, size: number, color = TEXT_COLOR): void {
    wrapText(this.regular, text, size, CONTENT_WIDTH).forEach((line) => {
      this.text(line, MARGIN, { size, color });
      this.top += size + 3;
    });
  }

  /** A labelled blank line to sign or write on by hand. */
  blankLine(label: string, x: number, width: number): void {
    this.text(label, x, { font: this.bold });
    const lineTop = this.top + TEXT_SIZE + 26;
    const y = PAGE_HEIGHT - lineTop;
    this.page.drawLine({ start: { x, y }, end: { x: x + width, y }, thickness: 0.75, color: TEXT_COLOR });
  }
}

export interface AchFormContent {
  company: SubcontractorCompanyProfile;
  ach: AchInfo;
}

/**
 * The ACH authorization form for the company's bank account, as a one-page
 * PDF (base64). Signature, printed name and date are left blank to fill in by
 * hand after printing: the app doesn't know who signs for the company.
 */
export async function generateAchFormPdf({ company, ach }: AchFormContent): Promise<string> {
  const doc = await PDFDocument.create();
  doc.setTitle(`ACH Authorization Form - ${company.name}`);
  doc.setAuthor(GENERAL_CONTRACTOR.name);
  const page = doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  const writer = new AchPageWriter(
    page,
    await doc.embedFont(StandardFonts.Helvetica),
    await doc.embedFont(StandardFonts.HelveticaBold),
  );

  writer.centered('AUTOMATED CLEARING HOUSE (ACH)', 15);
  writer.centered('AUTHORIZATION FORM', 15);

  writer.section('COMPANY INFORMATION');
  writer.row('Company Name', company.name);
  writer.row('Address', company.address);
  writer.row('Contact Name', '');
  writer.row('Phone', company.phone ? formatPhoneNumber(company.phone) : '');
  writer.row('Email', company.email);

  writer.section('BANK ACCOUNT INFORMATION');
  writer.row('Bank Name', ach.bankName);
  writer.row('Name on Account', ach.accountHolderName);
  writer.row('Account Type', ach.accountType);
  writer.row('Account Number', ach.accountNumber);
  writer.row('Routing Number', ach.routingNumber);

  writer.top += 14;
  writer.paragraph(
    `I (we) hereby authorize ${GENERAL_CONTRACTOR.name} to initiate ACH credits and/or debits to the bank ` +
      'account listed above. This authorization remains in effect until revoked in writing.',
    9,
  );

  writer.top += 24;
  const columnGap = 36;
  const signatureWidth = CONTENT_WIDTH * 0.6;
  writer.blankLine('Authorized Signature:', MARGIN, signatureWidth);
  writer.blankLine('Date:', MARGIN + signatureWidth + columnGap, CONTENT_WIDTH - signatureWidth - columnGap);
  writer.top += TEXT_SIZE + 44;
  writer.blankLine('Printed Name:', MARGIN, signatureWidth);
  writer.top += TEXT_SIZE + 44;
  writer.text(`Generated on: ${formatDateTime(ach.generatedAt)}`, MARGIN, { size: 8, color: MUTED_COLOR });

  return doc.saveAsBase64();
}

/** "ACH Form - High Tech Air Inc.pdf". */
export function achFormFileName(companyName: string): string {
  return `ACH Form - ${companyName || 'Company'}.pdf`;
}
