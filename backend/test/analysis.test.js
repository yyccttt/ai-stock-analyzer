const test = require('node:test');
const assert = require('node:assert/strict');
const {
  buildRuleBasedAnalysis,
  extractJson,
  normalizeAnalysis,
} = require('../src/services/deepseek');

function stock(overrides = {}) {
  return {
    symbol: 'AAPL',
    price: 205,
    open: 198,
    changePercent: 2.5,
    metrics: { position52Week: 80, intradayRangePercent: 2 },
    ...overrides,
  };
}

test('rule-based analysis produces explainable bullish output', () => {
  const result = buildRuleBasedAnalysis(stock());
  assert.equal(result.sentiment, 'bullish');
  assert.equal(result.risk_level, 'medium');
  assert.equal(result.source, 'rule-based');
  assert.equal(result.highlights.length, 2);
  assert.match(result.summary, /AAPL/);
});

test('rule-based analysis identifies bearish and high-risk moves', () => {
  const result = buildRuleBasedAnalysis(stock({
    price: 180,
    open: 195,
    changePercent: -5,
    metrics: { position52Week: 10, intradayRangePercent: 6 },
  }));
  assert.equal(result.sentiment, 'bearish');
  assert.equal(result.risk_level, 'high');
});

test('extractJson accepts fenced responses and surrounding text', () => {
  assert.deepEqual(extractJson('result: ```json\\n{\"summary\":\"ok\"}\\n```'), { summary: 'ok' });
});

test('normalizeAnalysis constrains output and removes invalid list items', () => {
  const result = normalizeAnalysis({
    summary: '  简要分析  ',
    sentiment: 'neutral',
    risk_level: 'low',
    confidence: 101,
    highlights: ['a', null, 'b', 'c', 'd'],
    risks: 'not-an-array',
  });
  assert.equal(result.summary, '简要分析');
  assert.equal(result.confidence, 100);
  assert.deepEqual(result.highlights, ['a', 'b', 'c']);
  assert.deepEqual(result.risks, []);
});

test('normalizeAnalysis rejects invalid enumerations', () => {
  assert.throws(
    () => normalizeAnalysis({ summary: 'x', sentiment: 'up', risk_level: 'low' }),
    /Invalid sentiment/
  );
});
