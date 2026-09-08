const { Router } = require('express');
const defaultStockService = require('../services/stockData');
const { normalizeSymbol, normalizeSymbols } = require('../validation');

function createStockRouter(stockService = defaultStockService) {
  const router = Router();

  router.post('/compare', async (req, res, next) => {
    try {
      const symbols = normalizeSymbols(req.body?.symbols);
      const data = await stockService.getMultipleStockData(symbols);
      res.json({ data, count: data.length });
    } catch (err) {
      next(err);
    }
  });

  router.get('/:symbol', async (req, res, next) => {
    try {
      const symbol = normalizeSymbol(req.params.symbol);
      const data = await stockService.getStockData(symbol);
      res.json(data);
    } catch (err) {
      next(err);
    }
  });

  return router;
}

module.exports = createStockRouter;
