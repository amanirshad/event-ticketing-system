const Payment = require('../models/Payment');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const paypal = require('paypal-rest-sdk');
const logger = require('../utils/logger');
const metrics = require('../utils/metrics');
const { v4: uuidv4 } = require('uuid');
const axios = require('axios');

// Configure PayPal
paypal.configure({
  mode: process.env.PAYPAL_MODE || 'sandbox',
  client_id: process.env.PAYPAL_CLIENT_ID,
  client_secret: process.env.PAYPAL_CLIENT_SECRET
});

class PaymentService {
  // Create a new payment
  async createPayment(paymentData) {
    try {
      const startTime = Date.now();
      
      const payment = new Payment({
        ...paymentData,
        paymentId: `pay_${Date.now()}_${uuidv4().substr(0, 8)}`
      });

      await payment.save();
      
      const duration = (Date.now() - startTime) / 1000;
      metrics.recordPayment('created', payment.paymentMethod, 'internal', payment.amount, payment.currency, duration);
      
      logger.info('Payment created', {
        paymentId: payment.paymentId,
        orderId: payment.orderId,
        userId: payment.userId,
        amount: payment.amount,
        correlationId: payment.correlationId
      });
      
      return payment;
    } catch (error) {
      logger.error('Error creating payment:', {
        error: error.message,
        orderId: paymentData.orderId,
        correlationId: paymentData.correlationId
      });
      throw error;
    }
  }

  // Process payment with Stripe
  async processStripePayment(paymentId, paymentMethodId) {
    const startTime = Date.now();
    let payment;
    try {
      payment = await Payment.findById(paymentId);
      if (!payment) {
        throw new Error('Payment not found');
      }

      if (payment.status !== 'PENDING') {
        throw new Error('Payment is not in pending status');
      }

      // Test mode: Simulate successful payment if Stripe key is invalid/test
      if (process.env.PAYMENT_TEST_MODE === 'true' || 
          (process.env.STRIPE_SECRET_KEY && process.env.STRIPE_SECRET_KEY.includes('test_your_stripe'))) {
        logger.info('Test mode: Simulating successful Stripe payment', {
          paymentId: payment.paymentId,
          correlationId: payment.correlationId
        });
        
        payment.status = 'SUCCESS';
        payment.processedAt = new Date();
        payment.gatewayTransactionId = `pi_test_${Date.now()}`;
        payment.gatewayResponse = { 
          id: payment.gatewayTransactionId,
          status: 'succeeded',
          amount: payment.amount,
          currency: payment.currency
        };
        
        await payment.save();
        const duration = (Date.now() - startTime) / 1000;
        metrics.recordPayment('SUCCESS', payment.paymentMethod, 'stripe', payment.amount, payment.currency, duration);
        
        return payment;
      }

      // Process payment - keep status as PENDING until we know the result
      const paymentIntent = await stripe.paymentIntents.create({
        amount: payment.amount,
        currency: payment.currency.toLowerCase(),
        payment_method: paymentMethodId,
        confirmation_method: 'manual',
        confirm: true,
        description: payment.description,
        metadata: {
          paymentId: payment.paymentId,
          orderId: payment.orderId,
          userId: payment.userId
        }
      });

      payment.gatewayTransactionId = paymentIntent.id;
      payment.gatewayResponse = paymentIntent;

      if (paymentIntent.status === 'succeeded') {
        payment.status = 'SUCCESS';
        payment.processedAt = new Date();
      } else if (paymentIntent.status === 'requires_action') {
        payment.status = 'PENDING';
      } else {
        payment.status = 'FAILED';
        payment.failureReason = paymentIntent.last_payment_error?.message || 'Payment failed';
      }

      await payment.save();
      
      const duration = (Date.now() - startTime) / 1000;
      metrics.recordPayment(payment.status, payment.paymentMethod, 'stripe', payment.amount, payment.currency, duration);
      
      logger.info('Stripe payment processed', {
        paymentId: payment.paymentId,
        status: payment.status,
        gatewayTransactionId: payment.gatewayTransactionId,
        correlationId: payment.correlationId
      });
      
      return payment;
    } catch (error) {
      const duration = (Date.now() - startTime) / 1000;
      
      // Mark payment as failed if it exists
      if (payment) {
        payment.status = 'FAILED';
        payment.failureReason = error.message;
        await payment.save().catch(err => logger.error('Failed to save payment status:', err));
      }
      
      metrics.recordPayment('FAILED', 'stripe', 'stripe', null, null, duration);
      
      logger.error('Error processing Stripe payment:', {
        error: error.message,
        paymentId,
        correlationId: payment ? payment.correlationId : undefined
      });
      throw error;
    }
  }

