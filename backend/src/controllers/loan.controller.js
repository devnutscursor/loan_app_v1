const mongoose = require('mongoose');
const Loan = require('../models/loan.model');
const Borrower = require('../models/borrower.model');
const User = require('../models/user.model');
const ApiError = require('../utils/apiError');
const logger = require('../utils/logger');

/**
 * Remove a document from a loan application
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.removeDocument = async (req, res, next) => {
  try {
    const { loanId, documentId } = req.params;
    
    // Find the loan
    const loan = await Loan.findById(loanId);
    
    if (!loan) {
      return next(new ApiError('Loan not found', 404));
    }
    
    // Check permissions for borrowers
    if (req.user.role === 'borrower') {
      const borrower = await Borrower.findOne({ user: req.user._id });
      
      if (!borrower) {
        return next(new ApiError('Borrower profile not found', 404));
      }
      
      const isPrimaryBorrower = loan.primaryBorrower.toString() === borrower._id.toString();
      const isCoBottower = loan.coBorrowers.some(coBorrower => 
        coBorrower.toString() === borrower._id.toString()
      );
      
      if (!isPrimaryBorrower && !isCoBottower) {
        return next(new ApiError('You are not authorized to modify this loan', 403));
      }
    }
    
    // Find the document in the loan documents array
    if (!loan.documents || !Array.isArray(loan.documents)) {
      return next(new ApiError('No documents found for this loan', 404));
    }
    
    // Find the document index
    const documentIndex = loan.documents.findIndex(doc => doc._id.toString() === documentId);
    
    if (documentIndex === -1) {
      return next(new ApiError('Document not found', 404));
    }
    
    // Remove the document from the array
    loan.documents.splice(documentIndex, 1);
    
    // If it's a file path, we could also delete it from storage here
    // This would require additional file system operations
    
    // Save the loan
    await loan.save();
    
    // Log the document removal
    logger.info(`Document removed from loan ${loan.loanNumber} by ${req.user.role} ${req.user._id}`);
    
    res.status(200).json({
      status: 'success',
      message: 'Document removed successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create a new loan application
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.createLoan = async (req, res, next) => {
  try {
    console.log("req.body keys", Object.keys(req.body));
    console.log("req.body content types", Object.entries(req.body).map(([key, value]) => 
      `${key}: ${typeof value} ${typeof value === 'string' ? `(length: ${value.length})` : ''}`
    ));
    
    // Log the incoming request for debugging
    logger.info(`Received loan application submission from user: ${req.user._id}`);
    
    // Get user and borrower profile
    let borrower, primaryBorrowerId;
    
    if (req.user.role === 'borrower') {
      // For borrower users, use their own profile
      borrower = await Borrower.findOne({ user: req.user._id });
      
      if (!borrower) {
        return next(new ApiError('Borrower profile not found', 404));
      }
      
      primaryBorrowerId = borrower._id;
    } else {
      // For lender users, a primary borrower ID must be provided
      if (!req.body.primaryBorrower) {
        return next(new ApiError('Primary borrower ID is required', 400));
      }
      primaryBorrowerId = req.body.primaryBorrower;
      
      // Verify that the borrower exists
      borrower = await Borrower.findById(primaryBorrowerId);
      if (!borrower) {
        return next(new ApiError('Primary borrower not found', 404));
      }
    }
    
    // Parse JSON strings from form data for object fields
    const parseJsonField = (field) => {
      logger.info(`[DEBUG] parseJsonField called for field: ${field}`);
      
      if (!req.body[field]) {
        logger.info(`[DEBUG] Field ${field} is undefined or null`);
        return {};
      }
      
      if (typeof req.body[field] === 'string') {
        try {
          // Skip parsing if the string is empty or just whitespace
          if (!req.body[field].trim()) {
            logger.info(`[DEBUG] Field ${field} is an empty string`);
            return {};
          }
          
          logger.info(`[DEBUG] Attempting to parse JSON for ${field}, length: ${req.body[field].length}`);
          if (req.body[field].length > 100) {
            logger.info(`[DEBUG] ${field} content sample: ${req.body[field].substring(0, 100)}...`);
          } else {
            logger.info(`[DEBUG] ${field} content: ${req.body[field]}`);
          }
          
          const parsed = JSON.parse(req.body[field]);
          logger.info(`[DEBUG] Successfully parsed ${field} as JSON`);
          return parsed;
        } catch (err) {
          logger.error(`[DEBUG] Error parsing ${field} JSON data:`, err);
          logger.error(`[DEBUG] Failed JSON content: ${req.body[field].substring(0, 200)}...`);
          return {};
        }
      }
      
      // If it's already an object (not a string), return it as is
      if (typeof req.body[field] === 'object') {
        logger.info(`[DEBUG] Field ${field} is already an object, not parsing`);
        return req.body[field];
      }
      
      // For other types (number, boolean, etc.)
      logger.info(`[DEBUG] Field ${field} is type: ${typeof req.body[field]}, value: ${req.body[field]}`);
      return {}; // Return empty object for non-object/non-string types
    };
    
    // Log the received data structure for debugging
    logger.info(`Loan data structure: ${JSON.stringify(Object.keys(req.body))}`);
    
    // Extract data from the new form structure (URLA Form 1003 format)
    const primaryBorrower = parseJsonField('borrowerDetails');
    const property = parseJsonField('property');
    const loanDetails = parseJsonField('loanDetails');
    const assets = parseJsonField('assets');
    const income = parseJsonField('income');
    const debts = parseJsonField('debts');
    const expenses = parseJsonField('expenses');
    const propertiesOwned = parseJsonField('propertiesOwned');
    const militaryService = parseJsonField('militaryService');
    const declarations = parseJsonField('declarations');
    const demographics = parseJsonField('demographics');
    const coBorrowers = parseJsonField('coBorrowers') || [];
    const documents = req.files || [];
    
    // Debug logs to trace the data flow
    logger.info(`[DEBUG] Raw borrowerDetails field type: ${typeof req.body.borrowerDetails}`);
    if (typeof req.body.borrowerDetails === 'string') {
      logger.info(`[DEBUG] Raw borrowerDetails length: ${req.body.borrowerDetails.length}`);
      logger.info(`[DEBUG] Raw borrowerDetails sample: ${req.body.borrowerDetails.substring(0, 100)}...`);
    }
    logger.info(`[DEBUG] Parsed borrowerDetails: ${JSON.stringify(primaryBorrower)}`);
    logger.info(`[DEBUG] Parsed borrowerDetails - firstName: ${primaryBorrower.firstName}`);
    logger.info(`[DEBUG] Parsed borrowerDetails - dependents: ${JSON.stringify(primaryBorrower.dependents)}`);
    logger.info(`[DEBUG] Parsed borrowerDetails - employers: ${JSON.stringify(primaryBorrower.employers)}`);
    logger.info(`[DEBUG] Parsed borrowerDetails - previousAddresses: ${JSON.stringify(primaryBorrower.previousAddresses)}`);
    
    // Received borrower details
    logger.info(`Received borrower details: ${JSON.stringify(primaryBorrower)}`);
    
    // Prepare property data
    const propertyData = {
      zipCode: property?.zipCode || '00000',
      propertyType: property?.propertyType || 'Single Family Home',
      occupancyType: property?.occupancyType || 'Primary Residence',
      numberOfUnits: property?.numberOfUnits || 1,
      yearBuilt: property?.yearBuilt || new Date().getFullYear(),
      propertyValue: parseFloat(property?.propertyValue) || 100000,
      isNewConstruction: property?.isNewConstruction || false,
      // Add fields for property with accepted offer
      hasAcceptedOffer: property?.hasAcceptedOffer || false,
      contractPurchasePrice: parseFloat(property?.contractPurchasePrice) || 0,
      isMixedUse: property?.isMixedUse || 'No',
      isManufactured: property?.isManufactured || 'No',
      proposedRentalIncome: parseFloat(property?.proposedRentalIncome) || 0
    };
    
    // Prepare loan details data
    const cleanLoanAmount = parseFloat(loanDetails?.loanAmount) || 50000;
    
    // Base loan details that apply to all loan types
    const loanDetailsData = {
      loanType: loanDetails?.loanType || 'Purchase',
      loanAmount: cleanLoanAmount,
      downPayment: parseFloat(loanDetails?.downPayment) || 0,
      downPaymentPercentage: parseFloat(loanDetails?.downPaymentPercentage) || 20,
      interestRate: parseFloat(loanDetails?.interestRate) || 4.5,
      loanTerm: parseInt(loanDetails?.loanTerm) || 30,
      isFixedRate: loanDetails?.isFixedRate !== false, // Default to true
      includeEscrow: loanDetails?.includeEscrow !== false, // Default to true
      includeMortgageInsurance: loanDetails?.includeMortgageInsurance !== false // Default to true
    };
    
    // Add fields specific to the loan type
    if (loanDetails?.loanType === 'Purchase') {
      loanDetailsData.purchasePrice = parseFloat(loanDetails?.purchasePrice) || 0;
    } 
    else if (loanDetails?.loanType === 'Refinance') {
      loanDetailsData.yearAcquired = parseInt(loanDetails?.yearAcquired) || 0;
      loanDetailsData.currentLoanBalance = parseFloat(loanDetails?.currentLoanBalance) || 0;
      loanDetailsData.requestedLoanAmount = parseFloat(loanDetails?.requestedLoanAmount) || 0;
      loanDetailsData.refinanceType = loanDetails?.refinanceType || 'Refinance';
    } 
    else if (loanDetails?.loanType === 'Construction') {
      loanDetailsData.yearLotAcquired = parseInt(loanDetails?.yearLotAcquired) || 0;
      loanDetailsData.originalCost = parseFloat(loanDetails?.originalCost) || 0;
      loanDetailsData.existingLoans = parseFloat(loanDetails?.existingLoans) || 0;
      loanDetailsData.presentValueOfLot = parseFloat(loanDetails?.presentValueOfLot) || 0;
      loanDetailsData.costOfImprovements = parseFloat(loanDetails?.costOfImprovements) || 0;
      loanDetailsData.constructionType = loanDetails?.constructionType || 'Construction';
    }
    
    // Ensure borrower details structure is complete
    const borrowerDetailsData = {
      firstName: primaryBorrower?.firstName || '',
      middleName: primaryBorrower?.middleName || '',
      lastName: primaryBorrower?.lastName || '',
      suffix: primaryBorrower?.suffix || '',
      maritalStatus: primaryBorrower?.maritalStatus || '',
      dateOfBirth: primaryBorrower?.dateOfBirth || null,
      ssn: primaryBorrower?.ssn || '',
      citizenship: primaryBorrower?.citizenship || '',
      phone: primaryBorrower?.phone || '',
      email: primaryBorrower?.email || '',
      
      // Arrays need to be properly initialized
      dependents: Array.isArray(primaryBorrower?.dependents) ? primaryBorrower.dependents : [],
      currentAddress: primaryBorrower?.currentAddress || {},
      mailingAddress: primaryBorrower?.mailingAddress || {},
      previousAddresses: Array.isArray(primaryBorrower?.previousAddresses) ? primaryBorrower.previousAddresses : [],
      employers: Array.isArray(primaryBorrower?.employers) ? primaryBorrower.employers : []
    };
    
    // Log the processed borrower data
    logger.info(`Processed borrower details: ${JSON.stringify(borrowerDetailsData)}`);
    
    // Create new loan document with all the updated form structure data
    const newLoan = new Loan({
      primaryBorrower: primaryBorrowerId,
      // Store the borrower details directly in the loan document
      borrowerDetails: borrowerDetailsData, 
      coBorrowers: Array.isArray(coBorrowers) ? coBorrowers.map(cb => cb._id || cb) : [],
      property: propertyData,
      loanDetails: loanDetailsData,
      status: 'Application Submitted',
      financialCalculations: {
        totalIncome: parseFloat(income?.baseIncome || 0) + parseFloat(income?.overtime || 0) + 
                   parseFloat(income?.commissions || 0) + parseFloat(income?.bonuses || 0),
        totalDebts: Array.isArray(debts) ? debts.reduce((total, debt) => total + parseFloat(debt.monthlyPayment || 0), 0) : 0,
        housingRatio: 0, // Will be calculated later
        dti: 0 // Will be calculated later
      }
    });
    
    // Process any additional data from the form
    if (assets) {
      newLoan.assets = assets;
    }
    
    if (income) {
      newLoan.income = income;
    }
    
    if (debts) {
      newLoan.debts = debts;
    }
    
    if (expenses) {
      newLoan.expenses = expenses;
    }
    
    // Process properties owned data
    if (propertiesOwned) {
      // Check if propertiesOwned includes the "ownsProperty" flag
      if (propertiesOwned.ownsProperty !== undefined) {
        // Handle the structured property owned object
        const propertyOwnedData = {
          properties: propertiesOwned.properties || [],
          ownsProperty: propertiesOwned.ownsProperty || false,
          // Include housing expenses
          rent: propertiesOwned.rent || '',
          firstMortgage: propertiesOwned.firstMortgage || '',
          otherFinancing: propertiesOwned.otherFinancing || '',
          hazardInsurance: propertiesOwned.hazardInsurance || '',
          realEstateTaxes: propertiesOwned.realEstateTaxes || '',
          mortgageInsurance: propertiesOwned.mortgageInsurance || '',
          hoaDues: propertiesOwned.hoaDues || '',
          otherHousingExpenses: propertiesOwned.otherHousingExpenses || ''
        };
        
        logger.info(`Processing property owned data with ownsProperty: ${propertyOwnedData.ownsProperty}`);
        // Save the entire propertyOwnedData object instead of just the properties array
        newLoan.propertiesOwned = propertyOwnedData;
      } else if (Array.isArray(propertiesOwned)) {
        // Handle the array of properties (legacy format)
        logger.info(`Processing ${propertiesOwned.length} properties owned (legacy array format)`);
        // Convert legacy array format to new object format
        newLoan.propertiesOwned = {
          properties: propertiesOwned,
          ownsProperty: propertiesOwned.length > 0,
          rent: '',
          firstMortgage: '',
          otherFinancing: '',
          hazardInsurance: '',
          realEstateTaxes: '',
          mortgageInsurance: '',
          hoaDues: '',
          otherHousingExpenses: ''
        };
      } else {
        logger.warn('Received propertiesOwned data but format is not recognized');
      }
    }
    
    console.log('militaryService', militaryService);
    if (militaryService) {
      newLoan.militaryService = {
        hasServed: militaryService.hasServed || false,
        currentlyServing: militaryService.currentlyServing || false,
        isRetired: militaryService.isRetired || false,
        isNonActivated: militaryService.isNonActivated || false,
        isSurvivingSpouse: militaryService.isSurvivingSpouse || false,
        serviceBranch: militaryService.serviceBranch || '',
        serviceType: militaryService.serviceType || '',
        yearsOfService: militaryService.yearsOfService || 0,
        dischargeType: militaryService.dischargeType || '',
        dischargeDate: militaryService.dischargeDate ? new Date(militaryService.dischargeDate) : null,
        expirationDate: militaryService.expirationDate || ''
      };
    }
    
    // Assign declarations and demographics if provided
    if (declarations && Object.keys(declarations).length) {
      newLoan.declarations = declarations;
    }
    if (demographics && Object.keys(demographics).length) {
      newLoan.demographics = demographics;
    }
    
    // Process document uploads if any
    if (req.files && req.files.length > 0) {
      newLoan.documents = req.files.map(file => ({
        title: file.originalname,
        fileUrl: file.path,
        fileType: file.mimetype,
        fileSize: file.size,
        uploadedBy: req.user._id,
        category: 'Other'
      }));
    }
    
    // Generate a temporary loan number to satisfy the model validation
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const randomSuffix = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    const tempLoanNumber = `LN${year}${month}${day}${randomSuffix}`;
    
    // Validate coBorrowers if provided
    if (Array.isArray(coBorrowers) && coBorrowers.length > 0) {
      for (const coborrowerId of coBorrowers) {
        const coborrower = await Borrower.findById(coborrowerId._id || coborrowerId);
        if (!coborrower) {
          return next(new ApiError(`Co-borrower with ID ${coborrowerId._id || coborrowerId} not found`, 404));
        }
      }
    }
    
    // Create initial milestones
    const initialMilestones = [
      {
        title: 'Application Started',
        description: 'Loan application process initiated',
        isCompleted: true,
        completedDate: new Date(),
        order: 1
      },
      {
        title: 'Document Collection',
        description: 'Gathering required documents',
        isCompleted: false,
        order: 2
      },
      {
        title: 'Processing',
        description: 'Application is being processed',
        isCompleted: false,
        order: 3
      },
      {
        title: 'Underwriting',
        description: 'Application is under review',
        isCompleted: false,
        order: 4
      },
      {
        title: 'Conditional Approval',
        description: 'Loan conditionally approved pending final requirements',
        isCompleted: false,
        order: 5
      },
      {
        title: 'Clear to Close',
        description: 'All conditions have been met',
        isCompleted: false,
        order: 6
      },
      {
        title: 'Closing',
        description: 'Loan closing process',
        isCompleted: false,
        order: 7
      },
      {
        title: 'Funded',
        description: 'Loan has been funded',
        isCompleted: false,
        order: 8
      }
    ];
    
    // Add required fields to the newLoan object
    newLoan.loanNumber = tempLoanNumber;
    newLoan.milestones = initialMilestones;
    newLoan.assignedLoanOfficer = req.user.role === 'lender' ? req.user._id : null;
    newLoan.processingStatus = 'Application';
    newLoan.completionPercentage = 10;
    
    // Save the loan
    const loan = await newLoan.save();
    
    // Log the new loan creation
    logger.info(`New loan application created: ${loan.loanNumber}`);
    
    res.status(201).json({
      status: 'success',
      message: 'Loan application created successfully',
      data: loan
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all loans with filtering and pagination
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.getAllLoans = async (req, res, next) => {
  try {
    // Extract query parameters for filtering and pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    // Extract filter parameters
    const { status, loanType, minAmount, maxAmount, fromDate, toDate } = req.query;
    
    // Build query object based on filters
    const query = {};
    
    // Add role-specific filters
    if (req.user.role === 'borrower') {
      // For borrowers, get their ID from user reference
      const borrower = await Borrower.findOne({ user: req.user._id });
      
      if (!borrower) {
        return next(new ApiError('Borrower profile not found', 404));
      }
      
      // Show only loans where they are primary or co-borrower
      query.$or = [
        { primaryBorrower: borrower._id },
        { coBorrowers: borrower._id }
      ];
      
      // Exclude drafts by default unless explicitly requested
      if (status !== 'draft') {
        query.isDraft = { $ne: true };
      }
    }
    
    // Add filters if provided
    if (status) query.status = status;
    if (loanType) query['loanDetails.loanType'] = loanType;
    
    // Amount range filters
    if (minAmount) query['loanDetails.loanAmount'] = { $gte: parseFloat(minAmount) };
    if (maxAmount) {
      if (query['loanDetails.loanAmount']) {
        query['loanDetails.loanAmount'].$lte = parseFloat(maxAmount);
      } else {
        query['loanDetails.loanAmount'] = { $lte: parseFloat(maxAmount) };
      }
    }
    
    // Date range filters
    if (fromDate || toDate) {
      query.createdAt = {};
      if (fromDate) query.createdAt.$gte = new Date(fromDate);
      if (toDate) query.createdAt.$lte = new Date(toDate);
    }
    
    // Execute query with pagination
    const loans = await Loan.find(query)
      .populate('primaryBorrower', 'firstName lastName email phone')
      .populate('assignedLoanOfficer', 'firstName lastName email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    
    // Get total count for pagination
    const total = await Loan.countDocuments(query);
    
    // Return paginated results
    res.status(200).json({
      status: 'success',
      data: {
        loans,
        pagination: {
          total,
          page,
          limit,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get a single loan by ID
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.getLoan = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Find the loan
    const loan = await Loan.findById(id)
      .populate('primaryBorrower')
      .populate('coBorrowers')
      .populate('assignedLoanOfficer', 'firstName lastName email phone');
    
    if (!loan) {
      return next(new ApiError('Loan not found', 404));
    }
    
    // Check permissions
    if (req.user.role === 'borrower') {
      // Find the borrower profile
      const borrower = await Borrower.findOne({ user: req.user._id });
      
      // Check if this borrower is the primary or co-borrower on the loan
      const isPrimaryBorrower = loan.primaryBorrower._id.toString() === borrower._id.toString();
      const isCoBorrower = loan.coBorrowers.some(coBorrower => 
        coBorrower._id.toString() === borrower._id.toString()
      );
      
      if (!isPrimaryBorrower && !isCoBorrower) {
        return next(new ApiError('You are not authorized to view this loan', 403));
      }
    }
    // Lenders and admins can view any loan
    
    res.status(200).json({
      status: 'success',
      data: loan
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get a loan by its loan number
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.getLoanByNumber = async (req, res, next) => {
  try {
    const { number } = req.params;
    
    // Find the loan by loanNumber instead of _id
    const loan = await Loan.findOne({ loanNumber: number })
      .populate('primaryBorrower')
      .populate('coBorrowers')
      .populate('assignedLoanOfficer', 'firstName lastName email phone');
    
    if (!loan) {
      return next(new ApiError('Loan not found', 404));
    }
    
    // Check permissions
    if (req.user.role === 'borrower') {
      // Find the borrower profile
      const borrower = await Borrower.findOne({ user: req.user._id });
      
      // Check if this borrower is the primary or co-borrower on the loan
      const isPrimaryBorrower = loan.primaryBorrower._id.toString() === borrower._id.toString();
      const isCoBorrower = loan.coBorrowers.some(coBorrower => 
        coBorrower._id.toString() === borrower._id.toString()
      );
      
      if (!isPrimaryBorrower && !isCoBorrower) {
        return next(new ApiError('You are not authorized to view this loan', 403));
      }
    }
    // Lenders and admins can view any loan
    
    res.status(200).json({
      status: 'success',
      data: loan
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update loan details
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.updateLoan = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // console.log('[DEBUG] Received update loan request for ID:', id);
    // console.log('[DEBUG] Request body:', JSON.stringify(req.body, null, 2));
    
    // Verification and permission checks
    const loan = await Loan.findById(id);
    
    if (!loan) {
      return next(new ApiError('Loan not found', 404));
    }
    
    // console.log('[DEBUG] Existing loan found:', loan._id);
    
    // Check permissions
    if (req.user.role === 'borrower') {
      const borrower = await Borrower.findOne({ user: req.user._id });
      
      const isPrimaryBorrower = loan.primaryBorrower.toString() === borrower._id.toString();
      const isCoBottower = loan.coBorrowers.some(coBorrower => 
        coBorrower.toString() === borrower._id.toString()
      );
      
      if (!isPrimaryBorrower && !isCoBottower) {
        return next(new ApiError('You are not authorized to update this loan', 403));
      }
      
      // Borrowers can only update certain fields
      // const allowedFields = ['property', 'loanDetails', 'loanParameters', 'loanCalculations'];
      
      // const updateData = {};
      // Object.keys(req.body).forEach(key => {
      //   if (allowedFields.includes(key)) {
      //     updateData[key] = req.body[key];
      //   }
      // });
      const updateData = req.body;
      
      // Update the loan
      const updatedLoan = await Loan.findByIdAndUpdate(
        id,
        updateData,
        { 
          new: true,
          runValidators: true 
        }
      );
      
      // Log the update
      logger.info(`Loan ${updatedLoan.loanNumber} updated by borrower ${req.user._id}`);
      
      return res.status(200).json({
        status: 'success',
        message: 'Loan updated successfully',
        data: updatedLoan
      });
    }
    
    // Lenders and admins can update more fields
    if (req.user.role === 'lender' || req.user.role === 'admin') {
      // const allowedFields = [
      //   'property', 'loanDetails', 'status', 'processingStatus', 'marketingStatus',
      //   'approvalType', 'approvalExpirationDate', 'closeOfEscrowDate',
      //   'completionPercentage', 'assignedLoanOfficer', 'loanParameters', 'loanCalculations'
      // ];
      
      // const updateData = {};
      // Object.keys(req.body).forEach(key => {
      //   if (allowedFields.includes(key)) {
      //     updateData[key] = req.body[key];
      //   }
      // });

      const updateData = req.body;
      
      // Update the loan
      const updatedLoan = await Loan.findByIdAndUpdate(
        id,
        updateData,
        { 
          new: true,
          runValidators: true 
        }
      );
      
      // Log the update
      logger.info(`Loan ${updatedLoan.loanNumber} updated by ${req.user.role} ${req.user._id}`);
      
      return res.status(200).json({
        status: 'success',
        message: 'Loan updated successfully',
        data: updatedLoan
      });
    }
    
    // Fallback
    return next(new ApiError('You are not authorized to update this loan', 403));
  } catch (error) {
    next(error);
  }
};

/**
 * Update a loan by its loan number
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.updateLoanByNumber = async (req, res, next) => {
  try {
    const { number } = req.params;
    
    // Find the loan by loanNumber instead of _id
    const loan = await Loan.findOne({ loanNumber: number });
    
    
    if (!loan) {
      return next(new ApiError('Loan not found', 404));
    }
    
    // Check permissions
    if (req.user.role === 'borrower') {
      const borrower = await Borrower.findOne({ user: req.user._id });
      
      const isPrimaryBorrower = loan.primaryBorrower.toString() === borrower._id.toString();
      const isCoBottower = loan.coBorrowers.some(coBorrower => 
        coBorrower.toString() === borrower._id.toString()
      );
      
      if (!isPrimaryBorrower && !isCoBottower) {
        return next(new ApiError('You are not authorized to update this loan', 403));
      }
      
      // Borrowers can only update certain fields
      // Add all possible fields you want to allow
      const allowedFields = [
        'property', 'loanDetails', 'borrowerDetails', 'assets', 'income', 
        'debts', 'expenses', 'propertiesOwned', 'militaryService', 
        'declarations', 'demographics'
        // add any other fields you need
      ];
      const updateData = req.body;

      console.log("updateData", updateData);
      // const updateData = {};
      // Object.keys(req.body).forEach(key => {
      //   if (allowedFields.includes(key)) {
      //     updateData[key] = req.body[key];
      //   }
      // });
      
      // Update the loan
      const updatedLoan = await Loan.findOneAndUpdate(
        { loanNumber: number },
        updateData,
        { 
          new: true,
          runValidators: true 
        }
      );
      
      // Log the update
      logger.info(`Loan ${updatedLoan.loanNumber} updated by borrower ${req.user._id}`);
      
      return res.status(200).json({
        status: 'success',
        message: 'Loan updated successfully',
        data: updatedLoan
      });
    }
    
    // Lenders and admins can update more fields
    if (req.user.role === 'lender' || req.user.role === 'admin') {
      // const allowedFields = [
      //   'property', 'loanDetails', 'status', 'processingStatus', 'marketingStatus',
      //   'approvalType', 'approvalExpirationDate', 'closeOfEscrowDate',
      //   'completionPercentage', 'assignedLoanOfficer'
      // ];
      
      // const updateData = {};
      // Object.keys(req.body).forEach(key => {
      //   if (allowedFields.includes(key)) {
      //     updateData[key] = req.body[key];
      //   }
      // });

      const updateData = req.body;
      console.log("updateData", updateData);
      
      // Update the loan
      const updatedLoan = await Loan.findOneAndUpdate(
        { loanNumber: number },
        updateData,
        { 
          new: true,
          runValidators: true 
        }
      );
      
      // Log the update
      logger.info(`Loan ${updatedLoan.loanNumber} updated by ${req.user.role} ${req.user._id}`);
      
      return res.status(200).json({
        status: 'success',
        message: 'Loan updated successfully',
        data: updatedLoan
      });
    }
    
    // Fallback
    return next(new ApiError('You are not authorized to update this loan', 403));
  } catch (error) {
    next(error);
  }
};

/**
 * Update loan status and milestones
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.updateLoanStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, processingStatus, marketingStatus, completionPercentage } = req.body;
    
    // Only lenders and admins can update loan status
    if (req.user.role !== 'lender' && req.user.role !== 'admin') {
      return next(new ApiError('You are not authorized to update loan status', 403));
    }
    
    // Find the loan
    const loan = await Loan.findById(id);
    
    if (!loan) {
      return next(new ApiError('Loan not found', 404));
    }
    
    // Prepare update data
    const updateData = {};
    
    if (status) updateData.status = status;
    if (processingStatus) updateData.processingStatus = processingStatus;
    if (marketingStatus) updateData.marketingStatus = marketingStatus;
    if (completionPercentage !== undefined) updateData.completionPercentage = completionPercentage;
    
    // Auto-update milestone if status changed
    if (status && status !== loan.status) {
      // Find the corresponding milestone
      const milestoneMap = {
        'Pre-Qualification': 'Application Started',
        'Application Started': 'Application Started',
        'Application Submitted': 'Application Started',
        'Processing': 'Processing',
        'Underwriting': 'Underwriting',
        'Conditional Approval': 'Conditional Approval',
        'Clear to Close': 'Clear to Close',
        'Closed': 'Closing',
        'Funded': 'Funded'
      };
      
      const milestoneTitle = milestoneMap[status];
      
      if (milestoneTitle) {
        // Update the milestone
        const milestoneIndex = loan.milestones.findIndex(m => m.title === milestoneTitle);
        
        if (milestoneIndex !== -1) {
          loan.milestones[milestoneIndex].isCompleted = true;
          loan.milestones[milestoneIndex].completedDate = new Date();
          
          // Also update previous milestones if they're not completed
          for (let i = 0; i < milestoneIndex; i++) {
            if (!loan.milestones[i].isCompleted) {
              loan.milestones[i].isCompleted = true;
              loan.milestones[i].completedDate = new Date();
            }
          }
          
          updateData.milestones = loan.milestones;
        }
      }
    }
    
    // Update the loan
    const updatedLoan = await Loan.findByIdAndUpdate(
      id,
      updateData,
      { 
        new: true,
        runValidators: true 
      }
    );
    
    // Log the status update
    logger.info(`Loan ${updatedLoan.loanNumber} status updated to ${status || updatedLoan.status}`);
    
    res.status(200).json({
      status: 'success',
      message: 'Loan status updated successfully',
      data: updatedLoan
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Add or update a milestone
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.updateMilestone = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { milestoneId, title, description, isCompleted, order } = req.body;
    
    // Only lenders and admins can update milestones
    if (req.user.role !== 'lender' && req.user.role !== 'admin') {
      return next(new ApiError('You are not authorized to update milestones', 403));
    }
    
    // Find the loan
    const loan = await Loan.findById(id);
    
    if (!loan) {
      return next(new ApiError('Loan not found', 404));
    }
    
    // If milestoneId provided, update existing milestone
    if (milestoneId) {
      const milestoneIndex = loan.milestones.findIndex(m => m._id.toString() === milestoneId);
      
      if (milestoneIndex === -1) {
        return next(new ApiError('Milestone not found', 404));
      }
      
      // Update milestone fields
      if (title) loan.milestones[milestoneIndex].title = title;
      if (description) loan.milestones[milestoneIndex].description = description;
      if (order) loan.milestones[milestoneIndex].order = order;
      
      // Handle completion status change
      if (isCompleted !== undefined && loan.milestones[milestoneIndex].isCompleted !== isCompleted) {
        loan.milestones[milestoneIndex].isCompleted = isCompleted;
        
        if (isCompleted) {
          loan.milestones[milestoneIndex].completedDate = new Date();
        } else {
          loan.milestones[milestoneIndex].completedDate = undefined;
        }
      }
    } else {
      // Create new milestone
      const newMilestone = {
        title,
        description,
        order,
        isCompleted: isCompleted || false
      };
      
      if (isCompleted) {
        newMilestone.completedDate = new Date();
      }
      
      loan.milestones.push(newMilestone);
    }
    
    // Sort milestones by order
    loan.milestones.sort((a, b) => a.order - b.order);
    
    // Save the loan
    await loan.save();
    
    // Log the milestone update
    logger.info(`Milestone ${milestoneId ? 'updated' : 'added'} for loan ${loan.loanNumber}`);
    
    res.status(200).json({
      status: 'success',
      message: `Milestone ${milestoneId ? 'updated' : 'added'} successfully`,
      data: loan.milestones
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Add a condition to a loan
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.addCondition = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, description, category, status, dueDate, assignedTo } = req.body;
    
    // Only lenders and admins can add conditions
    if (req.user.role !== 'lender' && req.user.role !== 'admin') {
      return next(new ApiError('You are not authorized to add conditions', 403));
    }
    
    // Find the loan
    const loan = await Loan.findById(id);
    
    if (!loan) {
      return next(new ApiError('Loan not found', 404));
    }
    
    // Create new condition
    const newCondition = {
      title,
      description,
      category,
      status: status || 'Pending',
      assignedTo,
      dueDate: dueDate ? new Date(dueDate) : undefined
    };
    
    // Add to conditions array
    loan.conditions.push(newCondition);
    
    // Save the loan
    await loan.save();
    
    // Log the condition addition
    logger.info(`Condition "${title}" added to loan ${loan.loanNumber}`);
    
    res.status(201).json({
      status: 'success',
      message: 'Condition added successfully',
      data: newCondition
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update a condition
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.updateCondition = async (req, res, next) => {
  try {
    const { loanId, conditionId } = req.params;
    const { title, description, category, status, dueDate, assignedTo } = req.body;

    // Only lenders and admins can update conditions
    if (req.user.role !== 'lender' && req.user.role !== 'admin') {
      return next(new ApiError('You are not authorized to update conditions', 403));
    }

    const loan = await Loan.findById(loanId);
    if (!loan) {
      return next(new ApiError('Loan not found', 404));
    }

    // Find the condition by ID
    const conditionIndex = loan.conditions.findIndex(c => c._id.toString() === conditionId);
    if (conditionIndex === -1) {
      return next(new ApiError('Condition not found', 404));
    }

    // Update condition fields
    if (title) loan.conditions[conditionIndex].title = title;
    if (description) loan.conditions[conditionIndex].description = description;
    if (category) loan.conditions[conditionIndex].category = category;
    if (dueDate) loan.conditions[conditionIndex].dueDate = new Date(dueDate);
    if (assignedTo) loan.conditions[conditionIndex].assignedTo = assignedTo;

    // Special handling for status changes
    if (status && loan.conditions[conditionIndex].status !== status) {
      loan.conditions[conditionIndex].status = status;

      if (status === 'Completed' || status === 'Approved') {
        loan.conditions[conditionIndex].completedDate = new Date();
      }
    }

    // Save the loan with updated condition
    await loan.save();

    // Log the update
    logger.info(`Condition "${loan.conditions[conditionIndex].title}" updated for loan ${loan.loanNumber}`);

    return res.status(200).json({
      status: 'success',
      message: 'Condition updated successfully',
      data: loan.conditions[conditionIndex]
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Remove a condition from a loan
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.removeCondition = async (req, res, next) => {
  try {
    // The route parameters are named ':id' and ':conditionId' in loan.routes.js
    const { id: loanId, conditionId } = req.params;

    // Allow both borrowers and lenders to remove conditions when documents are uploaded
    const loan = await Loan.findById(loanId);
    if (!loan) {
      return next(new ApiError('Loan not found', 404));
    }

    // For borrowers, verify they're associated with the loan
    if (req.user.role === 'borrower') {
      const borrower = await Borrower.findOne({ user: req.user._id });
      
      if (!borrower) {
        return next(new ApiError('Borrower profile not found', 404));
      }

      const isPrimaryBorrower = loan.primaryBorrower.toString() === borrower._id.toString();
      const isCoBottower = loan.coBorrowers.some(coBorrower => 
        coBorrower.toString() === borrower._id.toString()
      );
      
      if (!isPrimaryBorrower && !isCoBottower) {
        return next(new ApiError('You are not authorized to modify this loan', 403));
      }
    }

    // Find the condition by ID
    const conditionIndex = loan.conditions.findIndex(c => c._id.toString() === conditionId);
    if (conditionIndex === -1) {
      return next(new ApiError('Condition not found', 404));
    }

    // Store condition info for logging
    const conditionTitle = loan.conditions[conditionIndex].title;

    // Remove the condition from the array
    loan.conditions.splice(conditionIndex, 1);

    // Save the loan with the condition removed
    await loan.save();

    // Log the removal
    logger.info(`Condition "${conditionTitle}" removed from loan ${loan.loanNumber} by ${req.user.role}`);

    return res.status(200).json({
      status: 'success',
      message: 'Condition removed successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Add a note to a loan
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.addNote = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { content } = req.body;
    
    if (!content) {
      return next(new ApiError('Note content is required', 400));
    }
    
    // Find the loan
    const loan = await Loan.findById(id);
    
    if (!loan) {
      return next(new ApiError('Loan not found', 404));
    }
    
    // Check permissions for borrowers
    if (req.user.role === 'borrower') {
      const borrower = await Borrower.findOne({ user: req.user._id });
      
      const isPrimaryBorrower = loan.primaryBorrower.toString() === borrower._id.toString();
      const isCoBottower = loan.coBorrowers.some(coBorrower => 
        coBorrower.toString() === borrower._id.toString()
      );
      
      if (!isPrimaryBorrower && !isCoBottower) {
        return next(new ApiError('You are not authorized to add notes to this loan', 403));
      }
    }
    
    // Create new note
    const newNote = {
      content,
      createdBy: req.user._id,
      createdAt: new Date()
    };
    
    // Add to notes array
    loan.notes.push(newNote);
    
    // Save the loan
    await loan.save();
    
    // Log the note addition
    logger.info(`Note added to loan ${loan.loanNumber} by ${req.user.role} ${req.user._id}`);
    
    res.status(201).json({
      status: 'success',
      message: 'Note added successfully',
      data: newNote
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Save a loan application as draft
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.saveDraft = async (req, res, next) => {
  try {
    // Verify user is a borrower
    if (req.user.role !== 'borrower') {
      return next(new ApiError('Only borrowers can save loan drafts', 403));
    }
    
    // Get borrower profile
    const borrower = await Borrower.findOne({ user: req.user._id });
    
    if (!borrower) {
      return next(new ApiError('Borrower profile not found', 404));
    }

    const draftData = req.body;
    
    // For debugging purposes, log the incoming data
    logger.info(`Saving loan draft for borrower: ${borrower._id}`);

    // Check if the draft already exists (if ID is provided)
    if (draftData._id) {
      const existingDraft = await Loan.findById(draftData._id);
      
      if (existingDraft) {
        // Verify ownership
        if (existingDraft.primaryBorrower.toString() !== borrower._id.toString()) {
          return next(new ApiError('You are not authorized to update this draft', 403));
        }
        
        // Update existing draft
        Object.assign(existingDraft, draftData);
        existingDraft.updatedAt = new Date();
        
        // Save but bypass schema validation for draft
        const result = await Loan.findByIdAndUpdate(
          existingDraft._id, 
          { $set: { ...draftData, updatedAt: new Date() } },
          { new: true, runValidators: false }
        );
        
        logger.info(`Loan draft updated: ${result._id} by borrower ${borrower._id}`);
        
        return res.status(200).json({
          status: 'success',
          message: 'Loan draft updated successfully',
          data: result
        });
      }
    }
    
    // Generate a temporary loan number for the draft
    const date = new Date();
    const tempPrefix = `DRAFT-${date.getFullYear().toString().slice(-2)}${(date.getMonth() + 1).toString().padStart(2, '0')}`;
    const randomSuffix = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    const tempLoanNumber = `${tempPrefix}${randomSuffix}`;
    
    // Create minimal data to satisfy required fields but with isDraft flag
    // We're using insertMany to bypass mongoose validation
    const draftDocument = {
      primaryBorrower: borrower._id,
      loanNumber: tempLoanNumber, // Temporary number for draft
      status: 'draft',
      processingStatus: 'Draft',
      completionPercentage: draftData.completionPercentage || 0,
      isDraft: true,
      // Add minimal required fields with default placeholders
      property: draftData.property || {
        addressLine1: 'Draft Address',
        city: 'Draft City',
        state: 'Draft State',
        zipCode: 'Draft Zip',
        propertyType: 'Single Family Residence',
        occupancyType: 'Primary Residence',
        propertyValue: 0
      },
      loanDetails: draftData.loanDetails || {
        loanType: 'Purchase',
        loanAmount: 0
      },
      // Add any other data provided
      ...draftData
    };
    
    // Insert directly into MongoDB to bypass schema validation
    const result = await mongoose.connection.collection('loans').insertOne(draftDocument);
    const newDraft = await Loan.findById(result.insertedId);
    
    logger.info(`New loan draft created: ${newDraft._id} by borrower ${borrower._id}`);
    
    res.status(201).json({
      status: 'success',
      message: 'Loan draft created successfully',
      data: newDraft
    });
  } catch (error) {
    logger.error(`Error saving loan draft: ${error.message}`);
    next(error);
  }
};

/**
 * Get recent draft loans
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.getRecentDrafts = async (req, res, next) => {
  try {
    // Verify user is a borrower
    if (req.user.role !== 'borrower') {
      return next(new ApiError('Only borrowers can access loan drafts', 403));
    }
    
    // Get borrower profile
    const borrower = await Borrower.findOne({ user: req.user._id });
    
    if (!borrower) {
      return next(new ApiError('Borrower profile not found', 404));
    }
    
    // Get recent drafts
    const recentDrafts = await Loan.find({
      primaryBorrower: borrower._id,
      status: 'draft',
      isDraft: true
    })
    .sort({ updatedAt: -1 })
    .limit(5);
    
    res.status(200).json({
      status: 'success',
      data: recentDrafts
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get specific draft loan
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.getDraft = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Verify user is a borrower
    if (req.user.role !== 'borrower') {
      return next(new ApiError('Only borrowers can access loan drafts', 403));
    }
    
    // Get borrower profile
    const borrower = await Borrower.findOne({ user: req.user._id });
    
    if (!borrower) {
      return next(new ApiError('Borrower profile not found', 404));
    }
    
    // Get the draft
    const draft = await Loan.findOne({
      _id: id,
      primaryBorrower: borrower._id,
      status: 'draft',
      isDraft: true
    });
    
    if (!draft) {
      return next(new ApiError('Draft not found', 404));
    }
    
    res.status(200).json({
      status: 'success',
      data: draft
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Calculate loan metrics
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.calculateLoanMetrics = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Find the loan
    const loan = await Loan.findById(id)
      .populate('primaryBorrower');
    
    if (!loan) {
      return next(new ApiError('Loan not found', 404));
    }
    
    // Check permissions
    if (req.user.role === 'borrower') {
      const borrower = await Borrower.findOne({ user: req.user._id });
      
      const isPrimaryBorrower = loan.primaryBorrower._id.toString() === borrower._id.toString();
      const isCoBottower = loan.coBorrowers.some(coBorrower => 
        coBorrower.toString() === borrower._id.toString()
      );
      
      if (!isPrimaryBorrower && !isCoBottower) {
        return next(new ApiError('You are not authorized to access this loan', 403));
      }
    }
    
    // Calculate LTV
    const ltv = loan.loanDetails.loanAmount / loan.property.propertyValue * 100;
    
    // Calculate monthly payment (simplified calculation)
    const principal = loan.loanDetails.loanAmount;
    const interestRate = loan.loanDetails.interestRate / 100 / 12; // Monthly interest rate
    const termMonths = loan.loanDetails.loanTerm * 12;
    
    // Calculate monthly payment using the mortgage formula
    const monthlyPayment = principal * interestRate * Math.pow(1 + interestRate, termMonths) / 
      (Math.pow(1 + interestRate, termMonths) - 1);
    
    // Calculate debt-to-income ratio
    let dti = 0;
    let housingRatio = 0;
    
    if (loan.primaryBorrower.financialInfo) {
      const monthlyIncome = loan.primaryBorrower.financialInfo.monthlyIncome || 0;
      if (monthlyIncome > 0) {
        housingRatio = (monthlyPayment / monthlyIncome) * 100;
        
        // Total debts including housing
        const totalDebts = (loan.primaryBorrower.financialInfo.totalDebts || 0) + monthlyPayment;
        dti = (totalDebts / monthlyIncome) * 100;
      }
    }
    
    // Update loan with calculated metrics
    const financialCalculations = {
      ltv: parseFloat(ltv.toFixed(2)),
      monthlyPayment: parseFloat(monthlyPayment.toFixed(2)),
      dti: parseFloat(dti.toFixed(2)),
      housingRatio: parseFloat(housingRatio.toFixed(2)),
      piti: parseFloat(monthlyPayment.toFixed(2)), // Simplified PITI without taxes & insurance
      totalMonthlyPayment: parseFloat(monthlyPayment.toFixed(2))
    };
    
    // Save calculations to loan
    loan.financialCalculations = financialCalculations;
    loan.loanDetails.monthlyPayment = financialCalculations.monthlyPayment;
    
    await loan.save();
    
    res.status(200).json({
      status: 'success',
      message: 'Loan metrics calculated successfully',
      data: financialCalculations
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get available loan types
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.getLoanTypes = async (req, res, next) => {
  try {
    // Return a list of available loan types
    const loanTypes = [
      { id: 'conventional', name: 'Conventional', description: 'Traditional mortgage loan' },
      { id: 'fha', name: 'FHA', description: 'Federal Housing Administration loan' },
      { id: 'va', name: 'VA', description: 'Veterans Affairs loan' },
      { id: 'usda', name: 'USDA', description: 'USDA Rural Development loan' },
      { id: 'jumbo', name: 'Jumbo', description: 'Loan exceeding conforming loan limits' }
    ];
    
    res.status(200).json({
      status: 'success',
      data: loanTypes
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update loan parameters and calculations
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.updateLoanParameters = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { loanParameters, loanCalculations } = req.body;
    
    // Find the loan
    const loan = await Loan.findById(id);
    
    if (!loan) {
      return next(new ApiError('Loan not found', 404));
    }
    
    // Check permissions
    if (req.user.role === 'borrower') {
      const borrower = await Borrower.findOne({ user: req.user._id });
      
      if (!borrower) {
        return next(new ApiError('Borrower profile not found', 404));
      }
      
      const isPrimaryBorrower = loan.primaryBorrower.toString() === borrower._id.toString();
      const isCoBottower = loan.coBorrowers && loan.coBorrowers.some(coBorrower => 
        coBorrower.toString() === borrower._id.toString()
      );
      
      if (!isPrimaryBorrower && !isCoBottower) {
        return next(new ApiError('You are not authorized to modify this loan', 403));
      }
    }
    
    // Update or create loan parameters if provided
    if (loanParameters) {
      loan.loanParameters = loan.loanParameters || {};
      
      // Update properties
      Object.assign(loan.loanParameters, loanParameters);
    }
    
    // Update or create loan calculations if provided
    if (loanCalculations) {
      loan.loanCalculations = loan.loanCalculations || {};
      
      // Update properties
      Object.assign(loan.loanCalculations, loanCalculations);
    }
    
    // Save the updated loan
    await loan.save();
    
    // Log the update
    logger.info(`Loan parameters updated for loan ${loan.loanNumber} by ${req.user.role} ${req.user._id}`);
    
    res.status(200).json({
      status: 'success',
      message: 'Loan parameters updated successfully',
      data: {
        loanParameters: loan.loanParameters,
        loanCalculations: loan.loanCalculations
      }
    });
  } catch (error) {
    next(error);
  }
};
