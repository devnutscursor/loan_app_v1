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

// Check if we should use S3 or local storage
const USE_S3 = process.env.USE_S3 === 'true' || false;

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
      const { createDefaultMilestonesForLoan } = require('../utils/defaultMilestones');
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
    const { createDefaultMilestonesForLoan } = require('../utils/defaultMilestones');
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
  try {
    // Check if file was uploaded
    if (!req.file) {
      return next(new ApiError("No XML file uploaded", 400));
    }

    // Log file information to help debug
    logger.info(`Processing XML file: ${JSON.stringify({
      filename: req.file.originalname,
      path: req.file.path,
      s3Key: req.file.key,
      s3Bucket: req.file.bucket,
      mimetype: req.file.mimetype,
      size: req.file.size
    })}`);

    // Validate file for both S3 and local storage
    const USE_S3 = process.env.USE_S3 === 'true' || false;
    
    // For S3 storage, we need key and bucket (or buffer)
    // For local storage, we need path
    if (USE_S3 && !req.file.key && !req.file.buffer) {
      return next(new ApiError(`Missing S3 file key or buffer`, 400));
    } else if (!USE_S3 && (!req.file.path || !fs.existsSync(req.file.path))) {
      return next(new ApiError(`Invalid file path: ${req.file.path}`, 400));
    }

    // Validate file type
    if (!req.file.originalname.toLowerCase().endsWith('.xml')) {
      return next(new ApiError("Please upload an XML file", 400));
    }

    // Read and parse XML file
    let xmlContent;

    try {
      const { readFile } = require('../services/s3.service');
      const fileBuffer = await readFile(req.file);
      xmlContent = fileBuffer.toString('utf8');
      logger.info('Successfully read XML file content');
    } catch (readError) {
      logger.error('Error reading XML file:', readError);
      return next(new ApiError(`Failed to read XML file: ${readError.message}`, 500));
    }

    const parser = new xml2js.Parser({ 
      explicitArray: false,
      mergeAttrs: true,
      normalizeTags: true
    });
    
    const parsedXML = await parser.parseStringPromise(xmlContent);
    
    // Extract loan data from parsed XML
    const extractedData = extractLoanDataFromXML(parsedXML);
    
    // Get user and determine permissions
    let lenderId;
    if (req.user.role === "lender") {
      const lender = await Lender.findOne({ user: req.user._id });
      if (!lender) {
        return next(new ApiError("Lender profile not found", 404));
      }
      lenderId = lender._id;
    } else if (req.user.role === "admin") {
      // For admin, require lender ID in request body
      if (!req.body.lenderId) {
        return next(new ApiError("Lender ID is required for admin users", 400));
      }
      lenderId = req.body.lenderId;
    } else {
      return next(new ApiError("Only lenders and admins can import XML loans", 403));
    }

    // Handle borrower selection from frontend
    let borrower;
    
    // If a specific borrower ID was provided, use that
    if (req.body.borrowerId) {
      borrower = await Borrower.findById(req.body.borrowerId);
      
      if (!borrower) {
        return next(new ApiError("Selected borrower not found", 404));
      }
      
      // Log that we're using an existing borrower
      logger.info(`Using existing borrower (ID: ${borrower._id}) for XML import by user: ${req.user._id}`);
    }
    // If explicitly requested to create a new borrower
    else if (req.body.createNewBorrower === 'true') {
      // Parse borrower data if provided
      let borrowerData = extractedData.borrowerDetails;
      if (req.body.borrowerData) {
        try {
          const providedData = JSON.parse(req.body.borrowerData);
          // Merge provided data with extracted data, preferring provided data
          borrowerData = { ...borrowerData, ...providedData };
        } catch (error) {
          logger.error('Error parsing borrower data JSON:', error);
        }
      }
      
      // First check if a user with this email already exists
      let existingUser = null;
      if (borrowerData.email) {
        existingUser = await User.findOne({ email: borrowerData.email });
        if (existingUser) {
          logger.info(`User with email ${borrowerData.email} already exists. Using existing user.`);
          
          // Check if this user already has a borrower profile
          borrower = await Borrower.findOne({ user: existingUser._id });
          
          if (borrower) {
            logger.info(`Existing borrower found for user ${existingUser._id}. Using existing borrower.`);
            return next(new ApiError(`A borrower with email ${borrowerData.email} already exists. Please select that borrower instead of creating a new one.`, 400));
          }
        }
      }

      // If no existing user, create a new one
      if (!existingUser) {
        // Generate a temporary password for XML imported users
        const bcrypt = require('bcryptjs');
        const tempPassword = Math.random().toString(36).slice(-8);
        const hashedPassword = await bcrypt.hash(tempPassword, 12);

        // Create new user with a unique email if needed
        const newUser = new User({
          email: borrowerData.email || `imported.${Date.now()}.${Math.random().toString(36).substring(2, 8)}@example.com`,
          firstName: borrowerData.firstName || 'Unknown',
          lastName: borrowerData.lastName || 'User',
          password: hashedPassword,
          role: 'borrower',
          isEmailVerified: false,
          isImportedFromXML: true // Flag to identify XML imports
        });
        
        try {
          await newUser.save();
          existingUser = newUser;
        } catch (userError) {
          logger.error('Error creating user:', userError);
          return next(new ApiError(`Failed to create user: ${userError.message}`, 400));
        }
      }
      
      // Validate date fields before saving
      let dateOfBirth = null;
      if (borrowerData.dateOfBirth) {
        try {
          const parsedDate = new Date(borrowerData.dateOfBirth);
          dateOfBirth = isNaN(parsedDate.getTime()) ? null : parsedDate;
        } catch (dateError) {
          logger.warn(`Invalid date format for dateOfBirth: ${borrowerData.dateOfBirth}`);
          dateOfBirth = null;
        }
      }
      
      // Create the borrower record
      borrower = new Borrower({
        user: existingUser._id,
        lender: lenderId,
        firstName: borrowerData.firstName || 'Unknown',
        lastName: borrowerData.lastName || 'User',
        email: borrowerData.email || existingUser.email,
        phone: borrowerData.phone || '',
        dateOfBirth: dateOfBirth,
        ssn: borrowerData.ssn || '',
        maritalStatus: mapMaritalStatus(borrowerData.maritalStatus),
        dependents: borrowerData.dependentCount || 0
      });
      
      try {
        await borrower.save();
        logger.info(`Created new borrower (ID: ${borrower._id}) for XML import by user: ${req.user._id}`);
      } catch (borrowerError) {
        logger.error('Error creating borrower:', borrowerError);
        return next(new ApiError(`Failed to create borrower: ${borrowerError.message}`, 400));
      }
    }
    // If no selection was made, try to find matching borrower by email
    else {
      borrower = await Borrower.findOne({ 
        email: extractedData.borrowerDetails.email,
        lender: lenderId 
      });
      
      // If no matching borrower found, create a new one
      if (!borrower) {
        // Check if user with email exists already
        let existingUser = null;
        if (extractedData.borrowerDetails.email) {
          existingUser = await User.findOne({ email: extractedData.borrowerDetails.email });
        }
        
        if (!existingUser) {
          // Generate a temporary password for XML imported users
          const bcrypt = require('bcryptjs');
          const tempPassword = Math.random().toString(36).slice(-8);
          const hashedPassword = await bcrypt.hash(tempPassword, 12);

          // Create new user with a unique email
          const newUser = new User({
            email: extractedData.borrowerDetails.email || `imported.${Date.now()}.${Math.random().toString(36).substring(2, 8)}@example.com`,
            firstName: extractedData.borrowerDetails.firstName || 'Unknown',
            lastName: extractedData.borrowerDetails.lastName || 'User',
            password: hashedPassword,
            role: 'borrower',
            isEmailVerified: false,
            isImportedFromXML: true // Flag to identify XML imports
          });
          
          try {
            await newUser.save();
            existingUser = newUser;
          } catch (userError) {
            logger.error('Error creating user:', userError);
            return next(new ApiError(`Failed to create user: ${userError.message}`, 400));
          }
        } else {
          logger.info(`Using existing user with email ${existingUser.email} for XML import`);
        }
        
        // Validate date fields before saving
        let dateOfBirth = null;
        if (extractedData.borrowerDetails.dateOfBirth) {
          try {
            const parsedDate = new Date(extractedData.borrowerDetails.dateOfBirth);
            dateOfBirth = isNaN(parsedDate.getTime()) ? null : parsedDate;
          } catch (dateError) {
            logger.warn(`Invalid date format for dateOfBirth: ${extractedData.borrowerDetails.dateOfBirth}`);
            dateOfBirth = null;
          }
        }
        
        borrower = new Borrower({
          user: existingUser._id,
          lender: lenderId,
          firstName: extractedData.borrowerDetails.firstName || 'Unknown',
          lastName: extractedData.borrowerDetails.lastName || 'User',
          email: extractedData.borrowerDetails.email || existingUser.email,
          phone: extractedData.borrowerDetails.phone || '',
          dateOfBirth: dateOfBirth,
          ssn: extractedData.borrowerDetails.ssn || '',
          maritalStatus: mapMaritalStatus(extractedData.borrowerDetails.maritalStatus),
          dependents: extractedData.borrowerDetails.dependentCount || 0
        });
        
        try {
          await borrower.save();
          logger.info(`Created new borrower (ID: ${borrower._id}) for XML import by user: ${req.user._id} (no matching email found)`);
        } catch (borrowerError) {
          logger.error('Error creating borrower:', borrowerError);
          return next(new ApiError(`Failed to create borrower: ${borrowerError.message}`, 400));
        }
      } else {
        logger.info(`Found matching borrower by email (ID: ${borrower._id}) for XML import by user: ${req.user._id}`);
      }
    }

    // Create loan with extracted data
    const newLoan = new Loan({
      borrower: borrower._id,
      lender: lenderId,
      
      // Borrower details
      borrowerDetails: extractedData.borrowerDetails,
      
      // Loan details
      loanDetails: extractedData.loanDetails,
      
      // Property information
      property: extractedData.property,
      
      // Financial information
      income: extractedData.income,
      assets: extractedData.assets,
      debts: extractedData.debts,
      
      // Employment history
      employmentHistory: extractedData.employmentHistory,
      
      // Residence history
      residenceHistory: extractedData.residenceHistory,
      
      // Additional information
      militaryService: extractedData.militaryService,
      declarations: extractedData.declarations,
      demographics: extractedData.demographics,
        // Metadata
      source: 'XML_IMPORT',
      status: 'Application Started',
      createdBy: req.user._id,
      
      // Store original filename for reference
      originalXMLFile: req.file.originalname,
      // If using S3, store the S3 key for reference
      s3Key: req.file.key,
      s3Bucket: req.file.bucket
    });

    await newLoan.save();

    // Clean up uploaded file only if it's a local file
    if (req.file.path && !USE_S3 && fs.existsSync(req.file.path)) {
      logger.info(`Removing temporary file: ${req.file.path}`);
      fs.unlinkSync(req.file.path);
    } else if (USE_S3) {
      // For S3 uploads, we don't need to delete the file as it serves as a backup
      logger.info(`S3 file preserved as backup`);
    }

    logger.info(`Loan imported from XML by user: ${req.user._id}, loan ID: ${newLoan._id}`);

    res.status(201).json({
      status: "success",
      message: "Loan imported successfully from XML",
      data: newLoan
    });

  } catch (error) {
    // Clean up uploaded file on error, but only for local files
    if (req.file && req.file.path && !USE_S3 && fs.existsSync(req.file.path)) {
      logger.info(`Removing temporary file due to error: ${req.file.path}`);
      fs.unlinkSync(req.file.path);
    }
    
    logger.error('Error importing XML loan:', error);
    next(error);
  }
};

