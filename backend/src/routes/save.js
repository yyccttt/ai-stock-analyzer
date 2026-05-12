const { Router } = require('express');
const { saveAnalysis } = require('../services/supabase');

const router = Router();

router.post('/', async (req, res, next) => {
  try {
    const { symbol, stockData, analysis } = req.body;
    if (!symbol || !stockData || !analysis) {
      return res.status(400).json({ error: 'Request body must include symbol, stockData, and analysis' });
    }

    const record = {
      symbol: symbol.toUpperCase(),
      stock_data: stockData,
      analysis: analysis,
    };

    const result = await saveAnalysis(record);
    res.status(201).json(result.data);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
