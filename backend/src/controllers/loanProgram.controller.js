const mongoose = require('mongoose');
const LoanProgram = require('../models/loanProgram.model');
const ApiError = require('../utils/apiError');
const logger = require('../utils/logger');

/**
 * Create a new loan program
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.createLoanProgram = async (req, res, next) => {
  try {
    // Only lenders and admins can create loan programs
    if (!['lender', 'admin'].includes(req.user.role)) {
      return next(new ApiError('Only lenders and admins can create loan programs', 403));
    }

    // If user is a lender, get their lender profile ID
    let lenderId = null;
    if (req.user.role === 'lender') {
      const Lender = mongoose.model('Lender');
      const lenderProfile = await Lender.findOne({ user: req.user._id });
      
      if (!lenderProfile) {
        return next(new ApiError('Lender profile not found', 404));
      }
      
      lenderId = lenderProfile._id;
    } else if (req.body.lender) {
      // If admin is creating a program for a specific lender
      lenderId = req.body.lender;
    } else {
      return next(new ApiError('Lender ID is required', 400));
    }

    const programData = {
      ...req.body,
      lender: lenderId,
      createdBy: req.user._id
    };

    const loanProgram = await LoanProgram.create(programData);
    
    logger.info(`Loan program created: ${loanProgram.programName} by ${req.user._id}`);
    
    res.status(201).json({
      status: 'success',
      data: loanProgram
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all loan programs
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.getAllLoanPrograms = async (req, res, next) => {
  try {
    // Build filter based on user role and query params
    let filter = {};
    
    // If user is a lender, only show their programs
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
    
    const loanPrograms = await LoanProgram.find(filter);
    
    console.log(`[DEBUG] Loan Programs API - Found ${loanPrograms.length} programs:`, loanPrograms.map(p => ({ id: p._id, name: p.programName, type: p.programType })));
    
    res.status(200).json({
      status: 'success',
      results: loanPrograms.length,
      data: loanPrograms
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get a loan program by ID
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.getLoanProgram = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const loanProgram = await LoanProgram.findById(id);
    
    if (!loanProgram) {
      return next(new ApiError('Loan program not found', 404));
    }
    
    res.status(200).json({
      status: 'success',
      data: loanProgram
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update a loan program
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.updateLoanProgram = async (req, res, next) => {
  try {
    // Only lenders and admins can update loan programs
    if (!['lender', 'admin'].includes(req.user.role)) {
      return next(new ApiError('Only lenders and admins can update loan programs', 403));
    }
    
    const { id } = req.params;
    
    // Check if the loan program exists
    const loanProgram = await LoanProgram.findById(id);
    
    if (!loanProgram) {
      return next(new ApiError('Loan program not found', 404));
    }
    
    // If user is a lender, ensure they own this program
    if (req.user.role === 'lender') {
      const Lender = mongoose.model('Lender');
      const lenderProfile = await Lender.findOne({ user: req.user._id });
      
      if (!lenderProfile) {
        return next(new ApiError('Lender profile not found', 404));
      }
      
      if (loanProgram.lender.toString() !== lenderProfile._id.toString()) {
        return next(new ApiError('You can only update your own loan programs', 403));
      }
    }
    
    // Update the loan program
    const updatedLoanProgram = await LoanProgram.findByIdAndUpdate(
      id,
      { ...req.body, updatedAt: Date.now() },
      { new: true, runValidators: true }
    );
    
    logger.info(`Loan program updated: ${updatedLoanProgram.programName} by ${req.user._id}`);
    
    res.status(200).json({
      status: 'success',
      data: updatedLoanProgram
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete a loan program
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.deleteLoanProgram = async (req, res, next) => {
  try {
    // Only lenders and admins can delete loan programs
    if (!['lender', 'admin'].includes(req.user.role)) {
      return next(new ApiError('Only lenders and admins can delete loan programs', 403));
    }
    
    const { id } = req.params;
    
    // Check if the loan program exists
    const loanProgram = await LoanProgram.findById(id);
    
    if (!loanProgram) {
      return next(new ApiError('Loan program not found', 404));
    }
    
    // If user is a lender, ensure they own this program
    if (req.user.role === 'lender') {
      const Lender = mongoose.model('Lender');
      const lenderProfile = await Lender.findOne({ user: req.user._id });
      
      if (!lenderProfile) {
        return next(new ApiError('Lender profile not found', 404));
      }
      
      if (loanProgram.lender.toString() !== lenderProfile._id.toString()) {
        return next(new ApiError('You can only delete your own loan programs', 403));
      }
    }
    
    // Delete the loan program
    await LoanProgram.findByIdAndDelete(id);
    
    logger.info(`Loan program deleted: ${loanProgram.programName} by ${req.user._id}`);
    
    res.status(204).json({
      status: 'success',
      data: null
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Calculate borrower qualification for a specific loan program
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.calculateQualification = async (req, res, next) => {
  try {
    const { loanId, programId } = req.params;
    
    // Find the loan
    const Loan = mongoose.model('Loan');
    const loan = await Loan.findById(loanId);
    
    if (!loan) {
      return next(new ApiError('Loan not found', 404));
    }
    
    // Find the loan program
    const loanProgram = await LoanProgram.findById(programId);
    
    if (!loanProgram) {
      return next(new ApiError('Loan program not found', 404));
    }
    
    // Get loan financial values
    const {
      dti = 0,
      ltv = 0,
      totalMonthlyPayment = 0,
      totalIncome = 0
    } = loan.financialCalculations || {};
    
    const downPaymentPercentage = (loan.loanDetails.downPayment / loan.loanDetails.purchasePrice) * 100;
    const loanAmount = loan.loanDetails.loanAmount || 0;
    
    // Check qualification criteria
    const { restrictions } = loanProgram;
    
    let isQualified = true;
    let disqualificationReasons = [];
    
    // Check DTI restriction
    if (restrictions.dtiRestriction && restrictions.dtiRestriction.max && dti > restrictions.dtiRestriction.max) {
      isQualified = false;
      disqualificationReasons.push({
        reason: 'DTI Restriction',
        message: `Your DTI (${dti.toFixed(2)}%) exceeds the maximum allowed (${restrictions.dtiRestriction.max}%).`,
        value: dti,
        limit: restrictions.dtiRestriction.max
      });
    }
    
    // Check down payment restriction
    if (restrictions.downPaymentRestriction) {
      if (restrictions.downPaymentRestriction.min && downPaymentPercentage < restrictions.downPaymentRestriction.min) {
        isQualified = false;
        disqualificationReasons.push({
          reason: 'Down Payment',
          message: `Your down payment (${downPaymentPercentage.toFixed(2)}%) is below the minimum required (${restrictions.downPaymentRestriction.min}%).`,
          value: downPaymentPercentage,
          limit: restrictions.downPaymentRestriction.min
        });
      }
      
      if (restrictions.downPaymentRestriction.max && downPaymentPercentage > restrictions.downPaymentRestriction.max) {
        isQualified = false;
        disqualificationReasons.push({
          reason: 'Down Payment',
          message: `Your down payment (${downPaymentPercentage.toFixed(2)}%) exceeds the maximum allowed (${restrictions.downPaymentRestriction.max}%).`,
          value: downPaymentPercentage,
          limit: restrictions.downPaymentRestriction.max
        });
      }
    }
    
    // Check loan amount restriction
    if (restrictions.loanAmountRestriction) {
      if (restrictions.loanAmountRestriction.min && loanAmount < restrictions.loanAmountRestriction.min) {
        isQualified = false;
        disqualificationReasons.push({
          reason: 'Loan Amount',
          message: `Your loan amount ($${loanAmount.toLocaleString()}) is below the minimum required ($${restrictions.loanAmountRestriction.min.toLocaleString()}).`,
          value: loanAmount,
          limit: restrictions.loanAmountRestriction.min
        });
      }
      
      if (restrictions.loanAmountRestriction.max && loanAmount > restrictions.loanAmountRestriction.max) {
        isQualified = false;
        disqualificationReasons.push({
          reason: 'Loan Amount',
          message: `Your loan amount ($${loanAmount.toLocaleString()}) exceeds the maximum allowed ($${restrictions.loanAmountRestriction.max.toLocaleString()}).`,
          value: loanAmount,
          limit: restrictions.loanAmountRestriction.max
        });
      }
    }
    
    // Return qualification result
    res.status(200).json({
      status: 'success',
      data: {
        isQualified,
        program: loanProgram,
        disqualificationReasons,
        loanMetrics: {
          dti,
          ltv,
          downPaymentPercentage,
          loanAmount,
          totalMonthlyPayment,
          totalIncome
        }
      }
    });
  } catch (error) {
    next(error);
  }
};
