const request = require('supertest');
const app = require('../app');
const Payment = require('../models/Payment');

describe('Payment API', () => {
  let authToken;
  let testPayment;

  beforeAll(() => {
    // Mock JWT token for testing
    authToken = 'mock-jwt-token';
  });

  beforeEach(async () => {
    // Create a test payment
    testPayment = new Payment({
      paymentId: 'test_payment_123',
      orderId: 'test_order_123',
      userId: 'test_user_123',
      amount: 10000, // $100.00
      currency: 'USD',
      paymentMethod: 'stripe',
      status: 'PENDING',
      idempotencyKey: 'test-idempotency-key',
      correlationId: 'test-correlation-id'
    });
    await testPayment.save();
  });

  describe('POST /api/payments/charge', () => {
    it('should create a new payment with idempotency', async () => {
      const paymentData = {
        orderId: 'order_123',
        amount: 20000, // $200.00
        currency: 'USD',
        paymentMethod: 'stripe',
        paymentMethodId: 'pm_test_123',
        description: 'Test payment'
      };

      const response = await request(app)
        .post('/api/payments/charge')
        .set('Authorization', `Bearer ${authToken}`)
        .set('Idempotency-Key', 'test-idempotency-key-123')
        .send(paymentData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.amount).toBe(20000);
      expect(response.body.data.currency).toBe('USD');
      expect(response.body.data.paymentId).toBeDefined();
    });

    it('should return validation error for invalid data', async () => {
      const invalidData = {
        amount: -100,
        currency: 'INVALID',
        paymentMethod: 'invalid_method'
      };

      const response = await request(app)
        .post('/api/payments/charge')
        .set('Authorization', `Bearer ${authToken}`)
        .set('Idempotency-Key', 'test-idempotency-key-456')
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.details).toBeDefined();
    });

    it('should require idempotency key', async () => {
      const paymentData = {
        orderId: 'order_123',
        amount: 20000,
        currency: 'USD',
        paymentMethod: 'stripe'
      };

      const response = await request(app)
        .post('/api/payments/charge')
        .set('Authorization', `Bearer ${authToken}`)
        .send(paymentData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Idempotency-Key');
    });
  });

  describe('GET /api/payments', () => {
    it('should get user payments', async () => {
      const response = await request(app)
        .get('/api/payments')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data.payments)).toBe(true);
    });

    it('should support pagination', async () => {
      const response = await request(app)
        .get('/api/payments?page=1&limit=5')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.pagination).toBeDefined();
      expect(response.body.data.pagination.page).toBe(1);
      expect(response.body.data.pagination.limit).toBe(5);
    });
  });

  describe('GET /api/payments/:paymentId', () => {
    it('should get payment by ID', async () => {
      const response = await request(app)
        .get(`/api/payments/${testPayment._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.paymentId).toBe(testPayment.paymentId);
    });

    it('should return 404 for non-existent payment', async () => {
      const response = await request(app)
        .get('/api/payments/507f1f77bcf86cd799439011')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/payments/:paymentId/refund', () => {
    it('should refund a successful payment', async () => {
      // First, make the payment successful
      testPayment.status = 'SUCCESS';
      await testPayment.save();

      const refundData = {
        amount: 5000, // $50.00
        reason: 'requested_by_customer'
      };

      const response = await request(app)
        .post(`/api/payments/${testPayment._id}/refund`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(refundData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.refunds).toHaveLength(1);
    });

    it('should not refund a pending payment', async () => {
      const refundData = {
        amount: 5000,
        reason: 'requested_by_customer'
      };

      const response = await request(app)
        .post(`/api/payments/${testPayment._id}/refund`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(refundData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/payments/stats/overview', () => {
    it('should get payment statistics', async () => {
      const response = await request(app)
        .get('/api/payments/stats/overview')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.byStatus).toBeDefined();
      expect(response.body.data.totalPayments).toBeDefined();
    });
  });

  describe('GET /health', () => {
    it('should return health status', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body.service).toBe('payment-service');
      expect(response.body.message).toBe('OK');
    });
  });

  describe('GET /metrics', () => {
    it('should return Prometheus metrics', async () => {
      const response = await request(app)
        .get('/metrics')
        .expect(200);

      expect(response.text).toContain('payments_total');
      expect(response.text).toContain('payment_amount');
    });
  });
});
