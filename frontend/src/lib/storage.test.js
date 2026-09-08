import { beforeEach, describe, expect, it } from 'vitest';
import {
  HISTORY_KEY,
  MAX_HISTORY,
  WATCHLIST_KEY,
  clearHistory,
  loadHistory,
  loadWatchlist,
  saveHistoryRecord,
  toggleWatchlist,
} from './storage';

beforeEach(() => window.localStorage.clear());

describe('watchlist storage', () => {
  it('provides useful defaults on first visit', () => {
    expect(loadWatchlist()).toEqual(['AAPL', 'MSFT', 'NVDA']);
  });

  it('toggles symbols and persists the result', () => {
    expect(toggleWatchlist('tsla', ['AAPL'])).toEqual(['TSLA', 'AAPL']);
    expect(JSON.parse(localStorage.getItem(WATCHLIST_KEY))).toEqual(['TSLA', 'AAPL']);
    expect(toggleWatchlist('AAPL', ['TSLA', 'AAPL'])).toEqual(['TSLA']);
  });
});

describe('history storage', () => {
  const record = (symbol, id) => ({
    id,
    savedAt: '2026-01-01T00:00:00.000Z',
    stockData: { symbol },
    analysis: { summary: symbol },
  });

  it('deduplicates a symbol and puts the newest record first', () => {
    const result = saveHistoryRecord(record('AAPL', 2), [record('MSFT', 1), record('AAPL', 0)]);
    expect(result.map((item) => item.id)).toEqual([2, 1]);
    expect(loadHistory()).toEqual(result);
  });

  it('caps local history and can clear it', () => {
    const current = Array.from({ length: MAX_HISTORY }, (_, index) => record('S' + index, index));
    const result = saveHistoryRecord(record('NEW', 99), current);
    expect(result).toHaveLength(MAX_HISTORY);
    clearHistory();
    expect(localStorage.getItem(HISTORY_KEY)).toBe('[]');
  });

  it('recovers from malformed browser storage', () => {
    localStorage.setItem(HISTORY_KEY, '{not-json');
    expect(loadHistory()).toEqual([]);
  });
});
