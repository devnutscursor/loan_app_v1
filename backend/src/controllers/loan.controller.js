const mongoose = require("mongoose");
const Loan = require("../models/loan.model");
const Borrower = require("../models/borrower.model");
const Lender = require("../models/lender.model");
const User = require("../models/user.model");
const ApiError = require("../utils/apiError");
const logger = require("../utils/logger");
const xml2js = require('xml2js');
const fs = require('fs');
const path = require('path');
const { createDefaultMilestonesForLoan } = require('../utils/defaultMilestones');
const { USE_S3, s3Client } = require('../services/s3.service');

// Check if we should use S3 or local storage
// const USE_S3 = process.env.USE_S3 === 'true' || false;


function mapEthnicity(xmlEthnicity) {
  const mapping = {
      'NotHispanicOrLatino': 'Not Hispanic or Latino',
      'HispanicOrLatino': 'Hispanic or Latino',
      'InformationNotProvided': 'I do not wish to provide this information'
  };
  return mapping[xmlEthnicity] || 'I do not wish to provide this information';
}

function mapRace(xmlRace) {
  const mapping = {
      'Asian': 'Asian',
      'White': 'White',
      'BlackOrAfricanAmerican': 'Black or African American',
      'AmericanIndianOrAlaskaNative': 'American Indian or Alaska Native',
      'NativeHawaiianOrOtherPacificIslander': 'Native Hawaiian or Other Pacific Islander',
      'InformationNotProvided': 'I do not wish to provide this information'
  };
  return mapping[xmlRace] || 'I do not wish to provide this information';
}

function mapGender(xmlGender) {
  const mapping = {
      'Male': 'Male',
      'Female': 'Female',
      'InformationNotProvided': 'I do not wish to provide this information'
  };
  return mapping[xmlGender] || 'I do not wish to provide this information';
}

function mapMaritalStatus(xmlMaritalStatus) {
  const mapping = {
      'Married': 'Married',
      'Unmarried': 'Single',
      'Separated': 'Separated',
      'Divorced': 'Divorced',
      'Widowed': 'Widowed'
  };
  return mapping[xmlMaritalStatus] || 'Single';
}

function mapEmploymentStatus(xmlStatus) {
  const mapping = {
      'currentEmployer': 'Current Employer',
      'pastEmployer': 'Past Employer',
      
  };
  return mapping[xmlStatus] || 'Current Employer';
}

function mapCitizenship(xmlCitizenship) {
  const mapping = {
      'USCitizen': 'U.S. Citizen',
      'PermanentResidentAlien': 'Permanent Resident Alien',
      'NonPermanentResidentAlien': 'Non-Permanent Resident Alien'
  };
  return mapping[xmlCitizenship] || 'U.S. Citizen';
}