  // Process payment with PayPal
  async processPayPalPayment(paymentId) {
    const startTime = Date.now();
    let payment;
    try {
      payment = await Payment.findById(paymentId);
      if (!payment) {
        throw new Error('Payment not found');
      }

      if (payment.status !== 'PENDING') {
        throw new Error('Payment is not in pending status');
      }

      // Test mode: Simulate successful payment if PayPal credentials are not configured
      if (process.env.PAYMENT_TEST_MODE === 'true' || 
          !process.env.PAYPAL_CLIENT_ID || 
          process.env.PAYPAL_CLIENT_ID.includes('your_paypal')) {
        logger.info('Test mode: Simulating successful PayPal payment', {
          paymentId: payment.paymentId,
          correlationId: payment.correlationId
        });
        
        payment.status = 'SUCCESS';
        payment.processedAt = new Date();
        payment.gatewayTransactionId = `PAYPAL_TEST_${Date.now()}`;
        payment.gatewayResponse = { 
          id: payment.gatewayTransactionId,
          state: 'approved',
          amount: {
            total: (payment.amount / 100).toFixed(2),
            currency: payment.currency
          }
        };
        await payment.save();
        
        const duration = (Date.now() - startTime) / 1000;
        metrics.recordPayment('SUCCESS', payment.paymentMethod, 'paypal', payment.amount, payment.currency, duration);
        
        return payment;
      }

      // Process payment - keep status as PENDING until we know the result
      const createPayment = {
        intent: 'sale',
        payer: {
          payment_method: 'paypal'
        },
        transactions: [{
          amount: {
            total: (payment.amount / 100).toFixed(2),
            currency: payment.currency
          },
          description: payment.description,
          custom: payment.paymentId
        }],
        redirect_urls: {
          return_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/payment/success`,
          cancel_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/payment/cancel`
        }
      };

      return new Promise((resolve, reject) => {
        paypal.payment.create(createPayment, (error, paymentResponse) => {
          const duration = (Date.now() - startTime) / 1000;
          
          if (error) {
            payment.status = 'FAILED';
            payment.failureReason = error.message;
            payment.save();
            
            metrics.recordPayment('FAILED', payment.paymentMethod, 'paypal', payment.amount, payment.currency, duration);
            reject(error);
          } else {
            payment.gatewayTransactionId = paymentResponse.id;
            payment.gatewayResponse = paymentResponse;
            payment.save();
            
            metrics.recordPayment('PENDING', payment.paymentMethod, 'paypal', payment.amount, payment.currency, duration);
            resolve(paymentResponse);
          }
        });
      });
    } catch (error) {
      const duration = (Date.now() - startTime) / 1000;
      
      // Mark payment as failed if it exists
      if (payment) {
        payment.status = 'FAILED';
        payment.failureReason = error.message;
        await payment.save().catch(err => logger.error('Failed to save payment status:', err));
      }
      
      metrics.recordPayment('FAILED', 'paypal', 'paypal', null, null, duration);
      
      logger.error('Error processing PayPal payment:', {
        error: error.message,
        paymentId,
        correlationId: payment ? payment.correlationId : undefined
      });
      throw error;
    }
  }

