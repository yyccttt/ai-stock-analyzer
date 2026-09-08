const { AppError } = require('../errors');

const SINA_ENDPOINT = 'https://hq.sinajs.cn/list=';
const CACHE_TTL_MS = Number(process.env.STOCK_CACHE_TTL_MS) || 60_000;
const cache = new Map();

function asNumber(value, fallback = 0) {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function round(value, digits = 2) {
  const factor = 10 ** digits;
  return Math.round((value + Number.EPSILON) * factor) / factor;
}

function deriveMetrics(stock) {
  const weekRange = stock.week52High - stock.week52Low;
  const intradayRange = stock.high - stock.low;
  return {
    intradayRangePercent: stock.previousClose > 0
      ? round((intradayRange / stock.previousClose) * 100)
      : 0,
    position52Week: weekRange > 0
      ? round(Math.min(100, Math.max(0, ((stock.price - stock.week52Low) / weekRange) * 100)))
      : 0,
    gapFrom52WeekHigh: stock.week52High > 0
      ? round(((stock.price - stock.week52High) / stock.week52High) * 100)
      : 0,
  };
}

function parseQuote(symbol, raw) {
  const fields = raw.split(',');
  const price = asNumber(fields[1]);
  if (!fields[0] || price <= 0 || fields.length < 27) {
    throw new AppError(404, 'STOCK_NOT_FOUND', `No market data found for ${symbol}`);
  }

  const stock = {
    symbol: symbol.toUpperCase(),
    name: fields[0],
    price,
    changePercent: asNumber(fields[2]),
    sourceUpdatedAt: fields[3] || null,
    change: asNumber(fields[4]),
    open: asNumber(fields[5]),
    high: asNumber(fields[6]),
    low: asNumber(fields[7]),
    week52High: asNumber(fields[8]),
    week52Low: asNumber(fields[9]),
    volume: Number.parseInt(fields[10], 10) || 0,
    previousClose: asNumber(fields[26]),
    source: 'Sina Finance',
  };
  return { ...stock, metrics: deriveMetrics(stock) };
}

function parseSinaPayload(payload) {
  const quotes = new Map();
  const pattern = /var\s+hq_str_gb_([a-z0-9.-]+)="([^"]*)";/gi;
  let match;
  while ((match = pattern.exec(payload)) !== null) {
    quotes.set(match[1].toUpperCase(), parseQuote(match[1], match[2]));
  }
  return quotes;
}

async function fetchQuotes(symbols, fetchImpl = fetch) {
  let response;
  try {
    response = await fetchImpl(
      `${SINA_ENDPOINT}${symbols.map((symbol) => `gb_${symbol.toLowerCase()}`).join(',')}`,
      {
        headers: { Referer: 'https://finance.sina.com.cn' },
        signal: AbortSignal.timeout(10_000),
      }
    );
  } catch (error) {
    throw new AppError(502, 'MARKET_DATA_UNAVAILABLE', 'Market data provider is unavailable', {
      reason: error.name === 'TimeoutError' ? 'timeout' : 'connection_failed',
    });
  }

  if (!response.ok) {
    throw new AppError(502, 'MARKET_DATA_UNAVAILABLE', 'Market data provider returned an error');
  }

  const payload = new TextDecoder('gb18030').decode(await response.arrayBuffer());
  const parsed = parseSinaPayload(payload);
  for (const symbol of symbols) {
    if (!parsed.has(symbol)) {
      throw new AppError(404, 'STOCK_NOT_FOUND', `No market data found for ${symbol}`);
    }
  }
  return parsed;
}

function getCached(symbol) {
  const entry = cache.get(symbol);
  if (!entry || Date.now() - entry.cachedAt >= CACHE_TTL_MS) {
    cache.delete(symbol);
    return null;
  }
  return { ...entry.value, cached: true };
}

async function getMultipleStockData(symbols) {
  const results = new Map();
  const missing = [];

  for (const symbol of symbols) {
    const cached = getCached(symbol);
    if (cached) results.set(symbol, cached);
    else missing.push(symbol);
  }

  if (missing.length) {
    const fetched = await fetchQuotes(missing);
    for (const symbol of missing) {
      const value = fetched.get(symbol);
      cache.set(symbol, { value, cachedAt: Date.now() });
      results.set(symbol, { ...value, cached: false });
    }
  }

  return symbols.map((symbol) => results.get(symbol));
}

async function getStockData(symbol) {
  const [result] = await getMultipleStockData([symbol]);
  return result;
}

function clearCache() {
  cache.clear();
}

module.exports = {
  clearCache,
  deriveMetrics,
  getMultipleStockData,
  getStockData,
  parseQuote,
  parseSinaPayload,
};
