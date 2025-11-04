const paymentService = require('../services/paymentService');
const logger = require('../utils/logger');
const metrics = require('../utils/metrics');

class PaymentController {
  // Process payment charge
  async processCharge(req, res) {
    const startTime = Date.now();
    try {
      
      const chargeData = {
        ...req.body,
        userId: req.user?.id || req.body.userId || 'unknown',
        idempotencyKey: req.headers['idempotency-key'] || req.headers['Idempotency-Key'],
        correlationId: req.correlationId
      };

      const payment = await paymentService.processCharge(chargeData);
      
      const duration = (Date.now() - startTime) / 1000;
      metrics.recordPayment('SUCCESS', payment.paymentMethod, payment.paymentMethod, payment.amount, payment.currency, duration);
      
      res.status(201).json({
        success: true,
        message: 'Payment processed successfully',
        data: {
          paymentId: payment.paymentId,
          status: payment.status,
          amount: payment.amount,
          currency: payment.currency,
          gatewayTransactionId: payment.gatewayTransactionId,
          expiresAt: payment.expiresAt
        },
        correlationId: req.correlationId
      });
    } catch (error) {
      const duration = (Date.now() - startTime) / 1000;
      metrics.recordPayment('FAILED', req.body.paymentMethod || 'unknown', 'unknown', null, null, duration);
      
      logger.error('Error in processCharge controller:', {
        error: error.message,
        orderId: req.body.orderId,
        correlationId: req.correlationId
      });
      
      res.status(400).json({
        success: false,
        message: error.message,
        correlationId: req.correlationId
      });
    }
  }

  // Process Stripe payment
  async processStripePayment(req, res) {
    try {
      const { paymentId } = req.params;
      const { paymentMethodId } = req.body;

      const payment = await paymentService.getPaymentById(paymentId);
      
      if (payment.userId !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: 'Access denied',
          correlationId: req.correlationId
        });
      }

      const result = await paymentService.processStripePayment(paymentId, paymentMethodId);
      
