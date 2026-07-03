/**
 * Standard response helpers.
 * All controllers use these to keep the response envelope consistent.
 */

const sendSuccess = (res, data, status = 200) => {
  res.status(status).json({ data });
};

const sendError = (res, message, status = 500) => {
  res.status(status).json({ error: message });
};

module.exports = { sendSuccess, sendError };
