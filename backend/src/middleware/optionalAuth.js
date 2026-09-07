const jwt = require('jsonwebtoken');

// Like requireAuth, but never blocks the request — just attaches req.user
// if a valid token is present, and leaves it undefined otherwise. Used on
// public routes that behave slightly differently for logged-in visitors
// (e.g. "is this my own portfolio", "have I already liked this").
function optionalAuth(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer')) {
    return next();
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { id: decoded.userId };
  } catch (err) {
    // Invalid/expired token on a public route — just proceed as anonymous.
  }
  next();
}

module.exports = optionalAuth;