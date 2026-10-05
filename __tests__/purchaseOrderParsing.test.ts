import { parsePaymentTerms } from '../src/services/purchaseOrderDetailService';
import { decodeHtmlEntities, htmlToPlainText } from '../src/utils/html';
import { groupLineItemsByCategory } from '../src/utils/purchaseOrderLineItems';
import { PurchaseOrderLineItem } from '../src/types/purchaseOrder';

describe('html helpers', () => {
  it('decodes named and numeric entities', () => {
    expect(decodeHtmlEntities('&quot;a&quot; &amp; &#39;b&#39; &#x27;c&#x27; &lt;d&gt;')).toBe(`"a" & 'b' 'c' <d>`);
  });

  it('leaves unknown entities alone', () => {
    expect(decodeHtmlEntities('&unknown; text')).toBe('&unknown; text');
  });

  it('leaves out-of-range numeric entities alone instead of throwing', () => {
    expect(decodeHtmlEntities('a &#99999999; b &#x110000;')).toBe('a &#99999999; b &#x110000;');
  });

  it('turns rich text into plain text', () => {
    expect(htmlToPlainText('<p>Duct work 1st floor</p>')).toBe('Duct work 1st floor');
    expect(htmlToPlainText('<p>Line one</p><p>Line&nbsp;two<br/>three</p>')).toBe('Line one\nLine two\nthree');
  });
});

describe('parsePaymentTerms', () => {
  it('parses the HTML-escaped JSON string the API sends', () => {
    const raw =
      '[{&quot;description&quot;:false,&quot;percentage&quot;:25,&quot;amount&quot;:&quot;100.00&quot;},' +
      '{&quot;description&quot;:&quot;Down Payment&quot;,&quot;percentage&quot;:75,&quot;amount&quot;:&quot;300.50&quot;}]';

    expect(parsePaymentTerms(raw)).toEqual([
      { id: 'term-0', percentage: 25, description: '', amount: 100 },
      { id: 'term-1', percentage: 75, description: 'Down Payment', amount: 300.5 },
    ]);
  });

  it('accepts an array', () => {
    expect(parsePaymentTerms([{ percentage: '50', description: 'Upon completion', amount: 200 }])).toEqual([
      { id: 'term-0', percentage: 50, description: 'Upon completion', amount: 200 },
    ]);
  });

  it('returns no terms for empty or malformed data', () => {
    expect(parsePaymentTerms(null)).toEqual([]);
    expect(parsePaymentTerms('')).toEqual([]);
    expect(parsePaymentTerms('not json')).toEqual([]);
    expect(parsePaymentTerms('{&quot;a&quot;:1}')).toEqual([]);
  });

  it('keeps unparseable amounts as null', () => {
    expect(parsePaymentTerms([{ percentage: 25, amount: 'abc' }])[0].amount).toBeNull();
  });
});

describe('groupLineItemsByCategory', () => {
  const item = (id: string, category: string): PurchaseOrderLineItem => ({
    id,
    category,
    productOrService: 'Service',
    description: '',
    quantity: 1,
    unitPrice: 0,
    amount: 0,
  });

  it('groups by category in first-seen order', () => {
    const groups = groupLineItemsByCategory([
      item('1', 'HVAC Service'),
      item('2', 'Plumbing Service'),
      item('3', 'HVAC Service'),
    ]);

    expect(groups.map((group) => group.category)).toEqual(['HVAC Service', 'Plumbing Service']);
    expect(groups[0].items.map((entry) => entry.id)).toEqual(['1', '3']);
  });
});