  // Execute PayPal payment
  async executePayPalPayment(paymentId, payerId) {
    const startTime = Date.now();
    let payment;
    try {
      payment = await Payment.findOne({ gatewayTransactionId: paymentId });
      if (!payment) {
        throw new Error('Payment not found');
      }

      const executePayment = {
        payer_id: payerId
      };

      return new Promise((resolve, reject) => {
        paypal.payment.execute(paymentId, executePayment, (error, paymentResponse) => {
          const duration = (Date.now() - startTime) / 1000;
          
          if (error) {
            payment.status = 'FAILED';
            payment.failureReason = error.message;
            payment.save();
            
            metrics.recordPayment('FAILED', payment.paymentMethod, 'paypal', payment.amount, payment.currency, duration);
            reject(error);
          } else {
            payment.status = 'SUCCESS';
            payment.processedAt = new Date();
            payment.gatewayResponse = paymentResponse;
            payment.save();
            
            metrics.recordPayment('SUCCESS', payment.paymentMethod, 'paypal', payment.amount, payment.currency, duration);
            resolve(payment);
          }
        });
      });
    } catch (error) {
      const duration = (Date.now() - startTime) / 1000;
      metrics.recordPayment('FAILED', 'paypal', 'paypal', null, null, duration);
      
      logger.error('Error executing PayPal payment:', {
        error: error.message,
        paymentId,
        correlationId: payment ? payment.correlationId : undefined
      });
      throw error;
    }
  }

  // Process payment charge (main endpoint)
  async processCharge(chargeData) {
    try {
      const { orderId, amount, currency, paymentMethod, paymentMethodId, description, metadata } = chargeData;
      
      // Create payment record
      const payment = await this.createPayment({
        orderId,
        userId: chargeData.userId,
        amount,
        currency,
        paymentMethod,
        description,
        metadata,
        idempotencyKey: chargeData.idempotencyKey,
        correlationId: chargeData.correlationId
      });

      // Process payment based on method
      let result;
      if (paymentMethod === 'stripe') {
        result = await this.processStripePayment(payment._id, paymentMethodId);
      } else if (paymentMethod === 'paypal') {
        result = await this.processPayPalPayment(payment._id);
      } else if (paymentMethod === 'bank_transfer' || paymentMethod === 'credit_card') {
        // For bank transfers and credit cards, payment remains PENDING for manual processing
        // In test mode, simulate success after a delay
        if (process.env.PAYMENT_TEST_MODE === 'true') {
          logger.info('Test mode: Simulating successful payment', {
            paymentId: payment.paymentId,
            paymentMethod,
            correlationId: payment.correlationId
          });
          
          payment.status = 'SUCCESS';
          payment.processedAt = new Date();
          payment.gatewayTransactionId = `${paymentMethod.toUpperCase()}_TEST_${Date.now()}`;
          payment.gatewayResponse = { 
            id: payment.gatewayTransactionId,
            status: 'success',
            amount: payment.amount,
            currency: payment.currency
          };
          await payment.save();
          
          result = payment;
        } else {
          // In production, bank transfers remain PENDING for manual processing
          result = payment;
        }
      } else {
        throw new Error('Unsupported payment method');
      }

      // Notify order service of payment result
      await this.notifyOrderService(payment.orderId, payment.status, payment.paymentId);

      return result;
    } catch (error) {
      logger.error('Error processing charge:', {
        error: error.message,
        orderId: chargeData.orderId,
        correlationId: chargeData.correlationId
      });
      throw error;
    }
  }

