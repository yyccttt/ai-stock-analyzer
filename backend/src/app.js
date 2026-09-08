const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const { rateLimit } = require('express-rate-limit');

const createStockRouter = require('./routes/stock');
const createAnalyzeRouter = require('./routes/analyze');
const createSaveRouter = require('./routes/save');
const defaultStockService = require('./services/stockData');
const defaultAnalysisService = require('./services/deepseek');
const defaultStorageService = require('./services/supabase');
const { errorHandler, notFoundHandler } = require('./errors');

function corsOptions() {
  const allowed = (process.env.CORS_ORIGINS || '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
  return {
    origin(origin, callback) {
      if (!origin || !allowed.length || allowed.includes(origin)) return callback(null, true);
      return callback(null, false);
    },
  };
}

function createApp(dependencies = {}) {
  const stockService = dependencies.stockService || defaultStockService;
  const analysisService = dependencies.analysisService || defaultAnalysisService;
  const storageService = dependencies.storageService || defaultStorageService;
  const app = express();

  app.disable('x-powered-by');
  app.use(helmet());
  app.use(cors(corsOptions()));
  app.use(morgan(process.env.NODE_ENV === 'test' ? 'tiny' : 'dev'));
  app.use(express.json({ limit: '100kb' }));
  app.use(rateLimit({
    windowMs: 60_000,
    limit: 120,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
  }));

  app.get('/api/health', (_req, res) => {
    res.json({
      status: 'ok',
      version: '2.0.0',
      services: {
        marketData: true,
        ai: Boolean(process.env.DEEPSEEK_API_KEY),
        cloudStorage: storageService.isConfigured ? storageService.isConfigured() : true,
      },
    });
  });

  app.use('/api/stock', createStockRouter(stockService));
  app.use('/api/analyze', rateLimit({
    windowMs: 60_000,
    limit: 20,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
  }), createAnalyzeRouter(analysisService));
  app.use('/api/save', createSaveRouter(storageService));

  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
}

module.exports = { createApp, corsOptions };
