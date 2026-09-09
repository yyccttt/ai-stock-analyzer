import { describe, expect, it } from 'vitest';
import { buildComparisonCsv } from './export';

describe('comparison CSV export', () => {
  it('exports localized headings and the useful comparison metrics', () => {
    const csv = buildComparisonCsv([
      { symbol: 'AAPL', price: 210.5, changePercent: 1.25, volume: 1234, metrics: { position52Week: 82.4 } },
    ], { stock: 'Stock', price: 'Price', change: 'Change', volume: 'Volume', rangePosition: '52-week position' });

    expect(csv).toContain('Stock,Price,Change,Volume,52-week position');
    expect(csv).toContain('AAPL,210.5,1.25,1234,82.4');
  });

  it('escapes headings that contain commas', () => {
    const csv = buildComparisonCsv([], { stock: 'Stock, symbol', price: 'Price', change: 'Change', volume: 'Volume', rangePosition: 'Range' });
    expect(csv).toContain('"Stock, symbol"');
  });
});
