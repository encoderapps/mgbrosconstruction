const UNITS = ['KB', 'MB', 'GB'];

/** 580 → "580 B", 268_800 → "263 KB", 1_572_864 → "1.5 MB": one decimal below 10, whole numbers above. */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) {
    return `${Math.max(0, Math.round(bytes))} B`;
  }
  let size = bytes / 1024;
  let unitIndex = 0;
  while (size >= 1024 && unitIndex < UNITS.length - 1) {
    size /= 1024;
    unitIndex += 1;
  }
  const rounded = size < 10 ? Math.round(size * 10) / 10 : Math.round(size);
  return `${rounded} ${UNITS[unitIndex]}`;
}
