const { v4: uuidv4 } = require('uuid');
const { getRedisClient } = require('../config/redis');
const logger = require('../utils/logger');
const metrics = require('../utils/metrics');

const idempotencyMiddleware = (req, res, next) => {
  // Only apply to POST requests
  if (req.method !== 'POST') {
    return next();
  }

  const idempotencyKey = req.headers['idempotency-key'] || req.headers['Idempotency-Key'];
  
  if (!idempotencyKey) {
    return res.status(400).json({
      success: false,
      message: 'Idempotency-Key header is required for POST requests',
      correlationId: req.correlationId
    });
  }

  // Validate idempotency key format (should be UUID)
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(idempotencyKey)) {
    return res.status(400).json({
      success: false,
      message: 'Idempotency-Key must be a valid UUID',
      correlationId: req.correlationId
    });
  }

  // Check if this idempotency key has been used before
  checkIdempotencyKey(idempotencyKey, req, res, next);
};

const checkIdempotencyKey = async (idempotencyKey, req, res, next) => {
  try {
    const redis = getRedisClient();
    const key = `${process.env.IDEMPOTENCY_REDIS_PREFIX || 'idempotency:payment:'}${idempotencyKey}`;
    
    // Check if key exists
    const existingResponse = await redis.get(key);
    
    if (existingResponse) {
      // Key exists, return the cached response
      const cachedResponse = JSON.parse(existingResponse);
      
      logger.info('Idempotency key hit', {
        idempotencyKey,
        correlationId: req.correlationId
      });
      
      metrics.recordIdempotencyHit();
      
      return res.status(cachedResponse.statusCode).json(cachedResponse.body);
    }
    
    // Key doesn't exist, proceed with the request
    // Store the original res.json method
    const originalJson = res.json;
    
    // Override res.json to cache the response
    res.json = function(body) {
      // Cache the response for the idempotency key
      const ttl = parseInt(process.env.IDEMPOTENCY_TTL) || 3600; // 1 hour default
      const key = `${process.env.IDEMPOTENCY_REDIS_PREFIX || 'idempotency:payment:'}${idempotencyKey}`;
      
      redis.setEx(key, ttl, JSON.stringify({
        statusCode: res.statusCode,
        body: body
      })).catch(err => {
        logger.error('Failed to cache idempotency response:', {
          error: err.message,
          idempotencyKey,
          correlationId: req.correlationId
        });
      });
      
      // Call the original json method
      return originalJson.call(this, body);
    };
    
    next();
  } catch (error) {
    logger.error('Idempotency middleware error:', {
      error: error.message,
      idempotencyKey,
      correlationId: req.correlationId
    });
    
    // If Redis is down, continue without idempotency
    next();
  }
};

module.exports = idempotencyMiddleware;
