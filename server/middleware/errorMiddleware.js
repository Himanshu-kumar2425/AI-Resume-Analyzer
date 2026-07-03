/**
 * Global Express error handler.
 * Always returns { error: <message> } — never exposes stack traces or internals.
 */
const errorHandler = (err, req, res, next) => {
  console.error('SERVER ERROR:', err);

  // Determine status code: prefer err.statusCode, fall back to 500
  const statusCode = err.statusCode || 500;

  // Never expose stack traces or raw DB errors in responses
  const message = err.isOperational
    ? err.message
    : 'An unexpected error occurred. Please try again.';

  res.status(statusCode).json({ error: message });
};

module.exports = { errorHandler };