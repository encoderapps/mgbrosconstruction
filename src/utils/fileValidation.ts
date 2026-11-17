interface PickedFileMeta {
  name?: string | null;
  type?: string | null;
}

export function isPdfFile(file: PickedFileMeta): boolean {
  const isPdfMimeType = file.type === 'application/pdf';
  const isPdfExtension = !!file.name?.toLowerCase().endsWith('.pdf');
  return isPdfMimeType || isPdfExtension;
}

/** A JPG/JPEG photo or scan, by its MIME type or extension. */
export function isJpegFile(file: PickedFileMeta): boolean {
  const isJpegMimeType = file.type === 'image/jpeg' || file.type === 'image/jpg';
  const isJpegExtension = /\.jpe?g$/i.test(file.name ?? '');
  return isJpegMimeType || isJpegExtension;
}
