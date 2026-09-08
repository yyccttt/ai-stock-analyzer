const test = require('node:test');
const assert = require('node:assert/strict');
const { normalizeSymbol, normalizeSymbols } = require('../src/validation');

test('normalizeSymbol trims and uppercases valid symbols', () => {
  assert.equal(normalizeSymbol(' brk.b '), 'BRK.B');
  assert.equal(normalizeSymbol('rddt'), 'RDDT');
});

test('normalizeSymbol rejects unsafe or malformed values', () => {
  for (const value of ['', 'AAPL/USD', '../AAPL', 'TOO-LONG-SYMBOL', null]) {
    assert.throws(() => normalizeSymbol(value), { code: 'INVALID_SYMBOL', status: 400 });
  }
});

test('normalizeSymbols accepts text, removes duplicates, and preserves order', () => {
  assert.deepEqual(normalizeSymbols('aapl, MSFT aapl nvda'), ['AAPL', 'MSFT', 'NVDA']);
});

test('normalizeSymbols enforces comparison bounds', () => {
  assert.throws(() => normalizeSymbols(['AAPL']), { code: 'TOO_FEW_SYMBOLS' });
  assert.throws(
    () => normalizeSymbols(['AAPL', 'MSFT', 'NVDA', 'GOOG', 'META', 'AMZN']),
    { code: 'TOO_MANY_SYMBOLS' }
  );
});
