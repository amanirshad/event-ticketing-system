// ./config/redis.js
const { createClient } = require('redis');
const logger = require('../utils/logger');

let redisClient = null;

const connectRedis = async () => {
  try {
    const redisUrl = process.env.REDIS_URL || 'redis://redis:6379'; // ✅ inside docker, use service name 'redis'
    const redisPassword = process.env.REDIS_PASSWORD || undefined;

    redisClient = createClient({
      url: redisUrl,
      password: redisPassword,
    });

    // ---------- Event handlers ----------
    redisClient.on('connect', () => logger.info('[Redis] Connecting...'));
    redisClient.on('ready', () => logger.info('[Redis] Connected and ready'));
    redisClient.on('error', (err) => logger.error('[Redis] Error:', err));
    redisClient.on('end', () => logger.warn('[Redis] Connection closed'));

    // ---------- Connect ----------
    await redisClient.connect();
    logger.info('[Redis] Connection successful');

    // ✅ Optional: export globally if other files need it
    global.redisClient = redisClient;

    return redisClient;
  } catch (error) {
    logger.error('[Redis] Connection failed:', error);
    throw error;
  }
};

const getRedisClient = () => {
  if (!redisClient) {
    throw new Error('[Redis] Client not initialized');
  }
  return redisClient;
};

module.exports = { connectRedis, getRedisClient };