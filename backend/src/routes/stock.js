const { Router } = require('express');
const { getStockData } = require('../services/alphaVantage');

const router = Router();

router.get('/:symbol', async (req, res, next) => {
  try {
    const { symbol } = req.params;
    if (!symbol || symbol.length > 10) {
      return res.status(400).json({ error: 'Invalid stock symbol' });
    }
    const data = await getStockData(symbol.toUpperCase());
    res.json(data);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
