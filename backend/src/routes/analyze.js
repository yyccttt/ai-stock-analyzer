const { Router } = require('express');
const defaultAnalysisService = require('../services/deepseek');
const { normalizeSymbol, requireObject } = require('../validation');

function createAnalyzeRouter(analysisService = defaultAnalysisService) {
  const router = Router();

  router.post('/', async (req, res, next) => {
    try {
      const stockData = requireObject(req.body?.stockData, 'stockData');
      const mode = req.body?.mode === 'quick' ? 'quick' : 'ai';
      const language = req.body?.language === 'en' ? 'en' : 'zh';
      normalizeSymbol(stockData.symbol);
      const analysis = await analysisService.analyzeStock(stockData, { mode, language });
      res.json(analysis);
    } catch (err) {
      next(err);
    }
  });

  return router;
}

module.exports = createAnalyzeRouter;