/**
 * Extract loan data from parsed XML
 * @param {Object} parsedXML - Parsed XML object
 * @returns {Object} Extracted loan data
 */
function extractLoanDataFromXML(parsedXML) {
  try {
    // Helper function to safely get nested values
    const getValue = (obj, path, defaultValue = '') => {
      return path.split('.').reduce((current, key) => {
        return current && current[key] !== undefined ? current[key] : defaultValue;
      }, obj);
    };

    // Helper function to get number safely
    const getNumber = (obj, path, defaultValue = 0) => {
      const value = getValue(obj, path);
      const num = parseFloat(value);
      return isNaN(num) ? defaultValue : num;
    };

    const message = parsedXML.message || parsedXML;
    const deal = getValue(message, 'deal_sets.deal_set.deals.deal') || 
                 getValue(message, 'deal_sets.deal_set.deals[0].deal') ||
                 getValue(message, 'deal_sets[0].deal_set.deals.deal');

    // Extract parties (borrower information)
    const parties = getValue(deal, 'parties.party') || [];
    const borrowerParty = Array.isArray(parties) ? 
      parties.find(party => getValue(party, 'roles.role.role_detail.partyroletype') === 'Borrower') :
      (getValue(parties, 'roles.role.role_detail.partyroletype') === 'Borrower' ? parties : null);

    // Extract borrower details
    const individual = getValue(borrowerParty, 'individual') || {};
    const borrowerRole = getValue(borrowerParty, 'roles.role') || {};
    const borrowerDetail = getValue(borrowerRole, 'borrower.borrower_detail') || {};
    
    const borrowerData = {
      firstName: getValue(individual, 'name.firstname'),
      lastName: getValue(individual, 'name.lastname'),
      fullName: getValue(individual, 'name.fullname'),
      email: getValue(individual, 'contact_points.contact_point.contact_point_email.contactpointemailvalue') ||
             getValue(individual, 'contact_points[0].contact_point_email.contactpointemailvalue'),
      phone: getValue(individual, 'contact_points.contact_point.contact_point_telephone.contactpointtelephonevalue') ||
             getValue(individual, 'contact_points[1].contact_point_telephone.contactpointtelephonevalue'),
      dateOfBirth: getValue(borrowerDetail, 'borrowerbirthdate'),
      ssn: getValue(borrowerParty, 'taxpayer_identifiers.taxpayer_identifier.taxpayeridentifiervalue'),
      maritalStatus: getValue(borrowerDetail, 'maritalstatustype'),
      dependentCount: getNumber(borrowerDetail, 'dependentcount'),
    };

    // Extract employment information
    const employers = getValue(borrowerRole, 'borrower.employers.employer') || [];
    const primaryEmployer = Array.isArray(employers) ? employers[0] : employers;
    
    const employmentHistory = [];
    if (primaryEmployer) {
      employmentHistory.push({
        employerName: getValue(primaryEmployer, 'legal_entity.legal_entity_detail.fullname'),
        position: getValue(primaryEmployer, 'employment.employmentpositiondescription'),
        monthlyIncome: getNumber(primaryEmployer, 'employment.employmentmonthlyincomeamount'),
        startDate: getValue(primaryEmployer, 'employment.employmentstartdate'),
        isSelfEmployed: getValue(primaryEmployer, 'employment.employmentborrowerselfemployedindicator') === 'true',
        employmentType: getValue(primaryEmployer, 'employment.employmentclassificationtype'),
        workPhone: getValue(primaryEmployer, 'legal_entity.contacts.contact.contact_points.contact_point.contact_point_telephone.contactpointtelephonevalue'),
        workAddress: {
          streetAddress: getValue(primaryEmployer, 'address.addresslinetext'),
          city: getValue(primaryEmployer, 'address.cityname'),
          state: getValue(primaryEmployer, 'address.statecode'),
          zipCode: getValue(primaryEmployer, 'address.postalcode'),
        }
      });
    }

    // Extract income information
    const currentIncomeItems = getValue(borrowerRole, 'borrower.current_income.current_income_items.current_income_item') || [];
    const incomeItems = Array.isArray(currentIncomeItems) ? currentIncomeItems : [currentIncomeItems];
    
    const income = {
      baseIncome: 0,
      overtime: 0,
      commissions: 0,
      bonuses: 0,
      militaryEntitlements: 0,
      otherIncome: []
    };

    incomeItems.forEach(item => {
      const incomeType = getValue(item, 'current_income_item_detail.incometype');
      const amount = getNumber(item, 'current_income_item_detail.currentincomemonthlytotalamount') * 12; // Convert to yearly
      
      switch (incomeType?.toLowerCase()) {
        case 'base':
          income.baseIncome = amount;
          break;
        case 'overtime':
          income.overtime = amount;
          break;
        case 'commissions':
          income.commissions = amount;
          break;
        case 'bonus':
          income.bonuses = amount;
          break;
        default:
          if (amount > 0) {
            income.otherIncome.push({
              type: incomeType || 'Other',
              amount: amount
            });
          }
      }
    });

    // Extract assets
    const assetList = getValue(deal, 'assets.asset') || [];
    const assets = {
      checkingAndSavings: [],
      stocksAndBonds: [],
      miscellaneous: []
    };

    const assetArray = Array.isArray(assetList) ? assetList : [assetList];
    assetArray.forEach(asset => {
      if (!asset) return;
      
      const assetType = getValue(asset, 'asset_detail.assettype');
      const value = getNumber(asset, 'asset_detail.assetcashormarketvalueamount');
      const institution = getValue(asset, 'asset_holder.name.fullname');      if (value > 0) {
        switch (assetType?.toLowerCase()) {
          case 'checkingaccount':
          case 'savingsaccount':
          case 'checking':
          case 'savings':
          case 'moneymarket':
          case 'certificateofdeposit':
            assets.checkingAndSavings.push({
              bankName: institution,
              accountType: mapAccountType(assetType),
              value: value,
              isVerified: false,
              isLiquid: true
            });
            break;
          case 'stock':
          case 'bond':
          case 'mutualfund':
            assets.stocksAndBonds.push({
              description: assetType || 'Investment',
              value: value,
              isVerified: false
            });
            break;
          default:
            assets.miscellaneous.push({
              description: assetType || 'Other Asset',
              value: value,
              assetType: assetType === 'GiftOfCash' ? 'Gift' : 'Other'
            });
        }
      }
    });

    // Extract debts/liabilities
    const liabilityList = getValue(deal, 'liabilities.liability') || [];
    const debts = [];
    
    const liabilityArray = Array.isArray(liabilityList) ? liabilityList : [liabilityList];
    liabilityArray.forEach(liability => {
      if (!liability) return;
      
      const monthlyPayment = getNumber(liability, 'liability_detail.liabilitymonthlyPaymentamount');
      if (monthlyPayment > 0) {
        debts.push({
          creditorName: getValue(liability, 'liability_holder.name.fullname'),
          accountNumber: '',
          debtType: getValue(liability, 'liability_detail.liabilitytype'),
          monthlyPayment: monthlyPayment,
          balance: getNumber(liability, 'liability_detail.liabilityunpaidbalanceamount'),
          willBePaidOff: getValue(liability, 'liability_detail.liabilitypayoffstatusindicator') === 'true'
        });
      }
    });

    // Extract loan details
    const loan = getValue(deal, 'loans.loan') || {};
    const termsOfLoan = getValue(loan, 'terms_of_loan') || {};
    
    const loanDetails = {
      loanType: getValue(termsOfLoan, 'loanpurposetype') || 'Purchase',
      loanAmount: getNumber(termsOfLoan, 'baseloanamount'),
      interestRate: getNumber(termsOfLoan, 'noteratepercent'),
      loanTerm: getNumber(loan, 'amortization.amortization_rule.loanamortizationperiodcount') / 12, // Convert months to years
    };

    // Extract property information
    const collateral = getValue(deal, 'collaterals.collateral.subject_property') || {};
    const propertyAddress = getValue(collateral, 'address') || {};
    
    const property = {
      streetAddress: getValue(propertyAddress, 'addresslinetext'),
      city: getValue(propertyAddress, 'cityname'),
      state: getValue(propertyAddress, 'statecode'),
      zipCode: getValue(propertyAddress, 'postalcode'),
      propertyType: mapPropertyType(getValue(collateral, 'property_detail.propertyusagetype')),
      propertyValue: getNumber(collateral, 'property_detail.propertyestimatedvalueamount'),
      occupancyType: 'Primary Residence', // Default
    };

    // If loan is purchase, set purchase price
    if (loanDetails.loanType?.toLowerCase() === 'purchase') {
      loanDetails.purchasePrice = getNumber(collateral, 'sales_contracts.sales_contract.sales_contract_detail.salescontractamount');
    }

    // Extract residence history
    const residences = getValue(borrowerRole, 'borrower.residences.residence') || [];
    const residenceArray = Array.isArray(residences) ? residences : [residences];
    const residenceHistory = residenceArray.map(residence => ({
      address: {
        streetAddress: getValue(residence, 'address.addresslinetext'),
        city: getValue(residence, 'address.cityname'),
        state: getValue(residence, 'address.statecode'),
        zipCode: getValue(residence, 'address.postalcode'),
      },
      residencyType: getValue(residence, 'residence_detail.borrowerresidencytype') || 'Current',
      monthlyRent: getNumber(residence, 'landlord.landlord_detail.monthlyrentamount'),
      ownOrRent: getValue(residence, 'residence_detail.borrowerresidencybasistype') === 'Own' ? 'Own' : 'Rent'
    }));

    // Extract military service
    const militaryServices = getValue(borrowerRole, 'borrower.military_services.military_service') || {};
    const militaryService = {
      hasServed: getValue(borrowerDetail, 'selfdeclaredmilitaryserviceindicator') === 'true',
      serviceType: getValue(militaryServices, 'militarystatustype'),
      isVeteran: false,
      isActiveReserve: getValue(militaryServices, 'militarystatustype')?.includes('Reserve') || false
    };

    // Extract declarations
    const declarationDetail = getValue(borrowerRole, 'borrower.declaration.declaration_detail') || {};
    const declarations = {
      bankruptcyIndicator: getValue(declarationDetail, 'bankruptcyindicator') === 'true',
      foreclosureIndicator: getValue(declarationDetail, 'priorpropertyforeclosurecompletedIndicator') === 'true',
      shortSaleIndicator: getValue(declarationDetail, 'priorpropertyshortSalecompletedIndicator') === 'true',
      lawsuitIndicator: getValue(declarationDetail, 'partytolawsuitindicator') === 'true',
      delinquentIndicator: getValue(declarationDetail, 'presentlydelinquentindicator') === 'true',
      judgmentIndicator: getValue(declarationDetail, 'outstandingjudgmentsindicator') === 'true',
      undisclosedBorrowedFunds: getValue(declarationDetail, 'undisclosedborrowedfundsindicator') === 'true',
      undisclosedBorrowedFundsAmount: getNumber(declarationDetail, 'undisclosedborrowedfundsamount'),
    };

    // Extract demographics
    const governmentMonitoring = getValue(borrowerRole, 'borrower.government_monitoring') || {};
    const demographics = {
      ethnicity: getValue(governmentMonitoring, 'hmda_ethnicity_origins.hmda_ethnicity_origin.hmdaethnicityorigintype'),
      race: getValue(governmentMonitoring, 'hmda_races.hmda_race.hmda_race_detail.hmdaracetype'),
      sex: getValue(governmentMonitoring, 'government_monitoring_detail.extension.other.government_monitoring_detail_extension.hmdagendertype'),
    };

    return {
      borrowerDetails: borrowerData,
      income,
      assets,
      debts,
      loanDetails,
      property,
      employmentHistory,
      residenceHistory,
      militaryService,
      declarations,
      demographics
    };

  } catch (error) {
    logger.error('Error extracting XML data:', error);
    throw new ApiError('Failed to extract loan data from XML file', 400);
  }
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
