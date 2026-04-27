const mongoose = require('mongoose');
const LoanRate = require('../models/loanRate.model');
const ApiError = require('../utils/apiError');
const logger = require('../utils/logger');

/**
 * Helper function to propagate company loan rate updates to all lenders
 * @param {ObjectId} companyId - The company ID
 * @param {Array} ratesData - The updated rates data
 * @param {ObjectId} userId - The user ID making the change
 */
const propagateRateUpdateToLenders = async (companyId, ratesData, userId) => {
  try {
    const Lender = mongoose.model('Lender');
    const companyLenders = await Lender.find({ company: companyId });
    
    if (companyLenders.length === 0) {
      logger.info(`No lenders found for company ${companyId} to propagate rate updates`);
      return;
    }
    
    const lenderIds = companyLenders.map(lender => lender._id);
    
    // Use bulkWrite with upsert to handle both existing and missing rate records
    const operations = [];
    
    for (const rateData of ratesData) {
      console.log(`Propagating rate update for ${rateData.programType} to ${rateData.rate}`);
      const { programType, rate } = rateData;
      
      // Create operations for each lender
      for (const lenderId of lenderIds) {
        operations.push({
          updateOne: {
            filter: {
              lender: lenderId,
              programType: programType
            },
            update: {
              $set: {
                rate: rate,
                updatedBy: userId,
                updatedAt: new Date()
              }
            },
            upsert: true // This ensures we create the record if it doesn't exist
          }
        });
      }
    }
    
    if (operations.length > 0) {
      const result = await LoanRate.bulkWrite(operations);
      logger.info(`Propagated rate updates to lenders for company ${companyId}: upserted=${result.upsertedCount}, modified=${result.modifiedCount}`);
    }
  } catch (error) {
    logger.error(`Error propagating rate updates to lenders: ${error.message}`);
    throw error;
  }
};

/**
 * Copy company loan rates to a new lender
 * @param {ObjectId} userId - The user ID creating the lender (updatedBy)
 * @param {ObjectId} lenderId - The newly created lender's ID
 * @param {ObjectId} companyId - The company ID to copy rates from
 */
exports.copyCompanyLoanRatesToLender = async (userId, lenderId, companyId) => {
  try {
    if (!userId || !lenderId || !companyId) {
      throw new Error('userId, lenderId, and companyId are required to copy company loan rates');
    }

    // Get all company loan rates
    const companyRates = await LoanRate.find({ company: companyId });
    
    if (companyRates.length === 0) {
      logger.warn(`No company rates found for company ${companyId}, creating default rates for lender ${lenderId}`);
      // Fallback to creating default rates
      await exports.createDefaultLoanRates(userId, lenderId);
      return;
    }
    
    // Copy each rate to the lender
    const operations = companyRates.map(rate => ({
      updateOne: {
        filter: {
          programType: rate.programType,
          lender: lenderId
        },
        update: {
          $set: {
            rate: rate.rate,
            updatedBy: userId,
            updatedAt: new Date()
          }
        },
        upsert: true
      }
    }));

    const result = await LoanRate.bulkWrite(operations);
    logger.info(`Copied ${companyRates.length} loan rates from company ${companyId} to lender ${lenderId} (upserted: ${result.upsertedCount}, modified: ${result.modifiedCount})`);
    return true;
  } catch (error) {
    logger.error(`Error copying company loan rates to lender: ${error.message}`);
    
    // Fallback to creating default rates
    try {
      await exports.createDefaultLoanRates(userId, lenderId);
      return true;
    } catch (fallbackError) {
      logger.error(`Fallback also failed: ${fallbackError.message}`);
      throw error; // Propagate the original error
    }
  }
}


/**
 * Create default loan rates for a new lender (utility, not an Express handler)
 * @param {ObjectId} userId - The user ID creating the lender (updatedBy)
 * @param {ObjectId} lenderId - The newly created lender's ID
 */
