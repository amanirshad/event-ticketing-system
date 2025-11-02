// ./config/database.js
const mongoose = require('mongoose');
const logger = require('../utils/logger');

const uri = process.env.MONGODB_URI || 'mongodb://mongodb:27017/payment-service';

module.exports = async function connectDB() {
  try {
    // If you want a DB name, either include it in URI or pass dbName here
    const conn = await mongoose.connect(uri);
    logger.info('[Mongo] connected');
  } catch (err) {
    logger.error('[Mongo] connection error:', err.message);
    throw err; // surface to caller
  }

  mongoose.connection.on('error', (err) => {
    logger.error('[Mongo] runtime error:', err);
  });
  mongoose.connection.on('disconnected', () => {
    logger.warn('[Mongo] disconnected');
  });
};