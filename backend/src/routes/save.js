const { Router } = require('express');
const defaultStorageService = require('../services/supabase');
const { normalizeSymbol, requireObject } = require('../validation');
const { AppError } = require('../errors');

function createSaveRouter(storageService = defaultStorageService) {
  const router = Router();

  router.post('/', async (req, res, next) => {
    try {
      const symbol = normalizeSymbol(req.body?.symbol);
      const stockData = requireObject(req.body?.stockData, 'stockData');
      const analysis = requireObject(req.body?.analysis, 'analysis');
      if (normalizeSymbol(stockData.symbol) !== symbol) {
        throw new AppError(400, 'SYMBOL_MISMATCH', 'symbol must match stockData.symbol');
      }

      const record = { symbol, stock_data: stockData, analysis };
      const result = await storageService.saveAnalysis(record);
      res.status(201).json({ data: result.data, storage: 'supabase' });
    } catch (err) {
      next(err);
    }
  });

  return router;
}

module.exports = createSaveRouter;
