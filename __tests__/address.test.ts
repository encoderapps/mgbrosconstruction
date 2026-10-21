import { joinAddressParts, splitAddress } from '../src/utils/address';

describe('splitAddress', () => {
  it('splits a joined address back into its parts', () => {
    const parts = { street: '185 N Addison Rd', city: 'Wood Dale', state: 'IL', zipCode: '60007' };
    const line = joinAddressParts([parts.street, parts.city, parts.state, parts.zipCode]);

    expect(splitAddress(line)).toEqual(parts);
  });

  it('handles the state and zip code in one part and a state given by name', () => {
    expect(splitAddress('185 N Addison Rd, Wood Dale, illinois 60007')).toEqual({
      street: '185 N Addison Rd',
      city: 'Wood Dale',
      state: 'IL',
      zipCode: '60007',
    });
  });

  it('keeps extra street parts and unknown states as written', () => {
    expect(splitAddress('Suite 4, 456 Industrial Area, Jaipur, Rajasthan')).toEqual({
      street: 'Suite 4, 456 Industrial Area',
      city: 'Jaipur',
      state: 'Rajasthan',
      zipCode: '',
    });
  });

  it('treats a second part as the city unless it is a US state', () => {
    expect(splitAddress('12 Main St, Springfield')).toEqual({ street: '12 Main St', city: 'Springfield', state: '', zipCode: '' });
    expect(splitAddress('12 Main St, AZ')).toEqual({ street: '12 Main St', city: '', state: 'AZ', zipCode: '' });
  });

  it('returns empty parts for a missing or single-part address', () => {
    expect(splitAddress(null)).toEqual({ street: '', city: '', state: '', zipCode: '' });
    expect(splitAddress('12 Main St')).toEqual({ street: '12 Main St', city: '', state: '', zipCode: '' });
  });
});
