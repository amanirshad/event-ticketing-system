const promClient = require('prom-client');

// Create a Registry to register the metrics
const register = new promClient.Registry();

// Add a default label which is added to all metrics
register.setDefaultLabels({
  service: 'payment-service'
});

// Enable the collection of default metrics
promClient.collectDefaultMetrics({ register });

// Custom metrics
const paymentTotal = new promClient.Counter({
  name: 'payments_total',
  help: 'Total number of payment attempts',
  labelNames: ['status', 'payment_method', 'gateway'],
  registers: [register]
});

const paymentAmount = new promClient.Histogram({
  name: 'payment_amount',
  help: 'Payment amount distribution',
  labelNames: ['currency', 'payment_method'],
  buckets: [10, 50, 100, 500, 1000, 5000, 10000, 50000, 100000],
  registers: [register]
});

const paymentDuration = new promClient.Histogram({
  name: 'payment_duration_seconds',
  help: 'Payment processing duration in seconds',
  labelNames: ['payment_method', 'gateway', 'status'],
  buckets: [0.1, 0.5, 1, 2, 5, 10, 30, 60],
  registers: [register]
});

const refundTotal = new promClient.Counter({
  name: 'refunds_total',
  help: 'Total number of refunds',
  labelNames: ['status', 'reason'],
  registers: [register]
});

const idempotencyHits = new promClient.Counter({
  name: 'idempotency_hits_total',
  help: 'Total number of idempotency key hits',
  registers: [register]
});

const activeConnections = new promClient.Gauge({
  name: 'active_connections',
  help: 'Number of active connections',
  registers: [register]
});

const databaseConnections = new promClient.Gauge({
  name: 'database_connections',
  help: 'Number of database connections',
  labelNames: ['state'],
  registers: [register]
});

const redisConnections = new promClient.Gauge({
  name: 'redis_connections',
  help: 'Number of Redis connections',
  labelNames: ['state'],
  registers: [register]
});

const externalServiceRequests = new promClient.Counter({
  name: 'external_service_requests_total',
  help: 'Total number of external service requests',
  labelNames: ['service', 'method', 'status'],
  registers: [register]
});

const externalServiceDuration = new promClient.Histogram({
  name: 'external_service_duration_seconds',
  help: 'External service request duration in seconds',
  labelNames: ['service', 'method'],
  buckets: [0.1, 0.5, 1, 2, 5, 10, 30],
  registers: [register]
});

// Initialize metrics
const initialize = () => {
  // Set initial values
  activeConnections.set(0);
  databaseConnections.set({ state: 'connected' }, 1);
  redisConnections.set({ state: 'connected' }, 1);
};

// Helper functions
const recordPayment = (status, paymentMethod, gateway, amount, currency, duration) => {
  paymentTotal.inc({ status, payment_method: paymentMethod, gateway });
  if (amount) {
    paymentAmount.observe({ currency, payment_method: paymentMethod }, amount);
  }
  if (duration) {
    paymentDuration.observe({ payment_method: paymentMethod, gateway, status }, duration);
  }
};

const recordRefund = (status, reason) => {
  refundTotal.inc({ status, reason });
};

const recordIdempotencyHit = () => {
  idempotencyHits.inc();
};

const recordExternalServiceRequest = (service, method, status, duration) => {
  externalServiceRequests.inc({ service, method, status });
  if (duration) {
    externalServiceDuration.observe({ service, method }, duration);
  }
};

const updateActiveConnections = (count) => {
  activeConnections.set(count);
};

const updateDatabaseConnections = (state, count) => {
  databaseConnections.set({ state }, count);
};

const updateRedisConnections = (state, count) => {
  redisConnections.set({ state }, count);
};

module.exports = {
  register,
  initialize,
  recordPayment,
  recordRefund,
  recordIdempotencyHit,
  recordExternalServiceRequest,
  updateActiveConnections,
  updateDatabaseConnections,
  updateRedisConnections,
  // Export individual metrics for direct use
  paymentTotal,
  paymentAmount,
  paymentDuration,
  refundTotal,
  idempotencyHits,
  activeConnections,
  databaseConnections,
  redisConnections,
  externalServiceRequests,
  externalServiceDuration
};
