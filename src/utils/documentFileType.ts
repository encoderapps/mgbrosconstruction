/** The kinds of file a document can be: a PDF, or a photo or scan uploaded as a JPG or PNG. */
export interface DocumentFileType {
  extension: 'pdf' | 'jpg' | 'png';
  mimeType: string;
  /** Shown as a picture rather than in the PDF viewer. */
  isImage: boolean;
}

const PDF: DocumentFileType = { extension: 'pdf', mimeType: 'application/pdf', isImage: false };
const JPG: DocumentFileType = { extension: 'jpg', mimeType: 'image/jpeg', isImage: true };
const PNG: DocumentFileType = { extension: 'png', mimeType: 'image/png', isImage: true };

/**
 * What a document's file really is, from its first bytes (base64): a JPG
 * starts "/9j/" and a PNG "iVBORw0KGgo"; anything else is taken as a PDF. Its
 * name can't be trusted: the server may call an uploaded JPG "….pdf".
 */
export function detectDocumentFileType(contentBase64: string): DocumentFileType {
  const start = contentBase64.trimStart();
  if (start.startsWith('/9j/')) {
    return JPG;
  }
  if (start.startsWith('iVBORw0KGgo')) {
    return PNG;
  }
  return PDF;
}

/** The type of a file the app wrote (writeDocumentToCache names it with the right extension). */
export function documentFileTypeFromPath(path: string): DocumentFileType {
  const extension = path.split('.').pop()?.toLowerCase();
  if (extension === 'jpg' || extension === 'jpeg') {
    return JPG;
  }
  return extension === 'png' ? PNG : PDF;
}
