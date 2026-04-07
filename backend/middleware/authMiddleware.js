const jwt = require('jsonwebtoken');

const resolveAuthToken = (req) => {
  const headerToken = req.header('Authorization')?.replace('Bearer ', '');

  if (headerToken) {
    return headerToken;
  }

  if (typeof req.query.token === 'string' && req.query.token.trim()) {
    return req.query.token.trim();
  }

  return null;
};

const authMiddleware = (req, res, next) => {
  const token = resolveAuthToken(req);
  if (!token) return res.status(401).json({ message: 'Access denied' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(400).json({ message: 'Invalid token' });
  }
};

const isAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') return res.status(403).json({ message: 'Access denied' });
  next();
};

module.exports = { authMiddleware, isAdmin, resolveAuthToken };
