const express = require('express');
const { register } = require('../utils/metrics');

const router = express.Router();

// Prometheus metrics endpoint
router.get('/', async (req, res) => {
  try {
    res.set('Content-Type', register.contentType);
    const metrics = await register.metrics();
    res.end(metrics);
  } catch (error) {
    res.status(500).end('Error generating metrics');
  }
});

module.exports = router;
