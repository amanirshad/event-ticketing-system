const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  paymentId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  orderId: {
    type: String,
    required: true,
    index: true
  },
  userId: {
    type: String,
    required: true,
    index: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  currency: {
    type: String,
    required: true,
    length: 3,
    uppercase: true,
    default: 'USD'
  },
  paymentMethod: {
    type: String,
    required: true,
    enum: ['stripe', 'paypal', 'bank_transfer', 'credit_card']
  },
  status: {
    type: String,
    required: true,
    enum: ['PENDING', 'SUCCESS', 'FAILED', 'REFUNDED', 'CANCELLED'],
    default: 'PENDING',
    index: true
  },
  gatewayTransactionId: {
    type: String,
    sparse: true
  },
  gatewayResponse: {
    type: mongoose.Schema.Types.Mixed
  },
  description: {
    type: String,
    maxlength: 500
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  refunds: [{
    refundId: {
      type: String,
      required: true
    },
    amount: {
      type: Number,
      required: true,
      min: 0
    },
    reason: {
      type: String,
      enum: ['duplicate', 'fraudulent', 'requested_by_customer', 'event_cancelled']
    },
    status: {
      type: String,
      enum: ['PENDING', 'SUCCESS', 'FAILED', 'CANCELLED'],
      default: 'PENDING'
    },
    gatewayRefundId: String,
    processedAt: Date,
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  failureReason: {
    type: String
  },
  processedAt: {
    type: Date
  },
  expiresAt: {
    type: Date,
    default: () => new Date(Date.now() + 15 * 60 * 1000) // 15 minutes
  },
  idempotencyKey: {
    type: String,
    required: true,
    index: true
  },
  correlationId: {
    type: String,
    required: true,
    index: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better query performance
paymentSchema.index({ userId: 1, createdAt: -1 });
paymentSchema.index({ status: 1, createdAt: -1 });
paymentSchema.index({ paymentMethod: 1, status: 1 });
paymentSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
paymentSchema.index({ orderId: 1, status: 1 });

// Virtual for formatted amount
paymentSchema.virtual('formattedAmount').get(function() {
  return `${(this.amount / 100).toFixed(2)} ${this.currency}`;
});

// Virtual for time remaining
paymentSchema.virtual('timeRemaining').get(function() {
  if (this.status !== 'PENDING') return null;
  const now = new Date();
  const remaining = this.expiresAt - now;
  return remaining > 0 ? Math.ceil(remaining / 1000) : 0; // seconds
});

// Virtual for total refunded amount
paymentSchema.virtual('totalRefunded').get(function() {
  return this.refunds
    .filter(refund => refund.status === 'SUCCESS')
    .reduce((total, refund) => total + refund.amount, 0);
});

// Pre-save middleware to generate paymentId
paymentSchema.pre('save', function(next) {
  if (this.isNew && !this.paymentId) {
    this.paymentId = `pay_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  next();
});

// Static method to find payments by status
paymentSchema.statics.findByStatus = function(status) {
  return this.find({ status }).sort({ createdAt: -1 });
};

// Static method to find payments by user
paymentSchema.statics.findByUser = function(userId, limit = 10) {
  return this.find({ userId }).sort({ createdAt: -1 }).limit(limit);
};

// Static method to find payments by order
paymentSchema.statics.findByOrder = function(orderId) {
  return this.find({ orderId }).sort({ createdAt: -1 });
};

// Instance method to check if payment is expired
paymentSchema.methods.isExpired = function() {
  return this.status === 'PENDING' && new Date() > this.expiresAt;
};

// Instance method to add refund
paymentSchema.methods.addRefund = function(refundData) {
  const refund = {
    refundId: `ref_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    ...refundData,
    status: refundData.status || 'PENDING'  // Use provided status or default to PENDING
  };
  
  this.refunds.push(refund);
  return this.save();
};

// Instance method to update status
paymentSchema.methods.updateStatus = function(status, metadata = {}) {
  this.status = status;
  if (metadata) {
    this.metadata = { ...this.metadata, ...metadata };
  }
  
  if (status === 'SUCCESS') {
    this.processedAt = new Date();
  }
  
  return this.save();
};

// Static method to get payment statistics
paymentSchema.statics.getStats = function(userId = null, startDate = null, endDate = null) {
  const matchStage = {};
  if (userId) matchStage.userId = userId;
  if (startDate || endDate) {
    matchStage.createdAt = {};
    if (startDate) matchStage.createdAt.$gte = new Date(startDate);
    if (endDate) matchStage.createdAt.$lte = new Date(endDate);
  }
  
  return this.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        totalAmount: { $sum: '$amount' }
      }
    }
  ]);
};

module.exports = mongoose.model('Payment', paymentSchema);
