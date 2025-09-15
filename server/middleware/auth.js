const jwt = require('jsonwebtoken');

// Middleware to verify JWT token
function auth(req, res, next) {
  // Get token from header
  const token = req.header('x-auth-token');

  // Check if no token
  if (!token) {
    return res.status(401).json({ message: 'No token, authorization denied' });
  }

  // Verify token
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded.user; // Attach user payload (id, role) to the request
    next();
  } catch (error) {
    res.status(401).json({ message: 'Token is not valid' });
  }
}

// Middleware to authorize based on roles
function authorizeRoles(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Access denied: Insufficient role' });
    }
    next();
  };
}

module.exports = { auth, authorizeRoles };
