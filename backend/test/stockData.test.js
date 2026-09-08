const test = require('node:test');
const assert = require('node:assert/strict');
const {
  deriveMetrics,
  parseQuote,
  parseSinaPayload,
} = require('../src/services/stockData');

const RAW = '苹果,200.0000,2.50,2026-09-08 12:00:00,5.0000,196.0000,202.0000,195.0000,240.0000,120.0000,1234567,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,195.0000';

test('parseQuote maps the supported market fields and derives metrics', () => {
  const quote = parseQuote('aapl', RAW);
  assert.equal(quote.symbol, 'AAPL');
  assert.equal(quote.name, '苹果');
  assert.equal(quote.price, 200);
  assert.equal(quote.changePercent, 2.5);
  assert.equal(quote.previousClose, 195);
  assert.equal(quote.metrics.position52Week, 66.67);
  assert.equal(quote.metrics.intradayRangePercent, 3.59);
  assert.equal(quote.metrics.gapFrom52WeekHigh, -16.67);
});

test('parseSinaPayload parses multiple provider lines', () => {
  const payload = `var hq_str_gb_aapl=\"${RAW}\";\nvar hq_str_gb_msft=\"微软,300,1,now,3,297,305,296,350,200,50,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,297\";`;
  const quotes = parseSinaPayload(payload);
  assert.equal(quotes.size, 2);
  assert.equal(quotes.get('MSFT').name, '微软');
});

test('parseQuote rejects missing or zero-price data', () => {
  assert.throws(() => parseQuote('NOPE', ''), { code: 'STOCK_NOT_FOUND', status: 404 });
});

test('deriveMetrics handles an empty 52-week range safely', () => {
  assert.deepEqual(
    deriveMetrics({
      price: 10,
      high: 10,
      low: 10,
      previousClose: 0,
      week52High: 10,
      week52Low: 10,
    }),
    { intradayRangePercent: 0, position52Week: 0, gapFrom52WeekHigh: 0 }
  );
});
