import { detectDocumentFileType, documentFileTypeFromPath } from '../src/utils/documentFileType';

describe('detectDocumentFileType', () => {
  it('tells a JPG and a PNG from their first bytes, and takes anything else as a PDF', () => {
    expect(detectDocumentFileType('/9j/4AAQSkZJRgABAQAAAQABAAD')).toMatchObject({
      extension: 'jpg',
      mimeType: 'image/jpeg',
      isImage: true,
    });
    expect(detectDocumentFileType('iVBORw0KGgoAAAANSUhEUg')).toMatchObject({ extension: 'png', isImage: true });
    expect(detectDocumentFileType('JVBERi0xLjQK')).toMatchObject({
      extension: 'pdf',
      mimeType: 'application/pdf',
      isImage: false,
    });
    expect(detectDocumentFileType('')).toMatchObject({ extension: 'pdf' });
  });
});

describe('documentFileTypeFromPath', () => {
  it('reads the type from the cached file’s extension', () => {
    expect(documentFileTypeFromPath('/cache/documents/W9 - ABC.jpg')).toMatchObject({ extension: 'jpg', isImage: true });
    expect(documentFileTypeFromPath('/cache/documents/scan.JPEG')).toMatchObject({ extension: 'jpg' });
    expect(documentFileTypeFromPath('/cache/documents/coi.png')).toMatchObject({ extension: 'png' });
    expect(documentFileTypeFromPath('/cache/documents/GL - 2026.pdf')).toMatchObject({ extension: 'pdf', isImage: false });
  });
});
