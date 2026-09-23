import { ACORD_CERTIFICATE_TEMPLATE_BASE64 } from '../assets/pdf/acordCertificateTemplate';
import { GL_PDF_FIELDS } from '../constants/glPdfFields';
import {
  generateInsuranceCertificateTemplate,
  InsuranceTemplateFields,
} from './insuranceCertificateTemplateService';

export type GLTemplateFields = InsuranceTemplateFields;

export async function generateGLTemplate(fields: GLTemplateFields): Promise<string> {
  return generateInsuranceCertificateTemplate(
    ACORD_CERTIFICATE_TEMPLATE_BASE64,
    GL_PDF_FIELDS,
    fields,
    'MG-Bros-General-Liability-COI.pdf',
  );
}
