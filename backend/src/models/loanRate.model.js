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
  // Lender association - This makes loan rates unique per lender
  lender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Lender',
    required: false,
    index: true
  },
  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: false,
    index: true
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
