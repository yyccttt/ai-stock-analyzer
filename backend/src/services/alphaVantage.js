const axios = require('axios');

async function getStockData(symbol) {
  const upperSymbol = symbol.toUpperCase();
  const url = `https://hq.sinajs.cn/list=gb_${upperSymbol.toLowerCase()}`;

  const { data } = await axios.get(url, {
    headers: { Referer: 'https://finance.sina.com.cn' },
    timeout: 10000,
  });

  const raw = data.toString().split('"')[1];
  if (!raw) throw new Error(`No data found for symbol: ${symbol}`);

  const f = raw.split(',');
  // Sina gb_ field mapping (verified):
  // 0=name 1=price 2=change% 3=datetime 4=change$ 5=open
  // 6=high 7=low 8=52w-high 9=52w-low 10=volume ... 26=previousClose
  const price = parseFloat(f[1]) || 0;
  const changePercent = parseFloat(f[2]) || 0;
  const change = parseFloat(f[4]) || 0;

  return {
    symbol: upperSymbol,
    price,
    change: parseFloat(change.toFixed(4)),
    changePercent: changePercent.toFixed(4) + '%',
    high: parseFloat(f[6]) || 0,
    low: parseFloat(f[7]) || 0,
    volume: parseInt(f[10]) || 0,
    previousClose: parseFloat(f[26]) || 0,
  };
}

module.exports = { getStockData };
