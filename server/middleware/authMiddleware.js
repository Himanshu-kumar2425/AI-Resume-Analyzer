const jwt = require('jsonwebtoken');

/**
 * Verifies the Authorization: Bearer <token> header.
 * On success, attaches { id, role } to req.user and calls next().
 * On failure, returns 401 — never logs the raw token.
 */
const protect = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Not authorized, no token provided' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // Attach only the fields controllers need — never the full raw payload
    req.user = { id: decoded.id, role: decoded.role };
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Not authorized, token invalid or expired' });
  }
};

module.exports = { protect };
