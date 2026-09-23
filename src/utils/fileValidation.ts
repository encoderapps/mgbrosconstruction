interface PickedFileMeta {
  name?: string | null;
  type?: string | null;
}

export function isPdfFile(file: PickedFileMeta): boolean {
  const isPdfMimeType = file.type === 'application/pdf';
  const isPdfExtension = !!file.name?.toLowerCase().endsWith('.pdf');
  return isPdfMimeType || isPdfExtension;
}
