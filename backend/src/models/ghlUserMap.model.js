const mongoose = require('mongoose');

const ghlUserMapSchema = new mongoose.Schema(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company',
      required: true,
      index: true
    },
    appUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    ghlUserId: {
      type: String,
      required: true,
      trim: true
    },
    role: {
      type: String,
      enum: ['owner_admin', 'loan_officer'],
      required: true
    },
    provisionStatus: {
      type: String,
      enum: ['provisioned', 'failed'],
      default: 'provisioned'
    },
    lastProvisionedAt: {
      type: Date,
      default: Date.now
    },
    lastError: {
      type: String
    }
  },
  { timestamps: true }
);

ghlUserMapSchema.index({ companyId: 1, appUserId: 1 }, { unique: true });
ghlUserMapSchema.index({ companyId: 1, ghlUserId: 1 }, { unique: true });

module.exports = mongoose.model('GhlUserMap', ghlUserMapSchema);
