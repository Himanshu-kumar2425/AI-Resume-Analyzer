/**
 * Must be used AFTER authMiddleware (protect).
 * Checks that the authenticated user has role === 'admin'.
 * Returns 403 for all other roles.
 */
const adminOnly = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    return next();
  }
  return res.status(403).json({ error: 'Access denied: admin only' });
};

module.exports = { adminOnly };
