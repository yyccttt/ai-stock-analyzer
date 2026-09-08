process.env.NODE_ENV = 'test';
const test = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const { createApp } = require('../src/app');

const quote = {
  symbol: 'AAPL',
  name: '苹果',
  price: 200,
  change: 2,
  changePercent: 1,
  metrics: { position52Week: 60, intradayRangePercent: 1 },
};

function createTestApp() {
  return createApp({
    stockService: {
      getStockData: async (symbol) => ({ ...quote, symbol }),
      getMultipleStockData: async (symbols) => symbols.map((symbol) => ({ ...quote, symbol })),
    },
    analysisService: {
      analyzeStock: async (_stock, { mode }) => ({
        summary: '测试分析',
        sentiment: 'neutral',
        risk_level: 'low',
        confidence: 60,
        highlights: [],
        risks: [],
        source: mode,
      }),
    },
    storageService: {
      isConfigured: () => false,
      saveAnalysis: async (record) => ({ data: [{ id: 1, ...record }] }),
    },
  });
}

test('health endpoint reports optional service capabilities', async () => {
  const response = await request(createTestApp()).get('/api/health').expect(200);
  assert.equal(response.body.status, 'ok');
  assert.equal(response.body.version, '2.0.0');
  assert.equal(response.body.services.cloudStorage, false);
});

test('stock endpoint normalizes a symbol', async () => {
  const response = await request(createTestApp()).get('/api/stock/aapl').expect(200);
  assert.equal(response.body.symbol, 'AAPL');
});

test('stock endpoint returns structured validation errors', async () => {
  const response = await request(createTestApp()).get('/api/stock/invalid%2Fsymbol').expect(400);
  assert.deepEqual(response.body.error.code, 'INVALID_SYMBOL');
});

test('comparison endpoint returns two normalized quotes', async () => {
  const response = await request(createTestApp())
    .post('/api/stock/compare')
    .send({ symbols: 'aapl, msft' })
    .expect(200);
  assert.equal(response.body.count, 2);
  assert.deepEqual(response.body.data.map((item) => item.symbol), ['AAPL', 'MSFT']);
});

test('analysis endpoint forwards the selected mode', async () => {
  const response = await request(createTestApp())
    .post('/api/analyze')
    .send({ stockData: quote, mode: 'quick' })
    .expect(200);
  assert.equal(response.body.source, 'quick');
});

test('save endpoint rejects mismatched symbols', async () => {
  const response = await request(createTestApp())
    .post('/api/save')
    .send({ symbol: 'MSFT', stockData: quote, analysis: { summary: 'x' } })
    .expect(400);
  assert.equal(response.body.error.code, 'SYMBOL_MISMATCH');
});

test('unknown routes use a consistent 404 response', async () => {
  const response = await request(createTestApp()).get('/api/missing').expect(404);
  assert.equal(response.body.error.code, 'NOT_FOUND');
});
