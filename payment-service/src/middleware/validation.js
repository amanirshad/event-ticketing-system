const Joi = require('joi');

const validateRequest = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        details: error.details.map(detail => detail.message),
        correlationId: req.correlationId
      });
    }
    next();
  };
};

// Payment validation schemas
const paymentSchemas = {
  processCharge: Joi.object({
    orderId: Joi.string().required(),
    amount: Joi.number().positive().required(),
    currency: Joi.string().length(3).uppercase().default('USD'),
    paymentMethod: Joi.string().valid('stripe', 'paypal', 'bank_transfer', 'credit_card').required(),
    paymentMethodId: Joi.string().when('paymentMethod', {
      is: 'stripe',
      then: Joi.required(),
      otherwise: Joi.optional()
    }),
    description: Joi.string().max(500).optional(),
    metadata: Joi.object().optional()
  }),

  processStripePayment: Joi.object({
    paymentMethodId: Joi.string().required()
  }),

  executePayPalPayment: Joi.object({
    payerId: Joi.string().required()
  }),

  refundPayment: Joi.object({
    amount: Joi.number().positive().optional(),
    reason: Joi.string().valid('duplicate', 'fraudulent', 'requested_by_customer', 'event_cancelled').optional()
  }),

  updatePaymentStatus: Joi.object({
    status: Joi.string().valid('PENDING', 'SUCCESS', 'FAILED', 'REFUNDED', 'CANCELLED').required(),
    reason: Joi.string().optional(),
    metadata: Joi.object().optional()
  }).unknown(true) // Allow additional fields like reason
};

module.exports = {
  validateRequest,
  paymentSchemas
};
