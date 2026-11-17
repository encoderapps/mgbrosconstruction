import { isJpegFile, isPdfFile } from '../src/utils/fileValidation';

describe('isJpegFile', () => {
  it('accepts a JPG by its type or extension, and nothing else', () => {
    expect(isJpegFile({ type: 'image/jpeg', name: 'scan' })).toBe(true);
    expect(isJpegFile({ type: null, name: 'W9.JPG' })).toBe(true);
    expect(isJpegFile({ type: null, name: 'coi.jpeg' })).toBe(true);
    expect(isJpegFile({ type: 'image/png', name: 'coi.png' })).toBe(false);
    expect(isJpegFile({ type: 'application/pdf', name: 'coi.pdf' })).toBe(false);
    expect(isPdfFile({ type: 'image/jpeg', name: 'scan.jpg' })).toBe(false);
  });
});
