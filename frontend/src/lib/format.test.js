import { describe, expect, it } from 'vitest';
import { formatCurrency, formatNumber, formatPercent } from './format';

describe('format helpers', () => {
  it('formats US dollar prices consistently', () => {
    expect(formatCurrency(1234.5)).toBe('$1,234.50');
  });

  it('adds a sign only to positive percentages', () => {
    expect(formatPercent(2.345)).toBe('+2.35%');
    expect(formatPercent(-2.345)).toBe('-2.35%');
    expect(formatPercent(0)).toBe('0.00%');
  });

  it('uses compact notation for large volumes', () => {
    expect(formatNumber(1_500_000)).toMatch(/150万|1\.5M/i);
  });
});
