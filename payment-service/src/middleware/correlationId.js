const { v4: uuidv4 } = require('uuid');

const correlationIdMiddleware = (req, res, next) => {
  // Get correlation ID from header or generate a new one
  const correlationId = req.headers['x-correlation-id'] || 
                       req.headers['X-Correlation-ID'] || 
                       uuidv4();
  
  // Add correlation ID to request object
  req.correlationId = correlationId;
  
  // Add correlation ID to response headers
  res.set('X-Correlation-ID', correlationId);
  
  next();
};

module.exports = correlationIdMiddleware;
