const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { sendSuccess, sendError } = require('../utils/responseHelper');

// ── Helpers ────────────────────────────────────────────────────────────────────

const isValidEmail = (email) => /^\S+@\S+\.\S+$/.test(email);

const signToken = (user) =>
  jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );

const userPayload = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
});

// ── Controllers ────────────────────────────────────────────────────────────────

/**
 * POST /api/auth/register
 */
const register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    // Validation
    if (!name || name.trim().length < 2 || name.trim().length > 80) {
      return sendError(res, 'Name must be between 2 and 80 characters.', 400);
    }
    if (!email || !isValidEmail(email)) {
      return sendError(res, 'Please provide a valid email address.', 400);
    }
    if (!password || password.length < 8) {
      return sendError(res, 'Password must be at least 8 characters.', 400);
    }

    // Duplicate email check
    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return sendError(res, 'Email already registered.', 409);
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user
    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase(),
      password: hashedPassword,
    });

    const token = signToken(user);

    return sendSuccess(res, { token, user: userPayload(user) }, 201);
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/auth/login
 */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return sendError(res, 'Email and password are required.', 400);
    }

    // Fetch user — include password field for comparison only
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');

    // Same generic message whether email or password is wrong (REQ-AUTH-04)
    if (!user) {
      return sendError(res, 'Invalid email or password.', 401);
    }

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return sendError(res, 'Invalid email or password.', 401);
    }

    const token = signToken(user);

    return sendSuccess(res, { token, user: userPayload(user) });
  } catch (err) {
    next(err);
  }
};

module.exports = { register, login };
