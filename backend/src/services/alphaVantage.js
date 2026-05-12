const axios = require('axios');

async function getStockData(symbol) {
  const url = `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${symbol}`;

  const { data } = await axios.get(url, {
    headers: { 'User-Agent': 'Mozilla/5.0' },
  });

  const result = data?.quoteResponse?.result?.[0];
  if (!result || !result.symbol) {
    throw new Error(`No data found for symbol: ${symbol}`);
  }

  return {
    symbol: result.symbol,
    price: result.regularMarketPrice,
    change: result.regularMarketChange,
    changePercent: result.regularMarketChangePercent.toFixed(4) + '%',
    high: result.regularMarketDayHigh,
    low: result.regularMarketDayLow,
    volume: result.regularMarketVolume,
    previousClose: result.regularMarketPreviousClose,
  };
}

module.exports = { getStockData };
