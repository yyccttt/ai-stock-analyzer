class AppError extends Error {
  constructor(status, code, message, details) {
    super(message);
    this.name = 'AppError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

function notFoundHandler(req, res) {
  res.status(404).json({
    error: {
      code: 'NOT_FOUND',
      message: `Route ${req.method} ${req.originalUrl} does not exist`,
    },
  });
}

function errorHandler(err, _req, res, _next) {
  const status = Number.isInteger(err.status) ? err.status : 500;
  const code = err.code || 'INTERNAL_ERROR';
  const message = status >= 500 && !(err instanceof AppError)
    ? 'The server could not complete the request'
    : err.message;

  if (status >= 500) console.error(err);

  const body = { error: { code, message } };
  if (err.details) body.error.details = err.details;
  res.status(status).json(body);
}

module.exports = { AppError, errorHandler, notFoundHandler };
