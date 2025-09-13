const mongoose = require('mongoose');
const LoanProgram = require('../models/loanProgram.model');
const ApiError = require('../utils/apiError');
const logger = require('../utils/logger');

/**
 * Helper function to propagate company loan program creation to all lenders
 * @param {ObjectId} companyId - The company ID
 * @param {Object} programData - The program data to propagate
 * @param {ObjectId} userId - The user ID making the change
 */
const propagateProgramCreationToLenders = async (companyId, programData, userId) => {
  try {
    const Lender = mongoose.model('Lender');
    const companyLenders = await Lender.find({ company: companyId });
    
    if (companyLenders.length === 0) {
      logger.info(`No lenders found for company ${companyId} to propagate program creation`);
      return;
    }
    
    const lenderPrograms = companyLenders.map(lender => ({
      ...programData,
      lender: lender._id,
      company: null, // Remove company reference for lender programs
      createdBy: userId,
      createdAt: new Date(),
      updatedAt: new Date()
    }));
    
    await LoanProgram.insertMany(lenderPrograms);
    logger.info(`Propagated program creation to ${companyLenders.length} lenders for company ${companyId}`);
  } catch (error) {
    logger.error(`Error propagating program creation to lenders: ${error.message}`);
    throw error;
  }
};

/**
 * Helper function to propagate company loan program updates to all lenders
 * @param {ObjectId} companyId - The company ID
 * @param {Object} programData - The updated program data
 * @param {ObjectId} userId - The user ID making the change
 * @param {String} originalProgramName - The original program name for matching
 */
const propagateProgramUpdateToLenders = async (companyId, programData, userId, originalProgramName) => {
  try {
    const Lender = mongoose.model('Lender');
    const companyLenders = await Lender.find({ company: companyId });
    
    if (companyLenders.length === 0) {
      logger.info(`No lenders found for company ${companyId} to propagate program update`);
      return;
    }
    
    const lenderIds = companyLenders.map(lender => lender._id);
    
    // Update all lender programs that match the ORIGINAL program name
    const updateData = {
      ...programData,
      company: null, // Remove company reference for lender programs
      updatedBy: userId,
      updatedAt: new Date()
    };
    
    // Remove fields that shouldn't be copied
    delete updateData.lender;
    delete updateData.createdBy;
    delete updateData.createdAt;
    
    logger.info(`Updating lender programs with original name: ${originalProgramName}`);
    logger.info(`Update data:`, updateData);
    
    const result = await LoanProgram.updateMany(
      { lender: { $in: lenderIds }, programName: originalProgramName },
      { $set: updateData }
    );
    
    logger.info(`Propagated program update to ${result.modifiedCount} lender programs for company ${companyId}`);
  } catch (error) {
    logger.error(`Error propagating program update to lenders: ${error.message}`);
    throw error;
  }
};

/**
 * Helper function to propagate company loan program deletion to all lenders
 * @param {ObjectId} companyId - The company ID
 * @param {String} programName - The program name to delete
 */
const propagateProgramDeletionToLenders = async (companyId, programName) => {
  try {
    const Lender = mongoose.model('Lender');
    const companyLenders = await Lender.find({ company: companyId });
    
    if (companyLenders.length === 0) {
      logger.info(`No lenders found for company ${companyId} to propagate program deletion`);
      return;
    }
    
    const lenderIds = companyLenders.map(lender => lender._id);
    
    const result = await LoanProgram.deleteMany({
      lender: { $in: lenderIds },
      programName: programName
    });
    
    logger.info(`Propagated program deletion to ${result.deletedCount} lender programs for company ${companyId}`);
  } catch (error) {
    logger.error(`Error propagating program deletion to lenders: ${error.message}`);
    throw error;
  }
};