exports.createDefaultLoanRates = async (userId, lenderId = null, companyId = null) => {
  try {
    if (!userId || (!lenderId && !companyId)) {
      throw new Error('userId and either lenderId or companyId are required to create default loan rates');
    }

    // Current market interest rates (July 2025) - based on Freddie Mac PMMS and industry standards
    const defaultRates = [
      { programType: 'conventional', rate: 6.75 }, // 30-year fixed conventional (Freddie Mac July 17, 2025)
      { programType: 'fha', rate: 6.50 },          // FHA typically 0.25% lower than conventional
      { programType: 'va', rate: 6.25 },           // VA typically 0.5% lower than conventional
      { programType: 'fsa_rhs', rate: 6.25 },         // FSA/RHS-Guaranteed — similar to VA rates
      { programType: 'jumbo', rate: 7.00 }         // Jumbo typically 0.25% higher than conventional
    ];

    // Instead of insertMany, use bulkWrite with upsert to handle existing records
    const operations = defaultRates.map(r => ({
      updateOne: {
        filter: {
          programType: r.programType,
          ...(lenderId ? { lender: lenderId } : {}),
          ...(companyId ? { company: companyId } : {})
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
    logger.info(`Created/updated default loan rates for ${companyId ? 'company' : 'lender'} ID: ${companyId || lenderId} (upserted: ${result.upsertedCount}, modified: ${result.modifiedCount})`);
    return true;
  } catch (error) {
    logger.error(`Error creating default loan rates for ${companyId ? 'company' : 'lender'} ${companyId || lenderId}: ${error.message}`);
    
    // Try individual operations as fallback
    try {
      let successCount = 0;
      const defaultRates = [
        { programType: 'conventional', rate: 6.75 }, // Current market rates (July 2025)
        { programType: 'fha', rate: 6.50 },
        { programType: 'va', rate: 6.25 },
        { programType: 'fsa_rhs', rate: 6.25 },
        { programType: 'jumbo', rate: 7.00 }
      ];
      
      for (const r of defaultRates) {
        await LoanRate.updateOne(
          { 
            programType: r.programType, 
            ...(lenderId ? { lender: lenderId } : {}),
            ...(companyId ? { company: companyId } : {})
          },
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
      
      logger.info(`Fallback: Created/updated ${successCount} default loan rates for ${companyId ? 'company' : 'lender'} ID: ${companyId || lenderId}`);
      return true;
    } catch (fallbackError) {
      logger.error(`Fallback also failed for ${companyId ? 'company' : 'lender'} ${companyId || lenderId}: ${fallbackError.message}`);
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
      
      console.log(`[DEBUG] Loan Rates API - User ID: ${req.user._id}, Role: ${req.user.role}`);
      console.log(`[DEBUG] Loan Rates API - Lender Profile:`, lenderProfile);
      
      if (!lenderProfile) {
        console.log(`[ERROR] Loan Rates API - No lender profile found for user ${req.user._id}`);
        return next(new ApiError('Lender profile not found', 404));
      }
      
      filter.lender = lenderProfile._id;
      console.log(`[DEBUG] Loan Rates API - Filter:`, filter);
    } else if (req.user.role === 'company') {
      // If company user, show only their company's rates
      const Company = mongoose.model('Company');
      const company = await Company.findById(req.user.company);
      
      if (!company) {
        return next(new ApiError('Company not found', 404));
      }
      
      filter.company = company._id;
      console.log(`[DEBUG] Loan Rates API - Company filter:`, filter);
    } else if (req.query.lender) {
      // If admin is filtering by lender
      filter.lender = req.query.lender;
    } else if (req.query.company) {
      // If admin is filtering by company
      filter.company = req.query.company;
    }
    
    const loanRates = await LoanRate.find(filter).sort({ programType: 1 });
    
    console.log(`[DEBUG] Loan Rates API - Found ${loanRates.length} rates:`, loanRates.map(r => ({ id: r._id, type: r.programType, rate: r.rate })));
    
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
    // Only lenders, companies, and admins can update loan rates
    if (!['lender', 'company', 'admin'].includes(req.user.role)) {
      return next(new ApiError('Only lenders, companies, and admins can update loan rates', 403));
    }
    
    // Get lender ID or company ID based on user role
    let lenderId = null;
    let companyId = null;
    
    if (req.user.role === 'lender') {
      const Lender = mongoose.model('Lender');
      const lenderProfile = await Lender.findOne({ user: req.user._id });
      
      if (!lenderProfile) {
        return next(new ApiError('Lender profile not found', 404));
      }
      
      lenderId = lenderProfile._id;
    } else if (req.user.role === 'company') {
      // If company user, update rates for their company
      const Company = mongoose.model('Company');
      const company = await Company.findById(req.user.company);
      
      if (!company) {
        return next(new ApiError('Company not found', 404));
      }
      
      companyId = company._id;
    } else if (req.body.lender) {
      // If admin is creating rates for a specific lender
      lenderId = req.body.lender;
    } else if (req.body.company) {
      // If admin is creating rates for a specific company
      companyId = req.body.company;
    } else {
      return next(new ApiError('Lender ID or Company ID is required', 400));
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
      
      // Find and update or create new rate for this lender/company and program type
      const existingRate = await LoanRate.findOne({ 
        programType, 
        lender: lenderId,
        company: companyId
      });
      
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
          company: companyId,
          updatedBy: req.user._id
        });
        
        updatedRates.push(newRate);
      }
    }
    
    // If this is a company rate update, propagate to all lenders
    if (req.user.role === 'company' && companyId) {
      try {
        await propagateRateUpdateToLenders(companyId, rates, req.user._id);
      } catch (propagationError) {
        logger.error(`Failed to propagate rate updates to lenders: ${propagationError.message}`);
        // Don't fail the main operation, just log the error
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
    
    // Get lender ID or company ID from query or from user role
    let lenderId = null;
    let companyId = null;
    
    if (req.query.lender) {
      lenderId = req.query.lender;
    } else if (req.query.company) {
      companyId = req.query.company;
    } else if (req.user.role === 'lender') {
      const Lender = mongoose.model('Lender');
      const lenderProfile = await Lender.findOne({ user: req.user._id });
      
      if (!lenderProfile) {
        return next(new ApiError('Lender profile not found', 404));
      }
      
      lenderId = lenderProfile._id;
    } else if (req.user.role === 'company') {
      const Company = mongoose.model('Company');
      const company = await Company.findById(req.user.company);
      
      if (!company) {
        return next(new ApiError('Company not found', 404));
      }
      
      companyId = company._id;
    } else {
      return next(new ApiError('Lender ID or Company ID is required as a query parameter', 400));
    }
    
    const loanRate = await LoanRate.findOne({ 
      programType: type, 
      lender: lenderId,
      company: companyId
    });
    
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
