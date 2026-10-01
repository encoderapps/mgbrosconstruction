import { formatCurrency } from '../src/utils/formatCurrency';
import { formatPhoneNumber } from '../src/utils/formatPhoneNumber';
import { isAwaitingSignature, isSigned } from '../src/utils/purchaseOrderStatus';

describe('formatCurrency', () => {
  it('drops cents for whole amounts and groups thousands', () => {
    expect(formatCurrency(0)).toBe('$0');
    expect(formatCurrency(10200)).toBe('$10,200');
    expect(formatCurrency(1234567)).toBe('$1,234,567');
  });

  it('keeps cents when the amount has them', () => {
    expect(formatCurrency(10200.5)).toBe('$10,200.50');
    expect(formatCurrency(3937.5)).toBe('$3,937.50');
  });

  it('always shows cents when asked', () => {
    expect(formatCurrency(15750, true)).toBe('$15,750.00');
    expect(formatCurrency(0, true)).toBe('$0.00');
  });

  it('formats negative amounts', () => {
    expect(formatCurrency(-1500.25)).toBe('-$1,500.25');
  });
});

describe('formatPhoneNumber', () => {
  it('formats 10-digit US numbers however they were typed', () => {
    expect(formatPhoneNumber('2344568569')).toBe('(234) 456-8569');
    expect(formatPhoneNumber('234-456-8569')).toBe('(234) 456-8569');
    expect(formatPhoneNumber('(234) 456 8569')).toBe('(234) 456-8569');
  });

  it('drops a leading US country code', () => {
    expect(formatPhoneNumber('+1 234 456 8569')).toBe('(234) 456-8569');
    expect(formatPhoneNumber('12344568569')).toBe('(234) 456-8569');
  });

  it('leaves anything else as typed', () => {
    expect(formatPhoneNumber('+44 20 7946 0958')).toBe('+44 20 7946 0958');
    expect(formatPhoneNumber('12345')).toBe('12345');
  });
});

describe('purchase order status', () => {
  it('recognises signed statuses', () => {
    expect(isSigned('Signed by both sides')).toBe(true);
    expect(isSigned('Signed')).toBe(true);
  });

  it('does not treat unsigned statuses as signed', () => {
    expect(isSigned('Unsigned')).toBe(false);
    expect(isSigned('Not Signed')).toBe(false);
    expect(isSigned('Ready For Signature')).toBe(false);
  });

  it('only offers signing when the PO is ready for signature', () => {
    expect(isAwaitingSignature('Ready For Signature')).toBe(true);
    expect(isAwaitingSignature('Signed by both sides')).toBe(false);
  });
});