      res.json({
        success: true,
        message: 'Stripe payment processed successfully',
        data: result,
        correlationId: req.correlationId
      });
    } catch (error) {
      logger.error('Error in processStripePayment controller:', {
        error: error.message,
        paymentId: req.params.paymentId,
        correlationId: req.correlationId
      });
      
      res.status(400).json({
        success: false,
        message: error.message,
        correlationId: req.correlationId
      });
    }
  }

  // Execute PayPal payment
  async executePayPalPayment(req, res) {
    try {
      const { paymentId } = req.params;
      const { payerId } = req.body;

      const result = await paymentService.executePayPalPayment(paymentId, payerId);
      
      res.json({
        success: true,
        message: 'PayPal payment executed successfully',
        data: result,
        correlationId: req.correlationId
      });
    } catch (error) {
      logger.error('Error in executePayPalPayment controller:', {
        error: error.message,
        paymentId: req.params.paymentId,
        correlationId: req.correlationId
      });
      
      res.status(400).json({
        success: false,
        message: error.message,
        correlationId: req.correlationId
      });
    }
  }

  // Get payment by ID
  async getPaymentById(req, res) {
    try {
      const { paymentId } = req.params;
      const payment = await paymentService.getPaymentById(paymentId);
      
      if (payment.userId !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: 'Access denied',
          correlationId: req.correlationId
        });
      }

      res.json({
        success: true,
        data: payment,
        correlationId: req.correlationId
      });
    } catch (error) {
      logger.error('Error in getPaymentById controller:', {
        error: error.message,
        paymentId: req.params.paymentId,
        correlationId: req.correlationId
      });
      
      res.status(404).json({
        success: false,
        message: error.message,
        correlationId: req.correlationId
      });
    }
  }

  // Get payments by order
  async getPaymentsByOrder(req, res) {
    try {
      const { orderId } = req.params;
      const payments = await paymentService.getPaymentsByOrder(orderId);
      
      res.json({
        success: true,
        data: payments,
        correlationId: req.correlationId
      });
    } catch (error) {
      logger.error('Error in getPaymentsByOrder controller:', {
        error: error.message,
        orderId: req.params.orderId,
        correlationId: req.correlationId
      });
      
      res.status(500).json({
        success: false,
        message: error.message,
        correlationId: req.correlationId
      });
    }
  }

  // Get user payments
  async getUserPayments(req, res) {
    try {
      const { page = 1, limit = 10 } = req.query;
      const result = await paymentService.getPaymentsByUser(
        req.user.id,
        parseInt(page),
        parseInt(limit)
      );

      res.json({
        success: true,
        data: result,
        correlationId: req.correlationId
      });
    } catch (error) {
      logger.error('Error in getUserPayments controller:', {
        error: error.message,
        userId: req.user.id,
        correlationId: req.correlationId
      });
      
      res.status(500).json({
        success: false,
        message: error.message,
        correlationId: req.correlationId
      });
    }
  }

  // Refund payment
  async refundPayment(req, res) {
    try {
      const { paymentId } = req.params;
      const refundData = req.body;

      const payment = await paymentService.getPaymentById(paymentId);
      
      if (payment.userId !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: 'Access denied',
          correlationId: req.correlationId
        });
      }

      const result = await paymentService.refundPayment(paymentId, refundData);
      
      res.json({
        success: true,
        message: 'Payment refunded successfully',
        data: result,
        correlationId: req.correlationId
      });
    } catch (error) {
      logger.error('Error in refundPayment controller:', {
        error: error.message,
        paymentId: req.params.paymentId,
        correlationId: req.correlationId
      });
      
      res.status(400).json({
        success: false,
        message: error.message,
        correlationId: req.correlationId
      });
    }
  }

  // Update payment status (admin only)
  async updatePaymentStatus(req, res) {
    try {
      const { paymentId } = req.params;
      const statusData = req.body;

      const result = await paymentService.updatePaymentStatus(paymentId, statusData);
      
      res.json({
        success: true,
        message: 'Payment status updated successfully',
        data: result,
        correlationId: req.correlationId
      });
    } catch (error) {
      logger.error('Error in updatePaymentStatus controller:', {
        error: error.message,
        paymentId: req.params.paymentId,
        correlationId: req.correlationId
      });
      
      res.status(400).json({
        success: false,
        message: error.message,
        correlationId: req.correlationId
      });
    }
  }

  // Get payment statistics
  async getPaymentStats(req, res) {
    try {
      const { startDate, endDate } = req.query;
      const userId = req.user.role === 'admin' ? null : req.user.id;
      
      const stats = await paymentService.getPaymentStats(userId, startDate, endDate);
      
      res.json({
        success: true,
        data: stats,
        correlationId: req.correlationId
      });
    } catch (error) {
      logger.error('Error in getPaymentStats controller:', {
        error: error.message,
        userId: req.user.id,
        correlationId: req.correlationId
      });
      
      res.status(500).json({
        success: false,
        message: error.message,
        correlationId: req.correlationId
      });
    }
  }

  // Handle webhook events
  async handleWebhook(req, res) {
    try {
      const { eventType, eventData } = req.body;
      
      await paymentService.handleWebhook(eventType, eventData);
      
      res.json({
        success: true,
        message: 'Webhook processed successfully',
        correlationId: req.correlationId
      });
    } catch (error) {
      logger.error('Error in handleWebhook controller:', {
        error: error.message,
        eventType: req.body.eventType,
        correlationId: req.correlationId
      });
      
      res.status(400).json({
        success: false,
        message: error.message,
        correlationId: req.correlationId
      });
    }
  }

  // Get all payments (admin only)
  async getAllPayments(req, res) {
    try {
      const { page = 1, limit = 10, status, userId } = req.query;
      
      const matchStage = {};
      if (status) matchStage.status = status;
      if (userId) matchStage.userId = userId;

      const skip = (parseInt(page) - 1) * parseInt(limit);
      const Payment = require('../models/Payment');
      
      const payments = await Payment.find(matchStage)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit));

      const total = await Payment.countDocuments(matchStage);
      
      res.json({
        success: true,
        data: {
          payments,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            pages: Math.ceil(total / parseInt(limit))
          }
        },
        correlationId: req.correlationId
      });
    } catch (error) {
      logger.error('Error in getAllPayments controller:', {
        error: error.message,
        correlationId: req.correlationId
      });
      
      res.status(500).json({
        success: false,
        message: error.message,
        correlationId: req.correlationId
      });
    }
  }
}

module.exports = new PaymentController();