  // Refund payment
  async refundPayment(paymentId, refundData = {}) {
    const startTime = Date.now();
    let payment;
    try {
      // Try to find by MongoDB _id first (if it's a valid ObjectId)
      if (paymentId.match(/^[0-9a-fA-F]{24}$/)) {
        payment = await Payment.findById(paymentId);
      }
      
      // If not found by _id, try to find by paymentId field
      if (!payment) {
        payment = await Payment.findOne({ paymentId: paymentId });
      }
      
      if (!payment) {
        throw new Error('Payment not found');
      }

      if (payment.status !== 'SUCCESS') {
        throw new Error('Only successful payments can be refunded');
      }

      const refundAmount = refundData.amount || payment.amount;
      const reason = refundData.reason || 'requested_by_customer';

      // Validate refund amount doesn't exceed payment amount
      if (refundAmount > payment.amount) {
        throw new Error(`Refund amount (${refundAmount}) cannot exceed payment amount (${payment.amount})`);
      }

      // Check if payment is already fully refunded
      const totalRefunded = payment.refunds
        .filter(refund => refund.status === 'SUCCESS')
        .reduce((total, refund) => total + refund.amount, 0);
      
      if (totalRefunded + refundAmount > payment.amount) {
        throw new Error(`Refund amount would exceed payment amount. Already refunded: ${totalRefunded}, Requested: ${refundAmount}, Payment total: ${payment.amount}`);
      }

      if (payment.paymentMethod === 'stripe') {
        // Test mode: Simulate successful refund if Stripe key is invalid/test
        if (process.env.PAYMENT_TEST_MODE === 'true' || 
            (process.env.STRIPE_SECRET_KEY && process.env.STRIPE_SECRET_KEY.includes('test_your_stripe'))) {
          logger.info('Test mode: Simulating successful Stripe refund', {
            paymentId: payment.paymentId,
            refundAmount,
            correlationId: payment.correlationId
          });
          
          await payment.addRefund({
            amount: refundAmount,
            reason: reason,
            gatewayRefundId: `re_test_${Date.now()}`,
            status: 'SUCCESS'
          });
          
          // Reload payment to get updated refunds
          payment = await Payment.findById(payment._id);
          
          // Check if this makes it a full refund
          const newTotalRefunded = payment.refunds
            .filter(refund => refund.status === 'SUCCESS')
            .reduce((total, refund) => total + refund.amount, 0);
          
          if (newTotalRefunded >= payment.amount) {
            payment.status = 'REFUNDED';
          }
          await payment.save();
        } else {
          const refund = await stripe.refunds.create({
            payment_intent: payment.gatewayTransactionId,
            amount: refundAmount,
            reason: reason
          });

          await payment.addRefund({
            amount: refundAmount,
            reason: reason,
            gatewayRefundId: refund.id,
            status: refund.status === 'succeeded' ? 'SUCCESS' : 'PENDING'
          });

          if (refund.status === 'succeeded') {
            // If full refund, mark payment as REFUNDED
            if (refundAmount >= payment.amount) {
              payment.status = 'REFUNDED';
            }
            await payment.save();
          }
        }
      } else if (payment.paymentMethod === 'paypal') {
        // PayPal refund logic would go here
        await payment.addRefund({
          amount: refundAmount,
          reason: reason,
          status: 'PENDING'
        });
      }

      const duration = (Date.now() - startTime) / 1000;
      metrics.recordRefund('SUCCESS', reason);
      
      logger.info('Payment refunded', {
        paymentId: payment.paymentId,
        refundAmount,
        reason,
        correlationId: payment.correlationId
      });
      
      return payment;
    } catch (error) {
      const duration = (Date.now() - startTime) / 1000;
      metrics.recordRefund('FAILED', refundData.reason || 'unknown');
      
      logger.error('Error refunding payment:', {
        error: error.message,
        paymentId,
        correlationId: payment ? payment.correlationId : undefined
      });
      throw error;
    }
  }

  // Get payment by ID (accepts either MongoDB _id or paymentId field)
  async getPaymentById(paymentId) {
    try {
      // Try to find by MongoDB _id first (if it's a valid ObjectId)
      let payment = null;
      if (paymentId.match(/^[0-9a-fA-F]{24}$/)) {
        payment = await Payment.findById(paymentId);
      }
      
      // If not found by _id, try to find by paymentId field
      if (!payment) {
        payment = await Payment.findOne({ paymentId: paymentId });
      }
      
      if (!payment) {
        throw new Error('Payment not found');
      }
      return payment;
    } catch (error) {
      logger.error('Error getting payment:', {
        error: error.message,
        paymentId
      });
      throw error;
    }
  }

  // Get payments by order
  async getPaymentsByOrder(orderId) {
    try {
      const payments = await Payment.findByOrder(orderId);
      return payments;
    } catch (error) {
      logger.error('Error getting payments by order:', {
        error: error.message,
        orderId
      });
      throw error;
    }
  }

