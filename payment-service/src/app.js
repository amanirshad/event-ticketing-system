const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const promClient = require('prom-client');
require('dotenv').config();

// Import database connection
const connectDB = require('./config/database');
const { connectRedis } = require('./config/redis');

// Import logger
const logger = require('./utils/logger');

// Import middleware
const errorHandler = require('./middleware/errorHandler');
const authMiddleware = require('./middleware/auth');
const idempotencyMiddleware = require('./middleware/idempotency');
const correlationIdMiddleware = require('./middleware/correlationId');

// Import routes
const paymentRoutes = require('./routes/paymentRoutes');
const healthRoutes = require('./routes/healthRoutes');
const metricsRoutes = require('./routes/metricsRoutes');

// Import metrics
const metrics = require('./utils/metrics');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3004;

// Initialize metrics
metrics.initialize();

// ------------------- Middleware Setup ------------------- //

// Security headers
app.use(helmet());

// CORS configuration
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // limit per IP
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', limiter);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Compression
app.use(compression());

// Correlation ID
app.use(correlationIdMiddleware);

// Logging (HTTP request logs)
app.use(morgan('combined', {
  stream: {
    write: (message) => logger.info(message.trim())
  }
}));

// ------------------- Routes ------------------- //

// Health check and metrics (no auth)
app.use('/health', healthRoutes);
app.use('/metrics', metricsRoutes);

// Dev token endpoint (for testing)
app.get('/auth/dev-token', (req, res) => {
  const jwt = require('jsonwebtoken');
  const userId = req.query.userId || 'dev_user';
  const secret = process.env.JWT_SECRET || 'your-super-secret-jwt-key-here';
  const token = jwt.sign({ id: userId, email: `${userId}@example.com` }, secret, { expiresIn: '24h' });
  res.json({ token, userId });
});

// Payment routes (with auth and idempotency)
if (process.env.AUTH_DISABLED === 'true') {
  app.use('/api/payments', idempotencyMiddleware, paymentRoutes);
} else {
  app.use('/api/payments', authMiddleware, idempotencyMiddleware, paymentRoutes);
}

// Root route
app.get('/', (req, res) => {
  res.json({
    service: 'Payment Service',
    version: '1.0.0',
    status: 'running',
    timestamp: new Date().toISOString(),
    correlationId: req.correlationId
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    path: req.originalUrl,
    correlationId: req.correlationId
  });
});

// Global error handler
app.use(errorHandler);

// ------------------- Graceful Shutdown ------------------- //
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  process.exit(0);
});

// ------------------- Start Server FIRST ------------------- //
app.listen(PORT, '0.0.0.0', () => {
  logger.info(`🚀 Payment Service running on port ${PORT}`);
  logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
  logger.info(`Metrics enabled: ${process.env.METRICS_ENABLED === 'true'}`);
});

// ------------------- Then connect DBs (async with logs) --- //
(async () => {
  try {
    logger.info('Connecting to MongoDB...');
    await connectDB();
    logger.info('✅ MongoDB connected');

    logger.info('Connecting to Redis...');
    await connectRedis();
    logger.info('✅ Redis connected');
  } catch (err) {
    logger.error('❌ Startup dependency failed:', err);
    // Don't exit; keep service up so /health still works
  }
})();
module.exports = app;