function mapResidencyBasis(xmlResidencyBasis) {
  const mapping = {
      'Own': 'Own',
      'Rent': 'Rent',
      'LivingRentFree': 'Living Rent-Free'
  };
  return mapping[xmlResidencyBasis] || 'Own';
}

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
      return next(new ApiError("Loan not found", 404));
    }

    // Check permissions for borrowers
    if (req.user.role === "borrower") {
      const borrower = await Borrower.findOne({ user: req.user._id });

      if (!borrower) {
        return next(new ApiError("Borrower profile not found", 404));
      }

      const isPrimaryBorrower =
        loan.borrower.toString() === borrower._id.toString();
      const isCoBorrower = loan.coBorrowers.some(
        (coBorrower) => coBorrower.toString() === borrower._id.toString()
      );

      if (!isPrimaryBorrower && !isCoBorrower) {
        return next(
          new ApiError("You are not authorized to modify this loan", 403)
        );
      }
    }

    // Find the document in the loan documents array
    if (!loan.documents || !Array.isArray(loan.documents)) {
      return next(new ApiError("No documents found for this loan", 404));
    }

    // Find the document index
    const documentIndex = loan.documents.findIndex(
      (doc) => doc._id.toString() === documentId
    );

    if (documentIndex === -1) {
      return next(new ApiError("Document not found", 404));
    }

    // Remove the document from the array
    loan.documents.splice(documentIndex, 1);

    // If it's a file path, we could also delete it from storage here
    // This would require additional file system operations

    // Save the loan
    await loan.save();

    // Log the document removal
    logger.info(
      `Document removed from loan ${loan.loanNumber} by ${req.user.role} ${req.user._id}`
    );

    res.status(200).json({
      status: "success",
      message: "Document removed successfully",
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
    console.log(
      "req.body content types",
      Object.entries(req.body).map(
        ([key, value]) =>
          `${key}: ${typeof value} ${
            typeof value === "string" ? `(length: ${value.length})` : ""
          }`
      )
    );

    // Log the incoming request for debugging
    logger.info(
      `Received loan application submission from user: ${req.user._id}`
    );

    // Get user and borrower profile
    let borrower, primaryBorrowerId;

    if (req.user.role === "borrower") {
      // For borrower users, use their own profile
      borrower = await Borrower.findOne({ user: req.user._id }).populate(
        "lender"
      );

      if (!borrower) {
        return next(new ApiError("Borrower profile not found", 404));
      }

      // Get the lender associated with this borrower
      if (!borrower.lender) {
        return next(
          new ApiError("No lender associated with this borrower", 400)
        );
      }

      lenderId = borrower.lender._id;
      borrowerId = borrower._id;
    } else if (req.user.role === "lender") {
      // For lender users creating a loan
      const lender = await Lender.findOne({ user: req.user._id });

      if (!lender) {
        return next(new ApiError("Lender profile not found", 404));
      }

      // A borrower ID must be provided
      if (!req.body.borrower) {
        return next(new ApiError("Borrower ID is required", 400));
      }

      borrowerId = req.body.borrower;

      // Verify that the borrower exists and belongs to this lender
      borrower = await Borrower.findById(borrowerId);
      if (!borrower) {
        return next(new ApiError("Borrower not found", 404));
      }

      // Check if this borrower belongs to the lender
      if (!borrower.lender.equals(lender._id)) {
        return next(
          new ApiError(
            "You are not authorized to create loans for this borrower",
            403
          )
        );
      }

      lenderId = lender._id;
    } else {
      // For admin users, both borrower and lender IDs must be provided
      if (!req.body.borrower || !req.body.lender) {
        return next(
          new ApiError("Both borrower and lender IDs are required", 400)
        );
      }

      borrowerId = req.body.borrower;
      lenderId = req.body.lender;

      // Verify that both borrower and lender exist
      borrower = await Borrower.findById(borrowerId);
      if (!borrower) {
        return next(new ApiError("Borrower not found", 404));
      }

      const lender = await Lender.findById(lenderId);
      if (!lender) {
        return next(new ApiError("Lender not found", 404));
      }
    }

    // Parse JSON strings from form data for object fields
    const parseJsonField = (field) => {
      logger.info(`[DEBUG] parseJsonField called for field: ${field}`);

      if (!req.body[field]) {
        logger.info(`[DEBUG] Field ${field} is undefined or null`);
        return {};
      }

      if (typeof req.body[field] === "string") {
        try {
          // Skip parsing if the string is empty or just whitespace
          if (!req.body[field].trim()) {
            logger.info(`[DEBUG] Field ${field} is an empty string`);
            return {};
          }

          logger.info(
            `[DEBUG] Attempting to parse JSON for ${field}, length: ${req.body[field].length}`
          );
          if (req.body[field].length > 100) {
            logger.info(
              `[DEBUG] ${field} content sample: ${req.body[field].substring(
                0,
                100
              )}...`
            );
          } else {
            logger.info(`[DEBUG] ${field} content: ${req.body[field]}`);
          }

          const parsed = JSON.parse(req.body[field]);
          logger.info(`[DEBUG] Successfully parsed ${field} as JSON`);
          return parsed;
        } catch (err) {
          logger.error(`[DEBUG] Error parsing ${field} JSON data:`, err);
          logger.error(
            `[DEBUG] Failed JSON content: ${req.body[field].substring(
              0,
              200
            )}...`
          );
          return {};
        }
      }

      // If it's already an object (not a string), return it as is
      if (typeof req.body[field] === "object") {
        logger.info(`[DEBUG] Field ${field} is already an object, not parsing`);
        return req.body[field];
      }

      // For other types (number, boolean, etc.)
      logger.info(
        `[DEBUG] Field ${field} is type: ${typeof req.body[field]}, value: ${
          req.body[field]
        }`
      );
      return {}; // Return empty object for non-object/non-string types
    };

    // Log the received data structure for debugging
    logger.info(
      `Loan data structure: ${JSON.stringify(Object.keys(req.body))}`
    );

    // Extract data from the new form structure (URLA Form 1003 format)
    const primaryBorrower = parseJsonField("borrowerDetails");
    const property = parseJsonField("property");
    const loanDetails = parseJsonField("loanDetails");
    const assets = parseJsonField("assets");
    const income = parseJsonField("income");
    const debts = parseJsonField("debts");
    const expenses = parseJsonField("expenses");
    const propertiesOwned = parseJsonField("propertiesOwned");
    const militaryService = parseJsonField("militaryService");
    const declarations = parseJsonField("declarations");
    const demographics = parseJsonField("demographics");
    const coBorrowers = parseJsonField("coBorrowers") || [];
    const documents = req.files || [];

    // Prepare property data
    const propertyData = {
      zipCode: property?.zipCode || "00000",
      propertyType: property?.propertyType || "Single Family Home",
      occupancyType: property?.occupancyType || "Primary Residence",
      numberOfUnits: property?.numberOfUnits || 1,
      yearBuilt: property?.yearBuilt || new Date().getFullYear(),
      propertyValue: parseFloat(property?.propertyValue) || 100000,
      isNewConstruction: property?.isNewConstruction || false,
      // Add fields for property with accepted offer
      hasAcceptedOffer: property?.hasAcceptedOffer || false,
      contractPurchasePrice: parseFloat(property?.contractPurchasePrice) || 0,
      isMixedUse: property?.isMixedUse || "No",
      isManufactured: property?.isManufactured || "No",
      proposedRentalIncome: parseFloat(property?.proposedRentalIncome) || 0,
    };

    // Prepare loan details data
    const cleanLoanAmount = parseFloat(loanDetails?.loanAmount) || 50000;

    // Base loan details that apply to all loan types
    const loanDetailsData = {
      loanType: loanDetails?.loanType || "Purchase",
      loanAmount: cleanLoanAmount,
      downPayment: parseFloat(loanDetails?.downPayment) || 0,
      downPaymentPercentage:
        parseFloat(loanDetails?.downPaymentPercentage) || 20,
      interestRate: parseFloat(loanDetails?.interestRate) || 4.5,
      loanTerm: parseInt(loanDetails?.loanTerm) || 30,
      isFixedRate: loanDetails?.isFixedRate !== false, // Default to true
      includeEscrow: loanDetails?.includeEscrow !== false, // Default to true
      includeMortgageInsurance: loanDetails?.includeMortgageInsurance !== false, // Default to true
    };

    // Add fields specific to the loan type
    if (loanDetails?.loanType === "Purchase") {
      loanDetailsData.purchasePrice =
        parseFloat(loanDetails?.purchasePrice) || 0;
    } else if (loanDetails?.loanType === "Refinance") {
      loanDetailsData.yearAcquired = parseInt(loanDetails?.yearAcquired) || 0;
      loanDetailsData.currentLoanBalance =
        parseFloat(loanDetails?.currentLoanBalance) || 0;
      loanDetailsData.requestedLoanAmount =
        parseFloat(loanDetails?.requestedLoanAmount) || 0;
      loanDetailsData.refinanceType = loanDetails?.refinanceType || "Refinance";
    } else if (loanDetails?.loanType === "Construction") {
      loanDetailsData.yearLotAcquired =
        parseInt(loanDetails?.yearLotAcquired) || 0;
      loanDetailsData.originalCost = parseFloat(loanDetails?.originalCost) || 0;
      loanDetailsData.existingLoans =
        parseFloat(loanDetails?.existingLoans) || 0;
      loanDetailsData.presentValueOfLot =
        parseFloat(loanDetails?.presentValueOfLot) || 0;
      loanDetailsData.costOfImprovements =
        parseFloat(loanDetails?.costOfImprovements) || 0;
      loanDetailsData.constructionType =
        loanDetails?.constructionType || "Construction";
    }

    // Ensure borrower details structure is complete
    const borrowerDetailsData = {
      firstName: primaryBorrower?.firstName || "",
      middleName: primaryBorrower?.middleName || "",
      lastName: primaryBorrower?.lastName || "",
      suffix: primaryBorrower?.suffix || "",
      maritalStatus: primaryBorrower?.maritalStatus || "",
      dateOfBirth: primaryBorrower?.dateOfBirth || null,
      ssn: primaryBorrower?.ssn || "",
      citizenship: primaryBorrower?.citizenship || "",
      phone: primaryBorrower?.phone || "",
      email: primaryBorrower?.email || "",

      // Arrays need to be properly initialized
      dependents: Array.isArray(primaryBorrower?.dependents)
        ? primaryBorrower.dependents
        : [],
      currentAddress: primaryBorrower?.currentAddress || {},
      mailingAddress: primaryBorrower?.mailingAddress || {},
      previousAddresses: Array.isArray(primaryBorrower?.previousAddresses)
        ? primaryBorrower.previousAddresses
        : [],
      employers: Array.isArray(primaryBorrower?.employers)
        ? primaryBorrower.employers
        : [],
    };

    // Log the processed borrower data
    logger.info(
      `Processed borrower details: ${JSON.stringify(borrowerDetailsData)}`
    );

    // Create new loan document with all the updated form structure data
    const newLoan = new Loan({
      borrower: borrowerId, // Use the borrower ID we determined earlier
      lender: lenderId, // Use the lender ID we determined earlier
      // Store the borrower details directly in the loan document
      borrowerDetails: borrowerDetailsData,
      coBorrowers: Array.isArray(coBorrowers)
        ? coBorrowers.map((cb) => cb._id || cb)
        : [],
      property: propertyData,
      loanDetails: loanDetailsData,
      status: "Application Submitted",
      financialCalculations: {
        totalIncome:
          parseFloat(income?.baseIncome || 0) +
          parseFloat(income?.overtime || 0) +
          parseFloat(income?.commissions || 0) +
          parseFloat(income?.bonuses || 0),
        totalDebts: Array.isArray(debts)
          ? debts.reduce(
              (total, debt) => total + parseFloat(debt.monthlyPayment || 0),
              0
            )
          : 0,
        housingRatio: 0, // Will be calculated later
        dti: 0, // Will be calculated later
      },
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
          rent: propertiesOwned.rent || "",
          firstMortgage: propertiesOwned.firstMortgage || "",
          otherFinancing: propertiesOwned.otherFinancing || "",
          hazardInsurance: propertiesOwned.hazardInsurance || "",
          realEstateTaxes: propertiesOwned.realEstateTaxes || "",
          mortgageInsurance: propertiesOwned.mortgageInsurance || "",
          hoaDues: propertiesOwned.hoaDues || "",
          otherHousingExpenses: propertiesOwned.otherHousingExpenses || "",
        };

        logger.info(
          `Processing property owned data with ownsProperty: ${propertyOwnedData.ownsProperty}`
        );
        // Save the entire propertyOwnedData object instead of just the properties array
        newLoan.propertiesOwned = propertyOwnedData;
      } else if (Array.isArray(propertiesOwned)) {
        // Handle the array of properties (legacy format)
        logger.info(
          `Processing ${propertiesOwned.length} properties owned (legacy array format)`
        );
        // Convert legacy array format to new object format
        newLoan.propertiesOwned = {
          properties: propertiesOwned,
          ownsProperty: propertiesOwned.length > 0,
          rent: "",
          firstMortgage: "",
          otherFinancing: "",
          hazardInsurance: "",
          realEstateTaxes: "",
          mortgageInsurance: "",
          hoaDues: "",
          otherHousingExpenses: "",
        };
      } else {
        logger.warn(
          "Received propertiesOwned data but format is not recognized"
        );
      }
    }

    console.log("militaryService", militaryService);
    if (militaryService) {
      newLoan.militaryService = {
        hasServed: militaryService.hasServed || false,
        currentlyServing: militaryService.currentlyServing || false,
        isRetired: militaryService.isRetired || false,
        isNonActivated: militaryService.isNonActivated || false,
        isSurvivingSpouse: militaryService.isSurvivingSpouse || false,
        serviceBranch: militaryService.serviceBranch || "",
        serviceType: militaryService.serviceType || "",
        yearsOfService: militaryService.yearsOfService || 0,
        dischargeType: militaryService.dischargeType || "",
        dischargeDate: militaryService.dischargeDate
          ? new Date(militaryService.dischargeDate)
          : null,
        expirationDate: militaryService.expirationDate || "",
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
      newLoan.documents = req.files.map((file) => ({
        title: file.originalname,
        fileUrl: file.path,
        fileType: file.mimetype,
        fileSize: file.size,
        uploadedBy: req.user._id,
        category: "Other",
      }));
    }

    // We no longer need a temporary loan number as the model will generate it
    // The loan number will be auto-generated by the pre-save hook in the loan model
    const tempLoanNumber = null;

    // Validate coBorrowers if provided
    if (Array.isArray(coBorrowers) && coBorrowers.length > 0) {
      for (const coborrowerId of coBorrowers) {
        const coborrower = await Borrower.findById(
          coborrowerId._id || coborrowerId
        );
        if (!coborrower) {
          return next(
            new ApiError(
              `Co-borrower with ID ${
                coborrowerId._id || coborrowerId
              } not found`,
              404
            )
          );
        }
      }
    }

    // Create initial milestones
    const initialMilestones = [
      {
        title: "Application Started",
        description: "Loan application process initiated",
        isCompleted: true,
        completedDate: new Date(),
        order: 1,
      },
      {
        title: "Document Collection",
        description: "Gathering required documents",
        isCompleted: false,
        order: 2,
      },
      {
        title: "Processing",
        description: "Application is being processed",
        isCompleted: false,
        order: 3,
      },
      {
        title: "Underwriting",
        description: "Application is under review",
        isCompleted: false,
        order: 4,
      },
      {
        title: "Conditional Approval",
        description: "Loan conditionally approved pending final requirements",
        isCompleted: false,
        order: 5,
      },
      {
        title: "Clear to Close",
        description: "All conditions have been met",
        isCompleted: false,
        order: 6,
      },
      {
        title: "Closing",
        description: "Loan closing process",
        isCompleted: false,
        order: 7,
      },
      {
        title: "Funded",
        description: "Loan has been funded",
        isCompleted: false,
        order: 8,
      },
    ];

    // Add required fields to the newLoan object
    newLoan.loanNumber = tempLoanNumber;
    newLoan.milestones = initialMilestones;
    newLoan.assignedLoanOfficer =
      req.user.role === "lender" ? req.user._id : null;
    newLoan.processingStatus = "Application";
    newLoan.completionPercentage = 10;

    // Save the loan
    const loan = await newLoan.save();

    // Log the new loan creation
    logger.info(`New loan application created: ${loan.loanNumber}`);

    // Add default milestones for the new loan
    try {
      await createDefaultMilestonesForLoan(loan._id);
      logger.info(`Default milestones created for loan ${loan._id}`);
    } catch (milestoneError) {
      logger.error(`Failed to create default milestones for loan ${loan._id}:`, milestoneError);
      // Continue with the response even if milestone creation fails
    }

    res.status(201).json({
      status: "success",
      message: "Loan application created successfully",
      data: loan,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all loans for a specific borrower
 * @route   GET /api/loans/borrower/:borrowerId
 * @access  Private
 */
exports.getBorrowerLoans = async (req, res, next) => {
  try {
    // Only the lender who owns the loan or admin can access
    if (req.user.role !== 'admin' && req.user.role !== 'lender') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this resource'
      });
    }
    console.log("req.user", req.user);
    console.log("req.params", req.params);

    const { borrowerId } = req.params;
    const { page = 1, limit = 10, sortBy = 'createdAt', order = 'desc' } = req.query;

    const query = {
      borrower: borrowerId,
      ...(req.user.role === 'lender')
    };

    const loans = await Loan.find(query)
      .populate('borrower', 'firstName lastName email')
      .sort({ [sortBy]: order === 'desc' ? -1 : 1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();

    console.log("loans", loans);

    const count = await Loan.countDocuments(query);

    res.status(200).json({
      success: true,
      count: loans.length,
      total: count,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      data: loans
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
    const getAllLoans = req.query.all === 'true';
    const limit = getAllLoans ? 0 : (parseInt(req.query.limit) || 10);
    const skip = getAllLoans ? 0 : (page - 1) * limit;

    // Extract filter parameters
    const { status, loanType, minAmount, maxAmount, fromDate, toDate } =
      req.query;

    // Build query object based on filters
    const query = {};

    console.log("[DEBUG] Request:", req);

    // Add role-specific filters
    if (req.user.role === "borrower") {
      // For borrowers, get their ID and associated lender from user reference
      const borrower = await Borrower.findOne({ user: req.user._id });

      if (!borrower) {
        return next(new ApiError("Borrower profile not found", 404));
      }

      // Show only loans where they are primary or co-borrower
      // and that are associated with their assigned lender
      // Check both borrower and primaryBorrower fields to handle different schema versions
      query.$or = [
        { borrower: borrower._id },
        { primaryBorrower: borrower._id },
        { coBorrowers: borrower._id },
      ];

      // Also filter by the lender assigned to this borrower
      query.lender = borrower.lender;

      // Exclude drafts by default unless explicitly requested
      if (status !== "draft") {
        query.isDraft = { $ne: true };
      }
    } else if (req.user.role === "lender") {
      // For lenders, find their lender ID
      const lender = await Lender.findOne({ user: req.user._id });

      if (!lender) {
        return next(new ApiError("Lender profile not found", 404));
      }

      // Show only loans associated with this lender
      query.lender = lender._id;
    }

    // Add filters if provided
    if (status) query.status = status;
    if (loanType) query["loanDetails.loanType"] = loanType;

    // Amount range filters
    if (minAmount)
      query["loanDetails.loanAmount"] = { $gte: parseFloat(minAmount) };
    if (maxAmount) {
      if (query["loanDetails.loanAmount"]) {
        query["loanDetails.loanAmount"].$lte = parseFloat(maxAmount);
      } else {
        query["loanDetails.loanAmount"] = { $lte: parseFloat(maxAmount) };
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
      .populate("borrower", "firstName lastName email phone")
      .populate("assignedLoanOfficer", "firstName lastName email")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    console.log("[DEBUG] Loans:", loans);
    // Get total count for pagination
    const total = await Loan.countDocuments(query);

    // Return paginated results
    res.status(200).json({
      status: "success",
      data: {
        loans,
        pagination: {
          total,
          page,
          limit,
          pages: Math.ceil(total / limit),
        },
      },
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

    // First find the loan without populating to check permissions
    const loan = await Loan.findById(id);

    if (!loan) {
      return next(new ApiError("Loan not found", 404));
    }

    // Check permissions based on user role
    if (req.user.role === "borrower") {
      // Get the borrower profile
      const borrower = await Borrower.findOne({ user: req.user._id });

      if (!borrower) {
        return next(new ApiError("Borrower profile not found", 404));
      }

      // Check if this borrower is associated with this loan
      const isBorrowerOfLoan =
        (loan.borrower && loan.borrower.equals(borrower._id)) ||
        (loan.coBorrowers &&
          loan.coBorrowers.some((coBorrower) =>
            coBorrower.equals(borrower._id)
          ));

      // Check if the loan is associated with the borrower's lender
      const isLoanFromBorrowersLender =
        loan.lender && loan.lender.equals(borrower.lender);

      if (!isBorrowerOfLoan || !isLoanFromBorrowersLender) {
        return next(
          new ApiError("You are not authorized to view this loan", 403)
        );
      }
    } else if (req.user.role === "lender") {
      // Get the lender profile
      const lender = await Lender.findOne({ user: req.user._id });

      if (!lender) {
        return next(new ApiError("Lender profile not found", 404));
      }

      // Check if this lender is associated with this loan
      const isLenderOfLoan = loan.lender && loan.lender.equals(lender._id);

      if (!isLenderOfLoan) {
        return next(
          new ApiError("You are not authorized to view this loan", 403)
        );
      }
    }

    // After permission check, get the fully populated loan
    const populatedLoan = await Loan.findById(id)
      .populate("borrower")
      .populate({
        path: "borrower",
        populate: {
          path: "user",
          select: "firstName lastName email phone",
        },
      })
      .populate("lender")
      .populate({
        path: "lender",
        populate: {
          path: "user",
          select: "firstName lastName email phone",
        },
      })
      .populate("property")
      .populate("coBorrowers")
      .populate("milestones")
      .populate("documents")
      .populate("assignedLoanOfficer", "firstName lastName email phone");

    res.status(200).json({
      status: "success",
      data: populatedLoan,
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
      // Use populate if the field exists in the document, otherwise it will be ignored
      .populate("borrower")
      .populate("coBorrowers")
      .populate("assignedLoanOfficer", "firstName lastName email phone");

    if (!loan) {
      return next(new ApiError("Loan not found", 404));
    }

    // Check permissions
    if (req.user.role === "borrower") {
      // Find the borrower profile
      const borrower = await Borrower.findOne({ user: req.user._id });

      // Check if this borrower is the primary or co-borrower on the loan
      const isPrimaryBorrower =
        loan.borrower._id.toString() === borrower._id.toString();
      const isCoBorrower = loan.coBorrowers.some(
        (coBorrower) => coBorrower._id.toString() === borrower._id.toString()
      );

      if (!isPrimaryBorrower && !isCoBorrower) {
        return next(
          new ApiError("You are not authorized to view this loan", 403)
        );
      }
    }
    // Lenders and admins can view any loan

    res.status(200).json({
      status: "success",
      data: loan,
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

    console.log("[DEBUG] Received update loan request for ID:", id);
    console.log("[DEBUG] Request body:", JSON.stringify(req.body, null, 2));

    // Verification and permission checks
    const loan = await Loan.findById(id);

    if (!loan) {
      return next(new ApiError("Loan not found", 404));
    }

    console.log("[DEBUG] Existing loan found:", loan._id);

    // Check permissions
    if (req.user.role === "borrower") {
      const borrower = await Borrower.findOne({ user: req.user._id });

      const isPrimaryBorrower =
        loan.borrower.toString() === borrower._id.toString();
      const isCoBorrower = loan.coBorrowers.some(
        (coBorrower) => coBorrower.toString() === borrower._id.toString()
      );

      if (!isPrimaryBorrower && !isCoBorrower) {
        return next(
          new ApiError("You are not authorized to update this loan", 403)
        );
      }

      // Borrowers can only update certain fields
      // const allowedFields = ['property', 'loanDetails', 'loanParameters', 'loanCalculations'];
      const updateData = req.body;

      // Update the loan
      const updatedLoan = await Loan.findByIdAndUpdate(id, updateData, {
        new: true,
        runValidators: true,
      });

      // Log the update
      logger.info(
        `Loan ${updatedLoan.loanNumber} updated by borrower ${req.user._id}`
      );

      return res.status(200).json({
        status: "success",
        message: "Loan updated successfully",
        data: updatedLoan,
      });
    }

    // Lenders and admins can update more fields
    if (req.user.role === "lender" || req.user.role === "admin") {
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

      // Extract the data from the request body
      const {
        loanParameters,
        programGuidelines,
        loanCalculations,
        ...otherData
      } = req.body;

      console.log("Loan parameters received:", loanParameters);

      // Construct the update data object
      let updateData = {
        ...otherData,
      };

      if (
        Object.keys(updateData).length === 0 &&
        (loanParameters || loanCalculations || programGuidelines)
      ) {
        console.log(
          "[DEBUG] updateData is empty but parameters exist, using existing loan data"
        );

        // Get the existing loan if not already fetched
        const existingLoan = await Loan.findById(id);
        updateData = existingLoan;

      }

      console.log("update data", updateData.loanParameters);

      // Handle loanParameters separately
      if (loanParameters) {
        console.log("Loan parameters received:", loanParameters);
        updateData.loanParameters = loanParameters;
      }

      // Handle loanCalculations separately
      if (loanCalculations) {
        updateData.loanCalculations = loanCalculations;
      }

      // Simpler approach for programGuidelines - handle it together with loanParameters
      if (programGuidelines) {
        console.log("[DEBUG] Handling program guidelines...");

        // First, get existing loan parameters and program guidelines
        // This way we can merge the new data with the existing data
        const existingLoan = await Loan.findById(id);

        // Make sure loanParameters exists in updateData
        if (!updateData.loanParameters) {
          updateData.loanParameters = existingLoan.loanParameters || {};
        }

        // CRITICAL: Directly set the programGuidelines in the loanParameters object
        updateData.loanParameters.programGuidelines = programGuidelines;

        console.log(
          "[DEBUG] Updated loanParameters with programGuidelines:",
          updateData.loanParameters
        );
      }

      // Update the loan
      const updatedLoan = await Loan.findByIdAndUpdate(id, updateData, {
        new: true,
        runValidators: true,
      });

      console.log("[DEBUG] Updated loan parameters:", updatedLoan.loanParameters);

      // Log the update
      logger.info(
        `Loan ${updatedLoan.loanNumber} updated by ${req.user.role} ${req.user._id}`
      );

      return res.status(200).json({
        status: "success",
        message: "Loan updated successfully",
        data: updatedLoan,
      });
    }

    // Fallback
    return next(
      new ApiError("You are not authorized to update this loan", 403)
    );
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
      return next(new ApiError("Loan not found", 404));
    }

    // Check permissions
    if (req.user.role === "borrower") {
      const borrower = await Borrower.findOne({ user: req.user._id });

      const isPrimaryBorrower =
        loan.borrower.toString() === borrower._id.toString();
      const isCoBorrower = loan.coBorrowers.some(
        (coBorrower) => coBorrower.toString() === borrower._id.toString()
      );

      if (!isPrimaryBorrower && !isCoBorrower) {
        return next(
          new ApiError("You are not authorized to update this loan", 403)
        );
      }

      // Borrowers can only update certain fields
      // Add all possible fields you want to allow
      const allowedFields = [
        "property",
        "loanDetails",
        "borrowerDetails",
        "assets",
        "income",
        "debts",
        "expenses",
        "propertiesOwned",
        "militaryService",
        "declarations",
        "demographics",
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
          runValidators: true,
        }
      );

      // Log the update
      logger.info(
        `Loan ${updatedLoan.loanNumber} updated by borrower ${req.user._id}`
      );

      return res.status(200).json({
        status: "success",
        message: "Loan updated successfully",
        data: updatedLoan,
      });
    }

    // Lenders and admins can update more fields
    if (req.user.role === "lender" || req.user.role === "admin") {
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
          runValidators: true,
        }
      );

      // Log the update
      logger.info(
        `Loan ${updatedLoan.loanNumber} updated by ${req.user.role} ${req.user._id}`
      );

      return res.status(200).json({
        status: "success",
        message: "Loan updated successfully",
        data: updatedLoan,
      });
    }

    // Fallback
    return next(
      new ApiError("You are not authorized to update this loan", 403)
    );
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
    const { status, processingStatus, marketingStatus, completionPercentage } =
      req.body;

    // Only lenders and admins can update loan status
    if (req.user.role !== "lender" && req.user.role !== "admin") {
      return next(
        new ApiError("You are not authorized to update loan status", 403)
      );
    }

    // Find the loan
    const loan = await Loan.findById(id);

    if (!loan) {
      return next(new ApiError("Loan not found", 404));
    }

    // Prepare update data
    const updateData = {};

    if (status) updateData.status = status;
    if (processingStatus) updateData.processingStatus = processingStatus;
    if (marketingStatus) updateData.marketingStatus = marketingStatus;
    if (completionPercentage !== undefined)
      updateData.completionPercentage = completionPercentage;

    // Auto-update milestone if status changed
    if (status && status !== loan.status) {
      // Find the corresponding milestone
      const milestoneMap = {
        "Pre-Qualification": "Application Started",
        "Application Started": "Application Started",
        "Application Submitted": "Application Started",
        Processing: "Processing",
        Underwriting: "Underwriting",
        "Conditional Approval": "Conditional Approval",
        "Clear to Close": "Clear to Close",
        Closed: "Closing",
        Funded: "Funded",
      };

      const milestoneTitle = milestoneMap[status];

      if (milestoneTitle) {
        // Update the milestone
        const milestoneIndex = loan.milestones.findIndex(
          (m) => m.title === milestoneTitle
        );

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
    const updatedLoan = await Loan.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });

    // Log the status update
    logger.info(
      `Loan ${updatedLoan.loanNumber} status updated to ${
        status || updatedLoan.status
      }`
    );

    res.status(200).json({
      status: "success",
      message: "Loan status updated successfully",
      data: updatedLoan,
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
    if (req.user.role !== "lender" && req.user.role !== "admin") {
      return next(
        new ApiError("You are not authorized to update milestones", 403)
      );
    }

    // Find the loan
    const loan = await Loan.findById(id);

    if (!loan) {
      return next(new ApiError("Loan not found", 404));
    }

    // If milestoneId provided, update existing milestone
    if (milestoneId) {
      const milestoneIndex = loan.milestones.findIndex(
        (m) => m._id.toString() === milestoneId
      );

      if (milestoneIndex === -1) {
        return next(new ApiError("Milestone not found", 404));
      }

      // Update milestone fields
      if (title) loan.milestones[milestoneIndex].title = title;
      if (description)
        loan.milestones[milestoneIndex].description = description;
      if (order) loan.milestones[milestoneIndex].order = order;

      // Handle completion status change
      if (
        isCompleted !== undefined &&
        loan.milestones[milestoneIndex].isCompleted !== isCompleted
      ) {
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
        isCompleted: isCompleted || false,
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
    logger.info(
      `Milestone ${milestoneId ? "updated" : "added"} for loan ${
        loan.loanNumber
      }`
    );

    res.status(200).json({
      status: "success",
      message: `Milestone ${milestoneId ? "updated" : "added"} successfully`,
      data: loan.milestones,
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
    const { title, description, category, status, dueDate, assignedTo } =
      req.body;

    // Only lenders and admins can add conditions
    if (req.user.role !== "lender" && req.user.role !== "admin") {
      return next(
        new ApiError("You are not authorized to add conditions", 403)
      );
    }

    // Find the loan
    const loan = await Loan.findById(id);

    if (!loan) {
      return next(new ApiError("Loan not found", 404));
    }

    // Create new condition
    const newCondition = {
      title,
      description,
      category,
      status: status || "Pending",
      assignedTo,
      dueDate: dueDate ? new Date(dueDate) : undefined,
    };

    // Add to conditions array
    loan.conditions.push(newCondition);

    // Save the loan
    await loan.save();

    // Log the condition addition
    logger.info(`Condition "${title}" added to loan ${loan.loanNumber}`);

    res.status(201).json({
      status: "success",
      message: "Condition added successfully",
      data: newCondition,
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
    const { title, description, category, status, dueDate, assignedTo } =
      req.body;

    // Only lenders and admins can update conditions
    if (req.user.role !== "lender" && req.user.role !== "admin") {
      return next(
        new ApiError("You are not authorized to update conditions", 403)
      );
    }

    const loan = await Loan.findById(loanId);
    if (!loan) {
      return next(new ApiError("Loan not found", 404));
    }

    // Find the condition by ID
    const conditionIndex = loan.conditions.findIndex(
      (c) => c._id.toString() === conditionId
    );
    if (conditionIndex === -1) {
      return next(new ApiError("Condition not found", 404));
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

      if (status === "Completed" || status === "Approved") {
        loan.conditions[conditionIndex].completedDate = new Date();
      }
    }

    // Save the loan with updated condition
    await loan.save();

    // Log the update
    logger.info(
      `Condition "${loan.conditions[conditionIndex].title}" updated for loan ${loan.loanNumber}`
    );

    return res.status(200).json({
      status: "success",
      message: "Condition updated successfully",
      data: loan.conditions[conditionIndex],
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
      return next(new ApiError("Loan not found", 404));
    }

    // For borrowers, verify they're associated with the loan
    if (req.user.role === "borrower") {
      const borrower = await Borrower.findOne({ user: req.user._id });

      if (!borrower) {
        return next(new ApiError("Borrower profile not found", 404));
      }

      const isPrimaryBorrower =
        loan.borrower.toString() === borrower._id.toString();
      const isCoBorrower = loan.coBorrowers.some(
        (coBorrower) => coBorrower.toString() === borrower._id.toString()
      );

      if (!isPrimaryBorrower && !isCoBorrower) {
        return next(
          new ApiError("You are not authorized to modify this loan", 403)
        );
      }
    }

    // Find the condition by ID
    const conditionIndex = loan.conditions.findIndex(
      (c) => c._id.toString() === conditionId
    );
    if (conditionIndex === -1) {
      return next(new ApiError("Condition not found", 404));
    }

    // Store condition info for logging
    const conditionTitle = loan.conditions[conditionIndex].title;

    // Remove the condition from the array
    loan.conditions.splice(conditionIndex, 1);

    // Save the loan with the condition removed
    await loan.save();

    // Log the removal
    logger.info(
      `Condition "${conditionTitle}" removed from loan ${loan.loanNumber} by ${req.user.role}`
    );

    return res.status(200).json({
      status: "success",
      message: "Condition removed successfully",
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
      return next(new ApiError("Note content is required", 400));
    }

    // Find the loan
    const loan = await Loan.findById(id);

    if (!loan) {
      return next(new ApiError("Loan not found", 404));
    }

    // Check permissions for borrowers
    if (req.user.role === "borrower") {
      const borrower = await Borrower.findOne({ user: req.user._id });

      const isPrimaryBorrower =
        loan.borrower.toString() === borrower._id.toString();
      const isCoBorrower = loan.coBorrowers.some(
        (coBorrower) => coBorrower.toString() === borrower._id.toString()
      );

      if (!isPrimaryBorrower && !isCoBorrower) {
        return next(
          new ApiError("You are not authorized to add notes to this loan", 403)
        );
      }
    }

    // Create new note
    const newNote = {
      content,
      createdBy: req.user._id,
      createdAt: new Date(),
    };

    // Add to notes array
    loan.notes.push(newNote);

    // Save the loan
    await loan.save();

    // Log the note addition
    logger.info(
      `Note added to loan ${loan.loanNumber} by ${req.user.role} ${req.user._id}`
    );

    res.status(201).json({
      status: "success",
      message: "Note added successfully",
      data: newNote,
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
    if (req.user.role !== "borrower") {
      return next(new ApiError("Only borrowers can save loan drafts", 403));
    }

    // Get borrower profile
    const borrower = await Borrower.findOne({ user: req.user._id });

    if (!borrower) {
      return next(new ApiError("Borrower profile not found", 404));
    }

    const draftData = req.body;

    // For debugging purposes, log the incoming data
    logger.info(`Saving loan draft for borrower: ${borrower._id}`);

    // Check if the draft already exists (if ID is provided)
    if (draftData._id) {
      const existingDraft = await Loan.findById(draftData._id);

      if (existingDraft) {
        // Verify ownership
        if (existingDraft.borrower.toString() !== borrower._id.toString()) {
          return next(
            new ApiError("You are not authorized to update this draft", 403)
          );
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

        logger.info(
          `Loan draft updated: ${result._id} by borrower ${borrower._id}`
        );

        return res.status(200).json({
          status: "success",
          message: "Loan draft updated successfully",
          data: result,
        });
      }
    }

    // Generate a temporary loan number for the draft using the new format plus DRAFT prefix
    const date = new Date();
    const year = date.getFullYear().toString();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const randomSuffix = Math.floor(Math.random() * 1000)
      .toString()
      .padStart(3, "0");
    const tempLoanNumber = `DRAFT-${year}${month}${day}${randomSuffix}`;

    // Create minimal data to satisfy required fields but with isDraft flag
    // We're using insertMany to bypass mongoose validation
    const draftDocument = {
      borrower: borrower._id,
      loanNumber: tempLoanNumber, // Temporary number for draft
      status: "draft",
      processingStatus: "Draft",
      completionPercentage: draftData.completionPercentage || 0,
      isDraft: true,
      // Add minimal required fields with default placeholders
      property: draftData.property || {
        addressLine1: "Draft Address",
        city: "Draft City",
        state: "Draft State",
        zipCode: "Draft Zip",
        propertyType: "Single Family Residence",
        occupancyType: "Primary Residence",
        propertyValue: 0,
      },
      loanDetails: draftData.loanDetails || {
        loanType: "Purchase",
        loanAmount: 0,
      },
      // Add any other data provided
      ...draftData,
    };

    // Insert directly into MongoDB to bypass schema validation
    const result = await mongoose.connection
      .collection("loans")
      .insertOne(draftDocument);
    const newDraft = await Loan.findById(result.insertedId);

    logger.info(
      `New loan draft created: ${newDraft._id} by borrower ${borrower._id}`
    );

    res.status(201).json({
      status: "success",
      message: "Loan draft created successfully",
      data: newDraft,
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
    if (req.user.role !== "borrower") {
      return next(new ApiError("Only borrowers can access loan drafts", 403));
    }

    // Get borrower profile
    const borrower = await Borrower.findOne({ user: req.user._id });

    if (!borrower) {
      return next(new ApiError("Borrower profile not found", 404));
    }

    // Get recent drafts
    const recentDrafts = await Loan.find({
      primaryBorrower: borrower._id,
      status: "draft",
      isDraft: true,
    })
      .sort({ updatedAt: -1 })
      .limit(5);

    res.status(200).json({
      status: "success",
      data: recentDrafts,
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
     console.log(`Retrieving draft with ID or loan number: ${id}`);
    
    // Verify user is a borrower
    if (req.user.role !== "borrower") {
      return next(new ApiError("Only borrowers can access loan drafts", 403));
    }

    // Get borrower profile
    const borrower = await Borrower.findOne({ user: req.user._id });

    if (!borrower) {
      return next(new ApiError("Borrower profile not found", 404));
    }

    // Try to find a loan by loan number (either draft or completed)
    // This allows existing loans to be edited
    let draft = await Loan.findOne({
      loanNumber: id,
      $or: [
        { borrower: borrower._id }, // New schema field
        { primaryBorrower: borrower._id }, // Old schema field
      ]
    });
    
    // If not found and it might be a valid ObjectId, try finding a draft by _id
    if (!draft && id.match(/^[0-9a-fA-F]{24}$/)) {
      draft = await Loan.findOne({
        _id: id,
        $or: [
          { borrower: borrower._id }, // New schema field
          { primaryBorrower: borrower._id }, // Old schema field
        ],
        status: "draft",
        isDraft: true,
      });
    }

    console.log(`Search result: ${draft ? 'Found' : 'Not found'}, status: ${draft?.status}, isDraft: ${draft?.isDraft}`);
    
    if (!draft) {
      return next(new ApiError("Loan not found", 404));
    }

    // If we found a completed loan, we'll still return it as if it were a draft
    // so the frontend can populate the edit form
    res.status(200).json({
      status: "success",
      data: draft,
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
    const loan = await Loan.findById(id).populate("primaryBorrower");

    if (!loan) {
      return next(new ApiError("Loan not found", 404));
    }

    // Check permissions
    if (req.user.role === "borrower") {
      const borrower = await Borrower.findOne({ user: req.user._id });

      const isPrimaryBorrower =
        loan.borrower._id.toString() === borrower._id.toString();
      const isCoBorrower = loan.coBorrowers.some(
        (coBorrower) => coBorrower.toString() === borrower._id.toString()
      );

      if (!isPrimaryBorrower && !isCoBorrower) {
        return next(
          new ApiError("You are not authorized to access this loan", 403)
        );
      }
    }

    // Calculate LTV
    const ltv =
      (loan.loanDetails.loanAmount / loan.property.propertyValue) * 100;

    // Calculate monthly payment (simplified calculation)
    const principal = loan.loanDetails.loanAmount;
    const interestRate = loan.loanDetails.interestRate / 100 / 12; // Monthly interest rate
    const termMonths = loan.loanDetails.loanTerm * 12;

    // Calculate monthly payment using the mortgage formula
    const monthlyPayment =
      (principal * interestRate * Math.pow(1 + interestRate, termMonths)) /
      (Math.pow(1 + interestRate, termMonths) - 1);

    // Calculate debt-to-income ratio
    let dti = 0;
    let housingRatio = 0;

    if (loan.borrower.financialInfo) {
      const monthlyIncome = loan.borrower.financialInfo.monthlyIncome || 0;
      if (monthlyIncome > 0) {
        housingRatio = (monthlyPayment / monthlyIncome) * 100;

        // Total debts including housing
        const totalDebts =
          (loan.borrower.financialInfo.totalDebts || 0) + monthlyPayment;
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
      totalMonthlyPayment: parseFloat(monthlyPayment.toFixed(2)),
    };

    // Save calculations to loan
    loan.financialCalculations = financialCalculations;
    loan.loanDetails.monthlyPayment = financialCalculations.monthlyPayment;

    await loan.save();

    res.status(200).json({
      status: "success",
      message: "Loan metrics calculated successfully",
      data: financialCalculations,
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
      {
        id: "conventional",
        name: "Conventional",
        description: "Traditional mortgage loan",
      },
      {
        id: "fha",
        name: "FHA",
        description: "Federal Housing Administration loan",
      },
      { id: "va", name: "VA", description: "Veterans Affairs loan" },
      { id: "usda", name: "USDA", description: "USDA Rural Development loan" },
      {
        id: "jumbo",
        name: "Jumbo",
        description: "Loan exceeding conforming loan limits",
      },
    ];

    res.status(200).json({
      status: "success",
      data: loanTypes,
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
      return next(new ApiError("Loan not found", 404));
    }

    // Check permissions
    if (req.user.role === "borrower") {
      const borrower = await Borrower.findOne({ user: req.user._id });

      if (!borrower) {
        return next(new ApiError("Borrower profile not found", 404));
      }

      const isPrimaryBorrower =
        loan.borrower.toString() === borrower._id.toString();
      const isCoBorrower =
        loan.coBorrowers &&
        loan.coBorrowers.some(
          (coBorrower) => coBorrower.toString() === borrower._id.toString()
        );

      if (!isPrimaryBorrower && !isCoBorrower) {
        return next(
          new ApiError("You are not authorized to modify this loan", 403)
        );
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
    logger.info(
      `Loan parameters updated for loan ${loan.loanNumber} by ${req.user.role} ${req.user._id}`
    );

    res.status(200).json({
      status: "success",
      message: "Loan parameters updated successfully",
      data: {
        loanParameters: loan.loanParameters,
        loanCalculations: loan.loanCalculations,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create a new loan application with JSON data only (no files)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.createLoanData = async (req, res, next) => {
  try {
    console.log("Received loan data submission");
    
    // Get user and borrower profile
    let borrower, lenderId, borrowerId;

    if (req.user.role === "borrower") {
      // For borrower users, use their own profile
      borrower = await Borrower.findOne({ user: req.user._id }).populate(
        "lender"
      );

      if (!borrower) {
        return next(new ApiError("Borrower profile not found", 404));
      }

      // Get the lender associated with this borrower
      if (!borrower.lender) {
        return next(
          new ApiError("No lender associated with this borrower", 400)
        );
      }

      lenderId = borrower.lender._id;
      borrowerId = borrower._id;
    } else if (req.user.role === "lender") {
      // For lender users creating a loan
      const lender = await Lender.findOne({ user: req.user._id });

      if (!lender) {
        return next(new ApiError("Lender profile not found", 404));
      }

      // A borrower ID must be provided
      if (!req.body.borrower) {
        return next(new ApiError("Borrower ID is required", 400));
      }

      borrowerId = req.body.borrower;

      // Verify that the borrower exists and belongs to this lender
      borrower = await Borrower.findById(borrowerId);
      if (!borrower) {
        return next(new ApiError("Borrower not found", 404));
      }

      // Check if this borrower belongs to the lender
      if (!borrower.lender.equals(lender._id)) {
        return next(
          new ApiError(
            "You are not authorized to create loans for this borrower",
            403
          )
        );
      }

      lenderId = lender._id;
    } else {
      // For admin users, both borrower and lender IDs must be provided
      if (!req.body.borrower || !req.body.lender) {
        return next(
          new ApiError("Both borrower and lender IDs are required", 400)
        );
      }

      borrowerId = req.body.borrower;
      lenderId = req.body.lender;

      // Verify that both borrower and lender exist
      borrower = await Borrower.findById(borrowerId);
      if (!borrower) {
        return next(new ApiError("Borrower not found", 404));
      }

      const lender = await Lender.findById(lenderId);
      if (!lender) {
        return next(new ApiError("Lender not found", 404));
      }
    }

    // Extract data directly from the request body
    // The data is already parsed as JSON by Express
    const primaryBorrower = req.body.borrowerDetails || (req.body.borrowers && req.body.borrowers[0]) || {};
    const property = req.body.property || req.body.propertyInfo || {};
    const loanDetails = req.body.loanDetails || req.body.loanInfo || {};
    const assets = req.body.assets || {};
    const income = req.body.income || {};
    const debts = req.body.debts || [];
    const expenses = req.body.expenses || [];
    const propertiesOwned = req.body.propertiesOwned || {};
    const militaryService = req.body.militaryService || {};
    const declarations = req.body.declarations || {};
    const demographics = req.body.demographics || {};
    const coBorrowers = req.body.coBorrowers || [];

    console.log("Processing loan data with borrower:", borrowerId);
    console.log("Property data:", property);

    // Prepare property data
    const propertyData = {
      zipCode: property?.zipCode || property?.address?.zipCode || "00000",
      propertyType: property?.propertyType || "Single Family Home",
      occupancyType: property?.occupancyType || "Primary Residence",
      numberOfUnits: property?.numberOfUnits || 1,
      yearBuilt: property?.yearBuilt || new Date().getFullYear(),
      propertyValue: parseFloat(property?.propertyValue) || 100000,
      isNewConstruction: property?.isNewConstruction || false,
      // Add fields for property with accepted offer
      hasAcceptedOffer: property?.hasAcceptedOffer || false,
      contractPurchasePrice: parseFloat(property?.contractPurchasePrice) || 0,
      isMixedUse: property?.isMixedUse || "No",
      isManufactured: property?.isManufactured || "No",
      proposedRentalIncome: parseFloat(property?.proposedRentalIncome) || 0,
    };

    // Prepare loan details data
    const cleanLoanAmount = parseFloat(loanDetails?.loanAmount) || 50000;

    // Base loan details that apply to all loan types
    const loanDetailsData = {
      loanType: loanDetails?.loanType || "Purchase",
      loanAmount: cleanLoanAmount,
      downPayment: parseFloat(loanDetails?.downPayment) || 0,
      downPaymentPercentage:
        parseFloat(loanDetails?.downPaymentPercentage) || 20,
      interestRate: parseFloat(loanDetails?.interestRate) || 4.5,
      loanTerm: parseInt(loanDetails?.loanTerm) || 30,
      isFixedRate: loanDetails?.isFixedRate !== false, // Default to true
      includeEscrow: loanDetails?.includeEscrow !== false, // Default to true
      includeMortgageInsurance: loanDetails?.includeMortgageInsurance !== false, // Default to true
    };

    // Add fields specific to the loan type
    if (loanDetails?.loanType === "Purchase") {
      loanDetailsData.purchasePrice =
        parseFloat(loanDetails?.purchasePrice) || 0;
    } else if (loanDetails?.loanType === "Refinance") {
      loanDetailsData.yearAcquired = parseInt(loanDetails?.yearAcquired) || 0;
      loanDetailsData.currentLoanBalance =
        parseFloat(loanDetails?.currentLoanBalance) || 0;
      loanDetailsData.requestedLoanAmount =
        parseFloat(loanDetails?.requestedLoanAmount) || 0;
      loanDetailsData.refinanceType = loanDetails?.refinanceType || "Refinance";
    } else if (loanDetails?.loanType === "Construction") {
      loanDetailsData.yearLotAcquired =
        parseInt(loanDetails?.yearLotAcquired) || 0;
      loanDetailsData.originalCost = parseFloat(loanDetails?.originalCost) || 0;
      loanDetailsData.existingLoans =
        parseFloat(loanDetails?.existingLoans) || 0;
      loanDetailsData.presentValueOfLot =
        parseFloat(loanDetails?.presentValueOfLot) || 0;
      loanDetailsData.costOfImprovements =
        parseFloat(loanDetails?.costOfImprovements) || 0;
      loanDetailsData.constructionType =
        loanDetails?.constructionType || "Construction";
    }

    // Get borrower details from the borrowers array or directly from borrowerDetails
    let borrowerDetailsData;
    if (req.body.borrowers && req.body.borrowers[0]) {
      const borrowerData = req.body.borrowers[0];
      borrowerDetailsData = {
        firstName: borrowerData?.firstName || "",
        middleName: borrowerData?.middleName || "",
        lastName: borrowerData?.lastName || "",
        suffix: borrowerData?.suffix || "",
        maritalStatus: borrowerData?.maritalStatus || "",
        dateOfBirth: borrowerData?.dateOfBirth || null,
        ssn: borrowerData?.ssn || "",
        citizenship: borrowerData?.citizenship || "",
        phone: borrowerData?.phone || "",
        email: borrowerData?.email || "",
        dependents: Array.isArray(borrowerData?.dependents) ? borrowerData.dependents : [],
        currentAddress: borrowerData?.currentAddress || {},
        mailingAddress: borrowerData?.mailingAddress || {},
        previousAddresses: Array.isArray(borrowerData?.previousAddresses) ? borrowerData.previousAddresses : [],
        employers: Array.isArray(borrowerData?.employers) ? borrowerData.employers : [],
      };
    } else {
      // Use the borrowerDetails directly if available
      borrowerDetailsData = {
        firstName: primaryBorrower?.firstName || "",
        middleName: primaryBorrower?.middleName || "",
        lastName: primaryBorrower?.lastName || "",
        suffix: primaryBorrower?.suffix || "",
        maritalStatus: primaryBorrower?.maritalStatus || "",
        dateOfBirth: primaryBorrower?.dateOfBirth || null,
        ssn: primaryBorrower?.ssn || "",
        citizenship: primaryBorrower?.citizenship || "",
        phone: primaryBorrower?.phone || "",
        email: primaryBorrower?.email || "",
        dependents: Array.isArray(primaryBorrower?.dependents) ? primaryBorrower.dependents : [],
        currentAddress: primaryBorrower?.currentAddress || {},
        mailingAddress: primaryBorrower?.mailingAddress || {},
        previousAddresses: Array.isArray(primaryBorrower?.previousAddresses) ? primaryBorrower.previousAddresses : [],
        employers: Array.isArray(primaryBorrower?.employers) ? primaryBorrower.employers : [],
      };
    }

    // Create a new loan application
    const newLoan = new Loan({
      borrower: borrowerId,
      lender: lenderId,
      status: "Application Submitted",
      purpose: req.body.purpose || "Home Purchase",
      borrowerDetails: borrowerDetailsData,
      property: propertyData,
      loanDetails: loanDetailsData,
      assets: assets || {},
      income: income || {},
      debts: debts || [],
      expenses: expenses || [],
      propertiesOwned: propertiesOwned || {},
      militaryService: militaryService || {},
      declarations: declarations || {},
      demographics: demographics || {},
      coBorrowers: coBorrowers || [],
      documents: [], // No documents in this step
    });

    // Save the loan application (loan number will be auto-generated by the pre-save hook)
    await newLoan.save();
    
    // Create default milestones for the new loan
    try {
      await createDefaultMilestonesForLoan(newLoan._id);
      console.log(`Default milestones created for loan ${newLoan._id}`);
    } catch (milestoneError) {
      console.error('Error creating default milestones:', milestoneError);
      // Don't fail the whole request if milestone creation fails
    }

    // Return success response with loan details
    res.status(201).json({
      status: "success",
      message: "Loan application submitted successfully",
      data: {
        _id: newLoan._id,
        loanNumber: newLoan.loanNumber,
        status: newLoan.status,
        purpose: newLoan.purpose,
        borrower: newLoan.borrower,
        lender: newLoan.lender,
        createdAt: newLoan.createdAt,
      },
    });
  } catch (error) {
    console.error("Error creating loan:", error);
    next(error);
  }
};

/**
 * Add documents to an existing loan
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.addDocumentsToLoan = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Find the loan
    const loan = await Loan.findById(id);
    
    if (!loan) {
      return next(new ApiError("Loan not found", 404));
    }
    
    // Check permissions for borrowers
    if (req.user.role === "borrower") {
      const borrower = await Borrower.findOne({ user: req.user._id });
      
      if (!borrower) {
        return next(new ApiError("Borrower profile not found", 404));
      }
      
      const isPrimaryBorrower = loan.borrower.toString() === borrower._id.toString();
      const isCoBorrower = loan.coBorrowers.some(
        (coBorrower) => coBorrower.toString() === borrower._id.toString()
      );
      
      if (!isPrimaryBorrower && !isCoBorrower) {
        return next(new ApiError("You are not authorized to modify this loan", 403));
      }
    }
    
    // Process uploaded files
    const uploadedFiles = req.files || [];
    const documents = [];
    
    for (const file of uploadedFiles) {
      // Create document record
      documents.push({
        fileName: file.originalname,
        fileType: file.mimetype,
        fileSize: file.size,
        url: file.path,
        uploadedBy: req.user._id,
        uploadedAt: new Date(),
        documentType: "Other", // Default type
      });
    }
    
    // Add documents to the loan
    if (documents.length > 0) {
      loan.documents = [...loan.documents, ...documents];
      await loan.save();
    }
    
    res.status(200).json({
      status: "success",
      message: "Documents added to loan successfully",
      data: {
        documentsAdded: documents.length,
        totalDocuments: loan.documents.length,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Import loan from XML file
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.importFromXML = async (req, res, next) => {
  const USE_S3 = process.env.USE_S3 === 'true';
  let s3FileKey; // To store S3 key for cleanup

  try {
    if (!req.file) {
      return next(new ApiError("No XML file uploaded", 400));
    }

    s3FileKey = req.file.key; // Store for potential cleanup

    const lender = await Lender.findOne({ user: req.user._id });
    if (!lender) {
      return next(new ApiError("Lender profile not found", 404));
    }
    
    let xmlString;
    if (USE_S3) {
        const { S3Client, GetObjectCommand } = require("@aws-sdk/client-s3");
        const s3 = new S3Client({ region: process.env.AWS_REGION });
        const command = new GetObjectCommand({
            Bucket: process.env.AWS_S3_BUCKET_NAME,
            Key: req.file.key,
        });
        const { Body } = await s3.send(command);
        xmlString = await Body.transformToString('utf8');
    } else {
        xmlString = fs.readFileSync(req.file.path, 'utf8');
    }
    
    const parser = new xml2js.Parser({ 
      explicitArray: false,
    ignoreAttrs: false,
      mergeAttrs: true,
    normalizeTags: true,
    charkey: 'value',
    attrkey: 'attr',
    xmlns: true,
    explicitRoot: false
});
    const parsedXML = await parser.parseStringPromise(xmlString);
    
    const extractedData = extractLoanDataFromXML(parsedXML);
    
    let borrower;
    const { email, firstName, lastName } = extractedData.borrowerDetails;

    // If borrowerId is provided, use that borrower
    if (req.body.borrowerId) {
      borrower = await Borrower.findById(req.body.borrowerId);
    if (!borrower) {
            return next(new ApiError('Selected borrower not found', 404));
        }
        if (borrower.lender.toString() !== lender._id.toString()) {
            return next(new ApiError('Selected borrower does not belong to this lender', 403));
        }
    } 
    // If createNewBorrower is explicitly set to false, require borrowerId
    else if (req.body.createNewBorrower === 'false' && !req.body.borrowerId) {
      return next(new ApiError('Borrower ID is required when createNewBorrower is false', 400));
    }
    // If email exists, check for existing borrower
    else if (email) {
      // Check for existing borrower with this email
      borrower = await Borrower.findOne({ 
        $or: [
          { email: email.toLowerCase() },
          { 'user.email': email.toLowerCase() }
        ],
        lender: lender._id 
      }).populate('user');

      // If borrower exists and createNewBorrower is not explicitly true, return error
      if (borrower && req.body.createNewBorrower !== 'true') {
        return next(new ApiError('A borrower with this email already exists. Please select an existing borrower.', 409));
      }
    }

    // Create new borrower if needed
        if (!borrower) {
      // Create user first
            let user = await User.findOne({ email: email.toLowerCase() });
            if (!user) {
                user = new User({
                    email: email.toLowerCase() || `imported_${Date.now()}@example.com`,
                    firstName,
                    lastName,
        role: 'borrower',
                    password: `defaultPassword${new Date().getTime()}`
                });
                await user.save();
            }
            
      borrower = new Borrower({
                user: user._id,
                lender: lender._id,
                firstName,
                lastName,
                email: email.toLowerCase(),
            });
      await borrower.save();
    }

    const loanData = {
      ...extractedData,
      borrower: borrower._id,
      lender: lender._id,
      status: 'Application Started',
      lastUpdated: new Date()
    };

    const newLoan = await Loan.create(loanData);
      await createDefaultMilestonesForLoan(newLoan._id);
    
    borrower.loans.push(newLoan._id);
    await borrower.save();
    
    if (!USE_S3) {
    fs.unlinkSync(req.file.path);
    }

    res.status(201).json({
      status: 'success',
      data: newLoan
    });

  } catch (error) {
    // Cleanup S3 file if exists
    if (USE_S3 && s3FileKey) {
      try {
        const { S3Client, DeleteObjectCommand } = require("@aws-sdk/client-s3");
        const s3 = new S3Client({ region: process.env.AWS_REGION });
        await s3.send(new DeleteObjectCommand({
          Bucket: process.env.AWS_S3_BUCKET_NAME,
          Key: s3FileKey
        }));
      } catch (s3Error) {
        console.error('Failed to cleanup S3 file:', s3Error);
      }
    }
    next(error);
  }
};

/**
 * Extract loan data from parsed XML
 * @param {Object} parsedXML - Parsed XML object
 * @returns {Object} Extracted loan data
 */
function extractLoanDataFromXML(parsedXML) {
  const message = parsedXML.message || parsedXML;
  const deal = message?.deal_sets?.deal_set?.deals?.deal;

  if (!deal) {
      throw new ApiError('Invalid MISMO XML format: DEAL not found', 400);
  }

    const getValue = (obj, path, defaultValue = '') => {
      if (!obj) return defaultValue;
      const keys = path.toLowerCase().split('.');
      let current = obj;
      for (let i = 0; i < keys.length; i++) {
          if (current[keys[i]] === undefined || current[keys[i]] === null) {
              // Try with namespace prefix
              const nsKey = Object.keys(current).find(k => k.toLowerCase().endsWith(keys[i]));
              if (!nsKey || current[nsKey] === undefined || current[nsKey] === null) {
                  return defaultValue;
              }
              current = current[nsKey];
          } else {
              current = current[keys[i]];
          }
      }
      return current.value || current || defaultValue;
  };
  
    const getNumber = (obj, path, defaultValue = 0) => {
      if (!obj) return defaultValue;
      const value = getValue(obj, path, defaultValue);
      const num = parseFloat(value);
      return isNaN(num) ? defaultValue : num;
    };

  const getBoolean = (obj, path, defaultValue = false) => {
      const value = getValue(obj, path, defaultValue);
      return String(value).toLowerCase() === 'true';
  };

  const getArray = (obj, path) => {
      const value = getValue(obj, path, []);
      return Array.isArray(value) ? value : [value];
  }
  
  const mapOccupancyType = (xmlOccupancyType) => {
      const mapping = {
          'PrimaryResidence': 'Primary Residence',
          'SecondHome': 'Vacation Home',
          'Investor': 'Investment'
      };
      return mapping[xmlOccupancyType] || 'Other';
  }
  
  const party = getArray(deal.parties, 'party').find(p => getValue(p, 'roles.role.role_detail.partyroletype') === 'Borrower');
  const borrowerRole = party.roles.role;

  const contactPoints = getArray(party, 'individual.contact_points.contact_point');
  const emailContact = contactPoints.find(c => getValue(c, 'contact_point_email'));
  const phoneContact = contactPoints.find(c => getValue(c, 'contact_point_telephone'));

  const borrowerDetails = {
    firstName: getValue(party, 'individual.name.firstname'),
    lastName: getValue(party, 'individual.name.lastname'),
    middleName: getValue(party, 'individual.name.middlename'),
    suffix: getValue(party, 'individual.name.namesuffix'),
    email: getValue(emailContact, 'contact_point_email.contactpointemailvalue'),
    phone: getValue(phoneContact, 'contact_point_telephone.contactpointtelephonevalue'),
    ssn: getValue(party, 'taxpayer_identifiers.taxpayer_identifier.taxpayeridentifiervalue'),
    dateOfBirth: getValue(borrowerRole, 'borrower.borrower_detail.borrowerbirthdate'),
    maritalStatus: mapMaritalStatus(getValue(borrowerRole, 'borrower.borrower_detail.maritalstatustype')),
    citizenship: mapCitizenship(getValue(borrowerRole, 'borrower.declaration.declaration_detail.citizenshipresidencytype')),
    dependents: getArray(borrowerRole, 'borrower.dependents.dependent').map(dep => ({
        name: getValue(dep, 'fullname'),
        age: getNumber(dep, 'dependentageduration'),
        relationship: getValue(dep, 'relationshiptype')
    })),
    employers: getArray(borrowerRole, 'borrower.employers.employer').map(emp => ({
      companyName: getValue(emp, 'legal_entity.legal_entity_detail.fullname'),
      jobTitle: getValue(emp, 'employment.employmentpositiondescription'),
      startDate: getValue(emp, 'employment.employmentstartdate'),
      endDate: getValue(emp, 'employment.employmentenddate'),
      monthlyIncome: getNumber(emp, 'employment.employmentmonthlyincomeamount'),
      employmentStatus: mapEmploymentStatus(getValue(emp, 'employment.employmentstatustype')),
      isSelfEmployed: getBoolean(emp, 'employment.employmentborrowerselfemployedindicator') ? 'Yes' : 'No',
      yearsInProfession: getNumber(emp, 'employment.yearsinprofession'),
      monthsInProfession: getNumber(emp, 'employment.monthsinprofession'),
      streetAddress: getValue(emp, 'address.addresslinetext'),
      aptSteNum: getValue(emp, 'address.addressunitidentifier'),
      city: getValue(emp, 'address.cityname'),
      state: getValue(emp, 'address.statecode'),
      zipCode: getValue(emp, 'address.postalcode'),
  })),
    currentAddress: getArray(borrowerRole, 'borrower.residences.residence').filter(r => getValue(r, 'residence_detail.borrowerresidencytype') === 'Current').map(addr => ({
        streetAddress: getValue(addr, 'address.addresslinetext'),
        aptSteNum: getValue(addr, 'address.addressunitidentifier'),
        city: getValue(addr, 'address.cityname'),
        state: getValue(addr, 'address.statecode'),
        zipCode: getValue(addr, 'address.postalcode'),
        housingStatus: mapResidencyBasis(getValue(addr, 'residence_detail.borrowerresidencybasistype')),
        yearsAtAddress: Math.floor(getNumber(addr, 'residence_detail.borrowerresidencydurationmonthscount') / 12),
        monthsAtAddress: getNumber(addr, 'residence_detail.borrowerresidencydurationmonthscount') % 12,
    }))[0],
    previousAddresses: getArray(borrowerRole, 'borrower.residences.residence').filter(r => getValue(r, 'residence_detail.borrowerresidencytype') === 'Former').map(addr => ({
        streetAddress: getValue(addr, 'address.addresslinetext'),
        aptSteNum: getValue(addr, 'address.addressunitidentifier'),
        city: getValue(addr, 'address.cityname'),
        state: getValue(addr, 'address.statecode'),
        zipCode: getValue(addr, 'address.postalcode'),
        housingStatus: mapResidencyBasis(getValue(addr, 'residence_detail.borrowerresidencybasistype')),
        yearsAtAddress: Math.floor(getNumber(addr, 'residence_detail.borrowerresidencydurationmonthscount') / 12),
        monthsAtAddress: getNumber(addr, 'residence_detail.borrowerresidencydurationmonthscount') % 12,
    })),
};

    
    const loanDetails = {
      loanAmount: getNumber(deal, 'loans.loan.terms_of_loan.baseloanamount'),
      loanType: getValue(deal, 'loans.loan.terms_of_loan.loanpurposetype'),
  };
    
    const property = {
      addressLine1: getValue(deal, 'collaterals.collateral.subject_property.address.addresslinetext'),
      city: getValue(deal, 'collaterals.collateral.subject_property.address.cityname'),
      state: getValue(deal, 'collaterals.collateral.subject_property.address.statecode'),
      zipCode: getValue(deal, 'collaterals.collateral.subject_property.address.postalcode'),
      propertyValue: getNumber(deal, 'collaterals.collateral.subject_property.property_detail.propertyestimatedvalueamount'),
      contractPurchasePrice: getNumber(deal, 'collaterals.collateral.subject_property.sales_contracts.sales_contract.sales_contract_detail.salescontractamount'),
      occupancyType: mapOccupancyType(getValue(deal, 'collaterals.collateral.subject_property.property_detail.propertyusagetype')),
  };

  const assets = {
    checkingAndSavings: getArray(deal.assets, 'asset')
    .filter(a => ['CheckingAccount', 'SavingsAccount'].includes(getValue(a, 'asset_detail.assettype')))
    .map(a => ({
        bankName: getValue(a, 'asset_holder.name.fullname'),
        value: getNumber(a, 'asset_detail.assetcashormarketvalueamount'),
        accountType: getValue(a, 'asset_detail.assettype').replace('Account', ''),
        isVerified: true,
        isLiquid: true
    })),
stocksAndBonds: getArray(deal.assets, 'asset')
    .filter(a => ['Stock', 'Bond'].includes(getValue(a, 'asset_detail.assettype')))
    .map(a => ({
        description: getValue(a, 'asset_detail.assettype'),
        value: getNumber(a, 'asset_detail.assetcashormarketvalueamount'),
        isVerified: true,
        isLiquid: true
    })),
giftsAndGrants: getArray(deal.assets, 'asset')
    .filter(a => getValue(a, 'asset_detail.assettype') === 'GiftOfCash')
    .map(a => ({
        source: getValue(a, 'asset_detail.fundssourcetype'),
        value: getNumber(a, 'asset_detail.assetcashormarketvalueamount'),
        isVerified: true,
        isLiquid: true,
        isDeposited: true
    })),
      miscellaneous: {
          earnestMoney: getNumber(getArray(deal.assets, 'asset').find(a => getValue(a, 'asset_detail.assettypeotherdescription') === 'EarnestMoney'), 'asset_detail.assetcashormarketvalueamount'),
          lifeInsurance: getNumber(getArray(deal.assets, 'asset').find(a => getValue(a, 'asset_detail.assettype') === 'LifeInsurance'), 'asset_detail.assetcashormarketvalueamount'),
          vestedInterestInRetirement: getNumber(getArray(deal.assets, 'asset').find(a => getValue(a, 'asset_detail.assettype') === 'RetirementFund'), 'asset_detail.assetcashormarketvalueamount'),
          otherAssets: getNumber(getArray(deal.assets, 'asset').find(a => getValue(a, 'asset_detail.assettypeotherdescription') === 'OtherLiquidAsset'), 'asset_detail.assetcashormarketvalueamount')
      }
  };
  
  const debts = getArray(deal.liabilities, 'liability').map(l => ({
      id: new mongoose.Types.ObjectId().toString(),
      creditorName: getValue(l, 'liability_holder.name.fullname'),
      monthlyPayment: getNumber(l, 'liability_detail.liabilitymonthlypaymentamount'),
      balance: getNumber(l, 'liability_detail.liabilityunpaidbalanceamount'),
      paidAtClosing: getBoolean(l, 'liability_detail.liabilitypayoffstatusindicator'),
      debtType: getValue(l, 'liability_detail.liabilitytypeotherdescription') || getValue(l, 'liability_detail.liabilitytype'),
  }));
  
  const declarations = {
      declaredBankruptcy: getBoolean(borrowerRole, 'borrower.declaration.declaration_detail.bankruptcyindicator'),
      hadOwnershipInterest: getValue(borrowerRole, 'borrower.declaration.declaration_detail.homeownerpastthreeyearstype') === 'Yes',
      propertyForeclosed: getBoolean(borrowerRole, 'borrower.declaration.declaration_detail.priorpropertyforeclosurecompletedindicator'),
      partyToLawsuit: getBoolean(borrowerRole, 'borrower.declaration.declaration_detail.partytolawsuitindicator'),
      outstandingJudgements: getBoolean(borrowerRole, 'borrower.declaration.declaration_detail.outstandingjudgmentsindicator'),
      delinquent: getBoolean(borrowerRole, 'borrower.declaration.declaration_detail.presentlydelinquentindicator'),
      alimonyChildSupport: getBoolean(borrowerRole, 'borrower.declaration.declaration_detail.alimonychildsupportobligationindicator'),
      borrowingMoney: getBoolean(borrowerRole, 'borrower.declaration.declaration_detail.undisclosedborrowedfundsindicator'),
      coSigner: getBoolean(borrowerRole, 'borrower.declaration.declaration_detail.undisclosedcomakerofnoteindicator'),
      occupyAsPrimary: getValue(borrowerRole, 'borrower.declaration.declaration_detail.intenttooccupytype') === 'Yes',
      applyingForMortgage: getBoolean(borrowerRole, 'borrower.declaration.declaration_detail.undisclosedmortgageapplicationindicator'),
  };

  const income = {
      baseIncome: getNumber(getArray(borrowerRole, 'borrower.current_income.current_income_items.current_income_item').find(i => getValue(i, 'current_income_item_detail.incometype') === 'Base'), 'current_income_item_detail.currentincomemonthlytotalamount'),
      overtime: getNumber(getArray(borrowerRole, 'borrower.current_income.current_income_items.current_income_item').find(i => getValue(i, 'current_income_item_detail.incometype') === 'Overtime'), 'current_income_item_detail.currentincomemonthlytotalamount'),
      bonuses: getNumber(getArray(borrowerRole, 'borrower.current_income.current_income_items.current_income_item').find(i => getValue(i, 'current_income_item_detail.incometype') === 'Bonus'), 'current_income_item_detail.currentincomemonthlytotalamount'),
      commissions: getNumber(getArray(borrowerRole, 'borrower.current_income.current_income_items.current_income_item').find(i => getValue(i, 'current_income_item_detail.incometype') === 'Commission'), 'current_income_item_detail.currentincomemonthlytotalamount'),
      militaryEntitlements: getNumber(getArray(borrowerRole, 'borrower.current_income.current_income_items.current_income_item').find(i => getValue(i, 'current_income_item_detail.incometype') === 'MilitaryEntitlements'), 'current_income_item_detail.currentincomemonthlytotalamount'),
      otherIncome: getArray(borrowerRole, 'borrower.current_income.current_income_items.current_income_item')
          .filter(i => !['Base', 'Overtime', 'Bonus', 'Commission', 'MilitaryEntitlements'].includes(getValue(i, 'current_income_item_detail.incometype')))
          .map(i => ({
              incomeType: getValue(i, 'current_income_item_detail.otherincometypedescription') || getValue(i, 'current_income_item_detail.incometype'),
              amount: getNumber(i, 'current_income_item_detail.currentincomemonthlytotalamount')
          })),
  };

  const militaryService = {
      hasServed: getBoolean(borrowerRole, 'borrower.borrower_detail.selfdeclaredmilitaryserviceindicator'),
      isSurvivingSpouse: getBoolean(borrowerRole, 'borrower.borrower_detail.spousalvabenefitseligibilityindicator'),
  };

    const demographics = {
      ethnicity: mapEthnicity(getValue(borrowerRole, 'borrower.government_monitoring.extension.other.government_monitoring_extension.hmda_ethnicities.hmda_ethnicity.hmdaethnicitytype') || 'NotHispanicOrLatino'),
      race: mapRace(getValue(borrowerRole, 'borrower.government_monitoring.hmda_races.hmda_race.hmda_race_detail.hmdaracetype') || 'Asian'),
      gender: mapGender(getValue(borrowerRole, 'borrower.government_monitoring.government_monitoring_detail.extension.other.government_monitoring_detail_extension.hmdagendertype') || 'InformationNotProvided')
  };

  const expenses = getArray(deal, 'expenses.expense').map(exp => ({
      expenseType: getValue(exp, 'expensetype'),
      amount: getNumber(exp, 'expensemonthlypaymentamount')
  }));

    return {
      borrowerDetails,
      loanDetails,
      property,
      assets,
      debts,
      declarations,
      income,
      militaryService,
      demographics,
      expenses,
    };
}

/**
 * Map XML property types to system property types
 */
function mapPropertyType(xmlPropertyType) {
  const typeMap = {
    'PrimaryResidence': 'Single Family Home',
    'VacationHome': 'Single Family Home',
    'Investment': 'Single Family Home',
    'Condominium': 'Condominium',
    'Townhouse': 'Townhouse',
    'ManufacturedHome': 'Manufactured Home',
  };
  
  return typeMap[xmlPropertyType] || 'Single Family Home';
}

/**
 * Map marital status from XML to valid enum values
 * @param {string} xmlMaritalStatus - Marital status from XML
 * @returns {string} Valid marital status enum value
 */
function mapMaritalStatus(xmlMaritalStatus) {
  if (!xmlMaritalStatus) return 'Single'; // Default value
  
  const statusMap = {
    'unmarried': 'Single',
    'single': 'Single',
    'married': 'Married',
    'divorced': 'Divorced',
    'separated': 'Separated',
    'widowed': 'Widowed'
  };
  
  const normalized = xmlMaritalStatus.toLowerCase();
  return statusMap[normalized] || 'Single';
}

/**
 * Map asset account type from XML to valid enum values
 * @param {string} xmlAccountType - Account type from XML
 * @returns {string} Valid account type enum value
 */
function mapAccountType(xmlAccountType) {
  if (!xmlAccountType) return 'Checking'; // Default value
  
  const typeMap = {
    'checkingaccount': 'Checking',
    'checking': 'Checking',
    'savingsaccount': 'Savings',
    'savings': 'Savings',
    'moneymarket': 'Money Market',
    'money market': 'Money Market',
    'certificateofdeposit': 'Certificate of Deposit',
    'certificate of deposit': 'Certificate of Deposit',
    'cd': 'Certificate of Deposit'
  };
  
  const normalized = xmlAccountType.toLowerCase().replace(/[^a-z]/g, '');
  return typeMap[normalized] || typeMap[xmlAccountType.toLowerCase()] || 'Checking';
}

/**
 * Toggle editing permission for a loan application
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.toggleEditingPermission = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { editingEnabled } = req.body;

    // Find the loan
    const loan = await Loan.findById(id);
    
    if (!loan) {
      return next(new ApiError("Loan not found", 404));
    }

    // Update editing permission
    loan.editingEnabled = Boolean(editingEnabled);
    await loan.save();

    // Log the permission change
    logger.info(
      `Editing permission for loan ${loan.loanNumber} ${loan.editingEnabled ? 'enabled' : 'disabled'} by ${req.user.role} ${req.user._id}`
    );

    res.status(200).json({
      status: "success",
      message: `Loan editing ${loan.editingEnabled ? 'enabled' : 'disabled'} successfully`,
      data: {
        editingEnabled: loan.editingEnabled
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update loan status
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.updateLoanStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    // Frontend status mapping to backend enum values
    const statusMapping = {
      'Application Submitted': 'Application Submitted',
      'Processing': 'Processing',
      'Approved': 'Conditional Approval', // Map to existing backend enum
      'Rejected': 'Declined',  // Map "Rejected" to "Declined"
      'Closed': 'Closed'
    };

    // Validate the status value from frontend
    const validFrontendStatuses = Object.keys(statusMapping);

    if (!status || !validFrontendStatuses.includes(status)) {
      return next(new ApiError(`Invalid status value. Must be one of: ${validFrontendStatuses.join(', ')}`, 400));
    }

    // Find the loan
    const loan = await Loan.findById(id);
    
    if (!loan) {
      return next(new ApiError("Loan not found", 404));
    }

    const oldStatus = loan.status;
    
    // Map the frontend status to the corresponding backend enum value
    const backendStatus = statusMapping[status];

    // Update the loan status
    loan.status = backendStatus;
    await loan.save();

    // Log the status change
    logger.info(
      `Status for loan ${loan.loanNumber} changed from '${oldStatus}' to '${backendStatus}' (frontend: ${status}) by ${req.user.role} ${req.user._id}`
    );

    res.status(200).json({
      status: "success",
      message: `Loan status updated to ${status} successfully`,
      data: {
        status: loan.status,
        frontendStatus: status
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Send a pre-approval letter to the borrower
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.sendPreApprovalLetter = async (req, res, next) => {
  try {
    const { loanId } = req.params;
    
    // Find the loan with borrower and lender details
    const loan = await Loan.findById(loanId)
      .populate({
        path: 'borrower',
        populate: {
          path: 'user',
          select: 'firstName lastName email'
        }
      })
      .populate({
        path: 'lender',
        populate: {
          path: 'user',
          select: 'firstName lastName email phone'
        }
      });

    if (!loan) {
      return next(new ApiError("Loan not found", 404));
    }

    // Check permissions - only lenders and admins can send pre-approval letters
    if (req.user.role !== "lender" && req.user.role !== "admin") {
      return next(new ApiError("You are not authorized to send pre-approval letters", 403));
    }

    // If lender, ensure they own this loan
    if (req.user.role === "lender") {
      const lender = await Lender.findOne({ user: req.user._id });
      if (!lender || !loan.lender.equals(lender._id)) {
        return next(new ApiError("You are not authorized to access this loan", 403));
      }
    }

    // Ensure borrower has an email
    if (!loan.borrower || !loan.borrower.user || !loan.borrower.user.email) {
      return next(new ApiError("Borrower email not found", 400));
    }

    // Get the borrower's email and name
    const borrowerEmail = loan.borrower.user.email;
    const borrowerName = `${loan.borrower.firstName || loan.borrower.user.firstName || ''} ${loan.borrower.lastName || loan.borrower.user.lastName || ''}`.trim();
    
    // Get lender information
    const lenderName = loan.lender?.companyName || 'Our Lending Company';
    const loanOfficerName = `${loan.lender?.user?.firstName || ''} ${loan.lender?.user?.lastName || ''}`.trim() || 'Your Loan Officer';
    const loanOfficerEmail = loan.lender?.user?.email || req.user.email || '';
    const loanOfficerPhone = loan.lender?.user?.phone || loan.lender?.phone || '';

    // Set approval date and expiration date (90 days from now)
    const approvalDate = new Date();
    const expirationDate = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000); // 90 days from now

    // Get loan details
    const loanAmount = loan.loanDetails?.loanAmount || loan.loanDetails?.requestedLoanAmount || 0;
    const loanType = loan.loanDetails?.loanType || 'Mortgage';
    
    // Import email service
    const emailService = require('../utils/email/emailService');
    
    // Send pre-approval letter
    const emailResult = await emailService.sendPreApprovalLetter({
      email: borrowerEmail,
      borrowerName,
      loanNumber: loan.loanNumber,
      loanAmount,
      loanType,
      lenderName,
      loanOfficerName,
      loanOfficerEmail,
      loanOfficerPhone,
      approvalDate,
      expirationDate
    });

    if (!emailResult.success) {
      return next(new ApiError(`Failed to send pre-approval letter: ${emailResult.error}`, 500));
    }

    // Update loan status to 'Conditional Approval' if not already approved
    if (!['Approved', 'Conditional Approval', 'Clear to Close', 'Funded', 'Closed'].includes(loan.status)) {
      loan.status = 'Conditional Approval';
      await loan.save();
      
      // Log the status change
      logger.info(`Loan ${loan.loanNumber} status updated to Conditional Approval after sending pre-approval letter`);
    }

    // Log the pre-approval letter sending
    logger.info(`Pre-approval letter sent for loan ${loan.loanNumber} to ${borrowerEmail}`);

    // Return success response
    res.status(200).json({
      status: 'success',
      message: 'Pre-approval letter sent successfully',
      data: {
        sentTo: borrowerEmail,
        loanNumber: loan.loanNumber,
        loanStatus: loan.status
      }
    });
  } catch (error) {
    logger.error('Error sending pre-approval letter:', error);
    next(error);
  }
};

