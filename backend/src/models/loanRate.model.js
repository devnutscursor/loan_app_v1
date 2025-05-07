const mongoose = require('mongoose');

const loanRateSchema = new mongoose.Schema({
  programType: {
    type: String,
    enum: ['conventional', 'fha', 'va', 'usda', 'jumbo', 'other'],
    required: true
  },
  rate: {
    type: Number,
    required: true,
    min: 0,
    max: 20
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

module.exports = mongoose.model('LoanRate', loanRateSchema);
