import { changeOrderSource, rememberChangeOrderSource } from '../src/services/changeOrderSourceStore';

describe('changeOrderSource', () => {
  it('uses the remembered source when the API leaves it out', () => {
    rememberChangeOrderSource('a1uQL00000JxBPVYA3', ' Job Change Order ');

    expect(changeOrderSource('a1uQL00000JxBPVYA3', null)).toBe('Job Change Order');
    expect(changeOrderSource('a1uQL00000JxBPVYA3', '  ')).toBe('Job Change Order');
  });

  it("prefers the API's source", () => {
    rememberChangeOrderSource('a1uQL00000JxBPWYA3', 'Job Change Order');

    expect(changeOrderSource('a1uQL00000JxBPWYA3', 'My Job Change Order')).toBe('My Job Change Order');
  });

  it('is undefined when neither has one', () => {
    rememberChangeOrderSource('a1uQL00000JxBPXYA3', null);

    expect(changeOrderSource('a1uQL00000JxBPXYA3', undefined)).toBeUndefined();
  });
});
