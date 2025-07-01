const mongoose = require('mongoose');
const LoanRate = require('../models/loanRate.model');
const ApiError = require('../utils/apiError');
const logger = require('../utils/logger');

/**
 * Create default loan rates for a new lender (utility, not an Express handler)
 * @param {ObjectId} userId - The user ID creating the lender (updatedBy)
 * @param {ObjectId} lenderId - The newly created lender's ID
 */
exports.createDefaultLoanRates = async (userId, lenderId) => {
  try {
    if (!userId || !lenderId) {
      throw new Error('userId and lenderId are required to create default loan rates');
    }

    // Define sensible default interest rates – adjust if business rules change
    const defaultRates = [
      { programType: 'conventional', rate: 7 },
      { programType: 'fha', rate: 7 },
      { programType: 'va', rate: 7 },
      { programType: 'usda', rate: 7 },
      { programType: 'jumbo', rate: 7 }
    ];

    // Instead of insertMany, use bulkWrite with upsert to handle existing records
    const operations = defaultRates.map(r => ({
      updateOne: {
        filter: {
          programType: r.programType,
          lender: lenderId
        },
        update: {
          $set: {
            rate: r.rate,
            updatedBy: userId,
            updatedAt: new Date()
          }
        },
        upsert: true
      }
    }));

    const result = await LoanRate.bulkWrite(operations);
    logger.info(`Created/updated default loan rates for lender ID: ${lenderId} (upserted: ${result.upsertedCount}, modified: ${result.modifiedCount})`);
    return true;
  } catch (error) {
    logger.error(`Error creating default loan rates for lender ${lenderId}: ${error.message}`);
    
    // Try individual operations as fallback
    try {
      let successCount = 0;
      const defaultRates = [
        { programType: 'conventional', rate: 7 },
        { programType: 'fha', rate: 7 },
        { programType: 'va', rate: 7 },
        { programType: 'usda', rate: 7 },
        { programType: 'jumbo', rate: 7 }
      ];
      
      for (const r of defaultRates) {
        await LoanRate.updateOne(
          { programType: r.programType, lender: lenderId },
          { 
            $set: { 
              rate: r.rate, 
              updatedBy: userId,
              updatedAt: new Date()
            }
          },
          { upsert: true }
        );
        successCount++;
      }
      
      logger.info(`Fallback: Created/updated ${successCount} default loan rates for lender ID: ${lenderId}`);
      return true;
    } catch (fallbackError) {
      logger.error(`Fallback also failed for lender ${lenderId}: ${fallbackError.message}`);
      throw error; // Propagate the original error
    }
  }
};

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