  // Get payments by user
  async getPaymentsByUser(userId, page = 1, limit = 10) {
    try {
      const skip = (page - 1) * limit;
      const payments = await Payment.find({ userId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

      const total = await Payment.countDocuments({ userId });
      
      return {
        payments,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      logger.error('Error getting user payments:', {
        error: error.message,
        userId
      });
      throw error;
    }
  }

  // Update payment status
  async updatePaymentStatus(paymentId, statusData) {
    try {
      const { status, reason, metadata = {} } = statusData;
      
      // Try to find by MongoDB _id first (if it's a valid ObjectId)
      let payment;
      if (paymentId.match(/^[0-9a-fA-F]{24}$/)) {
        payment = await Payment.findById(paymentId);
      }
      
      // If not found by _id, try to find by custom paymentId field
      if (!payment) {
        payment = await Payment.findOne({ paymentId });
      }
      
      if (!payment) {
        throw new Error('Payment not found');
      }

      // Include reason in metadata if provided
      const updatedMetadata = { ...metadata };
      if (reason) {
        updatedMetadata.reason = reason;
      }
      
      await payment.updateStatus(status, updatedMetadata);
      
      logger.info('Payment status updated', {
        paymentId: payment.paymentId,
        status,
        correlationId: payment.correlationId
      });
      
      return payment;
    } catch (error) {
      logger.error('Error updating payment status:', {
        error: error.message,
        paymentId
      });
      throw error;
    }
  }

  // Get payment statistics
  async getPaymentStats(userId = null, startDate = null, endDate = null) {
    try {
      const stats = await Payment.getStats(userId, startDate, endDate);
      
      const totalPayments = await Payment.countDocuments(
        userId ? { userId } : {}
      );
      
      const totalAmount = await Payment.aggregate([
        { $match: { status: 'SUCCESS', ...(userId && { userId }) } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]);

      return {
        byStatus: stats,
        totalPayments,
        totalAmount: totalAmount[0]?.total || 0
      };
    } catch (error) {
      logger.error('Error getting payment stats:', {
        error: error.message,
        userId
      });
      throw error;
    }
  }

  // Notify order service
  async notifyOrderService(orderId, paymentStatus, paymentId) {
    const startTime = Date.now();
    try {
      const response = await axios.post(`${process.env.ORDER_SERVICE_URL}/api/orders/${orderId}/payment-status`, {
        paymentId,
        status: paymentStatus,
        timestamp: new Date().toISOString()
      }, {
        headers: {
          'Content-Type': 'application/json',
          'X-Service-Name': 'payment-service'
        },
        timeout: 5000
      });

      const duration = (Date.now() - startTime) / 1000;
      metrics.recordExternalServiceRequest('order-service', 'POST', 'success', duration);
      
      logger.info('Order service notified', {
        orderId,
        paymentStatus,
        paymentId,
        responseStatus: response.status
      });
      
      return response.data;
    } catch (error) {
      const duration = (Date.now() - startTime) / 1000;
      metrics.recordExternalServiceRequest('order-service', 'POST', 'error', duration);
      
      logger.error('Failed to notify order service:', {
        error: error.message,
        orderId,
        paymentStatus,
        paymentId
      });
      
      // Don't throw error - this is a notification, not critical
    }
  }

  // Handle webhook events
  async handleWebhook(eventType, eventData) {
    try {
      logger.info('Processing webhook event', {
        eventType,
        eventData
      });

      switch (eventType) {
        case 'payment_intent.succeeded':
          await this.handleStripePaymentSuccess(eventData);
          break;
        case 'payment_intent.payment_failed':
          await this.handleStripePaymentFailed(eventData);
          break;
        default:
          logger.info('Unhandled webhook event type', { eventType });
      }
    } catch (error) {
      logger.error('Error handling webhook:', {
        error: error.message,
        eventType,
        eventData
      });
      throw error;
    }
  }

  // Handle Stripe payment success
  async handleStripePaymentSuccess(eventData) {
    const paymentIntent = eventData.data.object;
    const payment = await Payment.findOne({ gatewayTransactionId: paymentIntent.id });
    
    if (payment) {
      await payment.updateStatus('SUCCESS');
      await this.notifyOrderService(payment.orderId, 'SUCCESS', payment.paymentId);
    }
  }

  // Handle Stripe payment failure
  async handleStripePaymentFailed(eventData) {
    const paymentIntent = eventData.data.object;
    const payment = await Payment.findOne({ gatewayTransactionId: paymentIntent.id });
    
    if (payment) {
      await payment.updateStatus('FAILED', {
        failureReason: paymentIntent.last_payment_error?.message
      });
      await this.notifyOrderService(payment.orderId, 'FAILED', payment.paymentId);
    }
  }
}

module.exports = new PaymentService();
