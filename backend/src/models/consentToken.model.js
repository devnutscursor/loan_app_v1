const mongoose = require('mongoose');
const crypto = require('crypto');

const consentTokenSchema = new mongoose.Schema({
  // The token itself (hashed for security)
  token: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  
  // Borrower this token is for
  borrower: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Borrower',
    required: true,
    index: true
  },
  
  // Lender who requested the consent
  lender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Lender',
    required: true
  },
  
  // Company (for multi-tenant)
  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company'
  },
  
  // User who sent the request
  requestedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Token status
  status: {
    type: String,
    enum: ['pending', 'used', 'expired', 'revoked'],
    default: 'pending',
    index: true
  },
  
  // When token expires (default 7 days)
  expiresAt: {
    type: Date,
    required: true,
    index: true,
    default: function() {
      return new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
    }
  },
  
  // Email sent to
  emailSentTo: {
    type: String,
    required: true
  },
  
  // When email was sent
  emailSentAt: {
    type: Date,
    default: Date.now
  },
  
  // When borrower clicked the link
  clickedAt: {
    type: Date
  },
  
  // When borrower granted consent
  consentGrantedAt: {
    type: Date
  },
  
  // IP address when consent granted
  consentIpAddress: {
    type: String
  },
  
  // User agent when consent granted
  consentUserAgent: {
    type: String
  },
  
  // Metadata
  metadata: {
    emailSubject: String,
    emailBody: String,
    remindersSent: {
      type: Number,
      default: 0
    },
    lastReminderSent: Date
  }
}, {
  timestamps: true
});

// Index for cleanup of expired tokens
consentTokenSchema.index({ expiresAt: 1, status: 1 });

// Virtual to check if token is expired
consentTokenSchema.virtual('isExpired').get(function() {
  return this.expiresAt < new Date() || this.status === 'expired';
});

// Virtual to check if token is valid
consentTokenSchema.virtual('isValid').get(function() {
  return this.status === 'pending' && !this.isExpired;
});

// Static method to generate secure token
consentTokenSchema.statics.generateToken = function() {
  return crypto.randomBytes(32).toString('hex');
};

// Static method to hash token
consentTokenSchema.statics.hashToken = function(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
};

// Instance method to mark as clicked
consentTokenSchema.methods.markAsClicked = function() {
  if (!this.clickedAt) {
    this.clickedAt = new Date();
  }
  return this.save();
};

// Instance method to mark as used
consentTokenSchema.methods.markAsUsed = function(ipAddress, userAgent) {
  this.status = 'used';
  this.consentGrantedAt = new Date();
  this.consentIpAddress = ipAddress;
  this.consentUserAgent = userAgent;
  return this.save();
};

// Instance method to revoke
consentTokenSchema.methods.revoke = function() {
  this.status = 'revoked';
  return this.save();
};

// Static method to cleanup expired tokens
consentTokenSchema.statics.cleanupExpiredTokens = async function() {
  const result = await this.updateMany(
    {
      status: 'pending',
      expiresAt: { $lt: new Date() }
    },
    {
      $set: { status: 'expired' }
    }
  );
  return result;
};

module.exports = mongoose.model('ConsentToken', consentTokenSchema);

