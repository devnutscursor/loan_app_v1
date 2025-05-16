const mongoose = require('mongoose');
const LoanRate = require('../models/loanRate.model');
const ApiError = require('../utils/apiError');
const logger = require('../utils/logger');

/**
 * Get all loan rates
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.getAllLoanRates = async (req, res, next) => {
  try {
    // Build filter based on user role and query params
    let filter = {};
    
    // If user is a lender, only show their rates
    if (req.user.role === 'lender') {
      const Lender = mongoose.model('Lender');
      const lenderProfile = await Lender.findOne({ user: req.user._id });
      
      if (!lenderProfile) {
        return next(new ApiError('Lender profile not found', 404));
      }
      
      filter.lender = lenderProfile._id;
    } else if (req.query.lender) {
      // If admin is filtering by lender
      filter.lender = req.query.lender;
    }
    
    const loanRates = await LoanRate.find(filter).sort({ programType: 1 });
    
    res.status(200).json({
      status: 'success',
      results: loanRates.length,
      data: loanRates
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update loan rates
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.updateLoanRates = async (req, res, next) => {
  try {
    // Only lenders and admins can update loan rates
    if (!['lender', 'admin'].includes(req.user.role)) {
      return next(new ApiError('Only lenders and admins can update loan rates', 403));
    }
    
    // Get lender ID based on user role
    let lenderId = null;
    if (req.user.role === 'lender') {
      const Lender = mongoose.model('Lender');
      const lenderProfile = await Lender.findOne({ user: req.user._id });
      
      if (!lenderProfile) {
        return next(new ApiError('Lender profile not found', 404));
      }
      
      lenderId = lenderProfile._id;
    } else if (req.body.lender) {
      // If admin is creating rates for a specific lender
      lenderId = req.body.lender;
    } else {
      return next(new ApiError('Lender ID is required', 400));
    }
    
    const { rates } = req.body;
    
    if (!rates || !Array.isArray(rates)) {
      return next(new ApiError('Invalid rates data', 400));
    }
    
    const updatedRates = [];
    
    // Update each rate
    for (const rateData of rates) {
      const { programType, rate } = rateData;
      
      // Validate rate
      if (typeof rate !== 'number' || rate < 0 || rate > 20) {
        return next(new ApiError(`Invalid rate value for ${programType}`, 400));
      }
      
      // Find and update or create new rate for this lender and program type
      const existingRate = await LoanRate.findOne({ programType, lender: lenderId });
      
      if (existingRate) {
        existingRate.rate = rate;
        existingRate.updatedBy = req.user._id;
        existingRate.updatedAt = Date.now();
        
        await existingRate.save();
        updatedRates.push(existingRate);
      } else {
        const newRate = await LoanRate.create({
          programType,
          rate,
          lender: lenderId,
          updatedBy: req.user._id
        });
        
        updatedRates.push(newRate);
      }
    }
    
    logger.info(`Loan rates updated by ${req.user._id}`);
    
    res.status(200).json({
      status: 'success',
      data: updatedRates
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get loan rate by program type
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.getLoanRateByType = async (req, res, next) => {
  try {
    const { type } = req.params;
    
    // Get lender ID from query or from user role
    let lenderId = null;
    if (req.query.lender) {
      lenderId = req.query.lender;
    } else if (req.user.role === 'lender') {
      const Lender = mongoose.model('Lender');
      const lenderProfile = await Lender.findOne({ user: req.user._id });
      
      if (!lenderProfile) {
        return next(new ApiError('Lender profile not found', 404));
      }
      
      lenderId = lenderProfile._id;
    } else {
      return next(new ApiError('Lender ID is required as a query parameter', 400));
    }
    
    const loanRate = await LoanRate.findOne({ programType: type, lender: lenderId });
    
    if (!loanRate) {
      return next(new ApiError(`Loan rate for program type ${type} not found`, 404));
    }
    
    res.status(200).json({
      status: 'success',
      data: loanRate
    });
  } catch (error) {
    next(error);
  }
};