/**
 * Create a new loan program
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.createLoanProgram = async (req, res, next) => {
  try {
    // Only lenders, companies, and admins can create loan programs
    if (!['lender', 'company', 'admin'].includes(req.user.role)) {
      return next(new ApiError('Only lenders, companies, and admins can create loan programs', 403));
    }

    // If user is a lender, get their lender profile ID
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
      // If company user, create program for their company
      const Company = mongoose.model('Company');
      const company = await Company.findById(req.user.company);
      
      if (!company) {
        return next(new ApiError('Company not found', 404));
      }
      
      companyId = company._id;
    } else if (req.body.lender) {
      // If admin is creating a program for a specific lender
      lenderId = req.body.lender;
    } else if (req.body.company) {
      // If admin is creating a program for a specific company
      companyId = req.body.company;
    } else {
      return next(new ApiError('Lender ID or Company ID is required', 400));
    }

    const programData = {
      ...req.body,
      lender: lenderId,
      company: companyId,
      createdBy: req.user._id
    };

    const loanProgram = await LoanProgram.create(programData);
    
    // If this is a company program, propagate to all lenders
    if (companyId) {
      try {
        await propagateProgramCreationToLenders(companyId, programData, req.user._id);
      } catch (propagationError) {
        logger.error(`Failed to propagate program creation to lenders: ${propagationError.message}`);
        // Don't fail the main operation, just log the error
      }
    }
    
    logger.info(`Loan program created: ${loanProgram.programName} by ${req.user._id}`);
    
    res.status(201).json({
      status: 'success',
      data: loanProgram
    });
  } catch (error) {
    // Handle duplicate program name error
    if (error.code === 11000) {
      const indexName = error.keyPattern ? Object.keys(error.keyPattern).join('_') : '';
      if (indexName.includes('programName')) {
        return next(new ApiError('A program with this name already exists for your company. Please choose a different name.', 400));
      }
    }
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
    } else if (req.user.role === 'company') {
      // If company user, show only their company's programs
      const Company = mongoose.model('Company');
      const company = await Company.findById(req.user.company);
      
      if (!company) {
        return next(new ApiError('Company not found', 404));
      }
      
      filter.company = company._id;
    } else if (req.query.lender) {
      // If admin is filtering by lender
      filter.lender = req.query.lender;
    } else if (req.query.company) {
      // If admin is filtering by company
      filter.company = req.query.company;
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
    // Only lenders, companies, and admins can update loan programs
    if (!['lender', 'company', 'admin'].includes(req.user.role)) {
      return next(new ApiError('Only lenders, companies, and admins can update loan programs', 403));
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
      
      if (loanProgram.lender && loanProgram.lender.toString() !== lenderProfile._id.toString()) {
        return next(new ApiError('You can only update your own loan programs', 403));
      }
    } else if (req.user.role === 'company') {
      // If company user, ensure the program belongs to their company
      const Company = mongoose.model('Company');
      const company = await Company.findById(req.user.company);
      
      if (!company) {
        return next(new ApiError('Company not found', 404));
      }
      
      if (loanProgram.company && loanProgram.company.toString() !== company._id.toString()) {
        return next(new ApiError('You can only update programs for your company', 403));
      }
    }
    
    // Get the original program data before updating (for propagation matching)
    const originalProgram = await LoanProgram.findById(id);
    if (!originalProgram) {
      return next(new ApiError('Loan program not found', 404));
    }
    
    // Update the loan program
    const updatedLoanProgram = await LoanProgram.findByIdAndUpdate(
      id,
      { ...req.body, updatedAt: Date.now() },
      { new: true, runValidators: true }
    );
    
    // If this is a company program update, propagate to all lenders
    if (req.user.role === 'company' && updatedLoanProgram.company) {
      try {
        await propagateProgramUpdateToLenders(
          updatedLoanProgram.company, 
          req.body, 
          req.user._id,
          originalProgram.programName // Use original program name for matching
        );
      } catch (propagationError) {
        logger.error(`Failed to propagate program update to lenders: ${propagationError.message}`);
        // Don't fail the main operation, just log the error
      }
    }
    
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
    // Only lenders, companies, and admins can delete loan programs
    if (!['lender', 'company', 'admin'].includes(req.user.role)) {
      return next(new ApiError('Only lenders, companies, and admins can delete loan programs', 403));
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
      
      if (loanProgram.lender && loanProgram.lender.toString() !== lenderProfile._id.toString()) {
        return next(new ApiError('You can only delete your own loan programs', 403));
      }
    } else if (req.user.role === 'company') {
      // If company user, ensure the program belongs to their company
      const Company = mongoose.model('Company');
      const company = await Company.findById(req.user.company);
      
      if (!company) {
        return next(new ApiError('Company not found', 404));
      }
      
      if (loanProgram.company && loanProgram.company.toString() !== company._id.toString()) {
        return next(new ApiError('You can only delete programs for your company', 403));
      }
    }
    
    // Delete the loan program
    await LoanProgram.findByIdAndDelete(id);
    
    // If this is a company program deletion, propagate to all lenders
    if (req.user.role === 'company' && loanProgram.company) {
      try {
        await propagateProgramDeletionToLenders(loanProgram.company, loanProgram.programName);
      } catch (propagationError) {
        logger.error(`Failed to propagate program deletion to lenders: ${propagationError.message}`);
        // Don't fail the main operation, just log the error
      }
    }
    
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
