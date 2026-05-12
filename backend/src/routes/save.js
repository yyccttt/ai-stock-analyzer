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
      price: stockData.price,
      change_pct: stockData.changePercent,
      volume: stockData.volume,
      summary: analysis.summary,
      sentiment: analysis.sentiment,
      risk_level: analysis.risk_level,
      created_at: new Date().toISOString(),
    };

    const result = await saveAnalysis(record);
    res.status(201).json(result.data);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
