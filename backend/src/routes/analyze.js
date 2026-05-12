const { Router } = require('express');
const { analyzeStock } = require('../services/deepseek');

const router = Router();

router.post('/', async (req, res, next) => {
  try {
    const { stockData } = req.body;
    if (!stockData || typeof stockData !== 'object') {
      return res.status(400).json({ error: 'Request body must include stockData object' });
    }
    const analysis = await analyzeStock(stockData);
    res.json(analysis);
  } catch (err) {
    if (err.message.includes('Invalid') || err.message.includes('required fields')) {
      return res.status(422).json({ error: err.message });
    }
    next(err);
  }
});

module.exports = router;
