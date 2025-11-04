const express = require('express');
const mongoose = require('mongoose');
const { getRedisClient } = require('../config/redis');
const logger = require('../utils/logger');

const router = express.Router();

// Health check endpoint
router.get('/', async (req, res) => {
  try {
    const healthCheck = {
      uptime: process.uptime(),
      message: 'OK',
      timestamp: new Date().toISOString(),
      service: 'payment-service',
      version: '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      correlationId: req.correlationId
    };

    // Check database connection
    if (mongoose.connection.readyState === 1) {
      healthCheck.database = 'connected';
    } else {
      healthCheck.database = 'disconnected';
      healthCheck.message = 'Database connection issue';
    }

    // Check Redis connection
    try {
      const redis = getRedisClient();
      await redis.ping();
      healthCheck.redis = 'connected';
    } catch (error) {
      healthCheck.redis = 'disconnected';
      healthCheck.message = 'Redis connection issue';
    }

    // Check external services
    healthCheck.externalServices = {
      stripe: process.env.STRIPE_SECRET_KEY ? 'configured' : 'not_configured',
      paypal: process.env.PAYPAL_CLIENT_ID ? 'configured' : 'not_configured'
    };

    const statusCode = healthCheck.database === 'connected' && healthCheck.redis === 'connected' ? 200 : 503;
    
    res.status(statusCode).json(healthCheck);
  } catch (error) {
    logger.error('Health check error:', {
      error: error.message,
      correlationId: req.correlationId
    });
    
    res.status(503).json({
      uptime: process.uptime(),
      message: 'Service unavailable',
      timestamp: new Date().toISOString(),
      service: 'payment-service',
      error: error.message,
      correlationId: req.correlationId
    });
  }
});

// Readiness check
router.get('/ready', async (req, res) => {
  try {
    // Check if all required services are available
    const isDatabaseReady = mongoose.connection.readyState === 1;
    
    let isRedisReady = false;
    try {
      const redis = getRedisClient();
      await redis.ping();
      isRedisReady = true;
    } catch (error) {
      isRedisReady = false;
    }
    
    const isReady = isDatabaseReady && isRedisReady;
    
    if (isReady) {
      res.status(200).json({
        status: 'ready',
        timestamp: new Date().toISOString(),
        correlationId: req.correlationId
      });
    } else {
      res.status(503).json({
        status: 'not_ready',
        timestamp: new Date().toISOString(),
        reason: !isDatabaseReady ? 'Database not connected' : 'Redis not connected',
        correlationId: req.correlationId
      });
    }
  } catch (error) {
    logger.error('Readiness check error:', {
      error: error.message,
      correlationId: req.correlationId
    });
    
    res.status(503).json({
      status: 'not_ready',
      timestamp: new Date().toISOString(),
      error: error.message,
      correlationId: req.correlationId
    });
  }
});

// Liveness check
router.get('/live', (req, res) => {
  res.status(200).json({
    status: 'alive',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    correlationId: req.correlationId
  });
});

module.exports = router;
