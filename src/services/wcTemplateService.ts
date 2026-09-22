import { ACORD_CERTIFICATE_TEMPLATE_BASE64 } from '../assets/pdf/acordCertificateTemplate';
import { WC_PDF_FIELDS } from '../constants/wcPdfFields';
import {
  generateInsuranceCertificateTemplate,
  InsuranceTemplateFields,
} from './insuranceCertificateTemplateService';

export type WCTemplateFields = InsuranceTemplateFields;

export async function generateWCTemplate(fields: WCTemplateFields): Promise<string> {
  return generateInsuranceCertificateTemplate(
    ACORD_CERTIFICATE_TEMPLATE_BASE64,
    WC_PDF_FIELDS,
    fields,
    'MG-Bros-Workers-Comp-COI.pdf',
  );
}
