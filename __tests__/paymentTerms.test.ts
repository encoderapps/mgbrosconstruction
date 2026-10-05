import {
  PaymentTermDraft,
  calculatePaymentTermAmount,
  calculatePaymentTermAmounts,
  distributePercentagesEvenly,
  formatPercentage,
  sanitizePercentageInput,
  sumPercentages,
  validatePaymentTermDrafts,
  withCalculatedAmounts,
  withEvenPercentages,
} from '../src/utils/paymentTerms';

const draft = (description: string, percentageText: string, key = description): PaymentTermDraft => ({
  key,
  description,
  percentageText,
});

describe('distributePercentagesEvenly', () => {
  it('splits 100% evenly and puts the rounding remainder on the last term', () => {
    expect(distributePercentagesEvenly(4)).toEqual([25, 25, 25, 25]);
    expect(distributePercentagesEvenly(5)).toEqual([20, 20, 20, 20, 20]);
    expect(distributePercentagesEvenly(3)).toEqual([33.33, 33.33, 33.34]);
    expect(distributePercentagesEvenly(0)).toEqual([]);
  });

  it('always totals exactly 100', () => {
    for (let count = 1; count <= 30; count += 1) {
      expect(sumPercentages(distributePercentagesEvenly(count))).toBe(100);
    }
  });
});

describe('amounts', () => {
  it('is PO total × percentage / 100, to the cent', () => {
    expect(calculatePaymentTermAmount(19750, 30)).toBe(5925);
    expect(calculatePaymentTermAmount(19750, 20)).toBe(3950);
    expect(calculatePaymentTermAmount(15750, 25)).toBe(3937.5);
  });

  it('makes the amounts add up to the total when the terms cover 100%', () => {
    expect(calculatePaymentTermAmounts(100, [33.33, 33.33, 33.34])).toEqual([33.33, 33.33, 33.34]);
    const amounts = calculatePaymentTermAmounts(1000.01, distributePercentagesEvenly(3));
    expect(Math.round(amounts.reduce((sum, amount) => sum + amount, 0) * 100)).toBe(100001);
  });

  it('recalculates terms from the total and keeps a term without a percentage as sent', () => {
    expect(
      withCalculatedAmounts(
        [
          { id: 'a', percentage: 40, description: 'Down Payment', amount: 0 },
          { id: 'b', percentage: null, description: 'Final Payment', amount: 12 },
        ],
        1500,
      ),
    ).toEqual([
      { id: 'a', percentage: 40, description: 'Down Payment', amount: 600 },
      { id: 'b', percentage: null, description: 'Final Payment', amount: 12 },
    ]);
  });
});

describe('percentage input', () => {
  it('keeps digits and up to two decimals', () => {
    expect(sanitizePercentageInput('12.345')).toBe('12.34');
    expect(sanitizePercentageInput('1a2')).toBe('12');
    expect(sanitizePercentageInput('1.2.3')).toBe('1.23');
    expect(sanitizePercentageInput('')).toBe('');
  });

  it('formats without floating-point noise', () => {
    expect(formatPercentage(0.1 + 0.2)).toBe('0.3%');
    expect(formatPercentage(99.999999)).toBe('100%');
  });
});

describe('withEvenPercentages', () => {
  it('rebalances after a term is added or deleted', () => {
    const terms = [draft('A', '30'), draft('B', '30'), draft('C', '20'), draft('D', '20'), draft('', '', 'new')];
    expect(withEvenPercentages(terms).map((term) => term.percentageText)).toEqual(['20', '20', '20', '20', '20']);
    expect(withEvenPercentages(terms.slice(0, 3)).map((term) => term.percentageText)).toEqual([
      '33.33',
      '33.33',
      '33.34',
    ]);
  });
});

describe('validatePaymentTermDrafts', () => {
  it('accepts terms that total 100%', () => {
    expect(validatePaymentTermDrafts([draft('A', '33.33'), draft('B', '33.33'), draft('C', '33.34')])).toBeNull();
  });

  it('rejects no terms, a missing description and bad percentages', () => {
    expect(validatePaymentTermDrafts([])).toMatch(/at least one/);
    expect(validatePaymentTermDrafts([draft('', '100')])).toMatch(/description for payment term 1/);
    expect(validatePaymentTermDrafts([draft('A', '')])).toMatch(/Enter a percentage/);
    expect(validatePaymentTermDrafts([draft('A', '.')])).toMatch(/Enter a percentage/);
    expect(validatePaymentTermDrafts([draft('A', '0'), draft('B', '100')])).toMatch(/more than 0/);
  });

  it('rejects totals other than 100%', () => {
    expect(validatePaymentTermDrafts([draft('A', '40'), draft('B', '55')])).toBe(
      'Payment terms must total 100% (currently 95%).',
    );
    expect(validatePaymentTermDrafts([draft('A', '50'), draft('B', '55')])).toMatch(/currently 105%/);
  });
});
