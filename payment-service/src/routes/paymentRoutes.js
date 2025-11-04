const express = require('express');
const paymentController = require('../controllers/paymentController');
const { validateRequest, paymentSchemas } = require('../middleware/validation');

const router = express.Router();

// Process payment charge (main endpoint with idempotency)
router.post('/charge',
  validateRequest(paymentSchemas.processCharge),
  paymentController.processCharge
);

// Process Stripe payment
router.post('/stripe/:paymentId/process',
  validateRequest(paymentSchemas.processStripePayment),
  paymentController.processStripePayment
);

// Execute PayPal payment
router.post('/paypal/:paymentId/execute',
  validateRequest(paymentSchemas.executePayPalPayment),
  paymentController.executePayPalPayment
);

// Get payment by ID
router.get('/:paymentId',
  paymentController.getPaymentById
);

// Get payments by order
router.get('/order/:orderId',
  paymentController.getPaymentsByOrder
);

// Get user payments
router.get('/',
  paymentController.getUserPayments
);

// Refund payment
router.post('/:paymentId/refund',
  validateRequest(paymentSchemas.refundPayment),
  paymentController.refundPayment
);

// Update payment status (admin only)
router.patch('/:paymentId/status',
  validateRequest(paymentSchemas.updatePaymentStatus),
  paymentController.updatePaymentStatus
);

// Get payment statistics
router.get('/stats/overview',
  paymentController.getPaymentStats
);

// Get all payments (admin only)
router.get('/admin/all',
  paymentController.getAllPayments
);

// Handle webhook events
router.post('/webhook',
  paymentController.handleWebhook
);

module.exports = router;
