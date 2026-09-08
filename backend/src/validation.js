const { AppError } = require('./errors');

const SYMBOL_PATTERN = /^[A-Z][A-Z0-9.-]{0,9}$/;

function normalizeSymbol(value) {
  const symbol = typeof value === 'string' ? value.trim().toUpperCase() : '';
  if (!SYMBOL_PATTERN.test(symbol)) {
    throw new AppError(
      400,
      'INVALID_SYMBOL',
      'Stock symbol must be 1-10 letters, numbers, dots, or hyphens'
    );
  }
  return symbol;
}

function normalizeSymbols(value, max = 5) {
  const candidates = Array.isArray(value)
    ? value
    : typeof value === 'string'
      ? value.split(/[\s,]+/)
      : [];
  const symbols = [...new Set(candidates.filter(Boolean).map(normalizeSymbol))];

  if (symbols.length < 2) {
    throw new AppError(400, 'TOO_FEW_SYMBOLS', 'Provide at least two stock symbols');
  }
  if (symbols.length > max) {
    throw new AppError(400, 'TOO_MANY_SYMBOLS', `A maximum of ${max} symbols is allowed`);
  }
  return symbols;
}

function requireObject(value, fieldName) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new AppError(400, 'INVALID_REQUEST', `${fieldName} must be an object`);
  }
  return value;
}

module.exports = { SYMBOL_PATTERN, normalizeSymbol, normalizeSymbols, requireObject };
