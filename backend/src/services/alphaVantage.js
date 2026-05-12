const axios = require('axios');

const BASE_URL = 'https://www.alphavantage.co/query';

async function getStockData(symbol) {
  const apiKey = process.env.ALPHA_VANTAGE_API_KEY;
  if (!apiKey) {
    throw new Error('ALPHA_VANTAGE_API_KEY is not configured. Copy backend/.env.example to backend/.env and set your key.');
  }

  const { data } = await axios.get(BASE_URL, {
    params: {
      function: 'GLOBAL_QUOTE',
      symbol,
      apikey: apiKey,
    },
  });

  console.log('[Alpha Vantage] raw response keys:', Object.keys(data));

  if (data['Error Message']) {
    throw new Error(data['Error Message']);
  }
  if (data.Note) {
    console.log('[Alpha Vantage] Note:', data.Note);
  }

  const quote = data['Global Quote'];
  const hasData = quote && quote['01. symbol'];

  if (!hasData) {
    const detail = JSON.stringify(data).slice(0, 200);
    throw new Error(`No data found for symbol: ${symbol}. Response: ${detail}`);
  }

  return {
    symbol: quote['01. symbol'],
    price: parseFloat(quote['05. price']),
    change: parseFloat(quote['09. change']),
    changePercent: quote['10. change percent'],
    high: parseFloat(quote['03. high']),
    low: parseFloat(quote['04. low']),
    volume: parseInt(quote['06. volume'], 10),
    previousClose: parseFloat(quote['08. previous close']),
  };
}

module.exports = { getStockData };
