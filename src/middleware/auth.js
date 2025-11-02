const jwt = require('jsonwebtoken');
const logger = require('../utils/logger');
const metrics = require('../utils/metrics');

const authMiddleware = (req, res, next) => {
  // 🔧 Dev toggle to skip auth when needed
  if (process.env.AUTH_DISABLED === 'true') {
    req.user = { id: req.body.userId || 'dev_user', email: 'dev@example.com' };
    return next();
  }

  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.',
        correlationId: req.correlationId
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-super-secret-jwt-key-here');
    req.user = decoded;
    
    logger.info('User authenticated', {
      userId: decoded.id,
      correlationId: req.correlationId
    });
    
    next();
  } catch (error) {
    logger.error('Auth middleware error:', {
      error: error.message,
      correlationId: req.correlationId
    });
    
    res.status(401).json({
      success: false,
      message: 'Invalid token.',
      correlationId: req.correlationId
    });
  }
};

module.exports = authMiddleware;
